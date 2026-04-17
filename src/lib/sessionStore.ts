/**
 * TASK 1: PostgreSQL + Redis Hybrid Session Store
 *
 * Strategy:
 *  - Sessions are persisted to PostgreSQL (Session model) — survive Redis restart
 *  - Redis is written alongside Postgres for fast reads (cache-aside)
 *  - On Redis miss, Postgres is the authoritative fallback
 *  - Existing JWTs in flight are NOT revoked (zero forced logouts)
 *
 * Used by: auth.routes.ts (storeRefreshToken, revokeAllRefreshTokens)
 *          auth.middleware.ts (validateSession on protected routes)
 */

import { prisma } from './prisma'
import { redis } from './redis'
import { logger } from './logger'

// Redis TTL mirrors JWT refresh token lifespan (7 days in seconds)
const REFRESH_TTL_SECONDS = 7 * 24 * 3600

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Store a refresh token session in both Postgres and Redis.
 * Called after successful login / register / token refresh.
 */
export async function storeSession(userId: string, jti: string): Promise<void> {
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000)

  // 1. Persist to Postgres (authoritative)
  try {
    await prisma.session.upsert({
      where: { jti },
      create: { userId, jti, expiresAt },
      update: { expiresAt },
    })
  } catch (err) {
    logger.error('Session DB write failed:', err)
    throw err // Surface: if DB fails, don't silently succeed
  }

  // 2. Mirror to Redis (best-effort cache; do NOT throw on failure)
  try {
    await redis.setex(`sess:${userId}:${jti}`, REFRESH_TTL_SECONDS, '1')
  } catch (err) {
    logger.warn('Session Redis cache write failed (DB is authoritative):', err)
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Check if a session (jti) is valid.
 * Cache-aside pattern: Redis → Postgres fallback.
 */
export async function sessionExists(userId: string, jti: string): Promise<boolean> {
  // 1. Try Redis first (fast path)
  try {
    const cached = await redis.get(`sess:${userId}:${jti}`)
    if (cached !== null) return true
  } catch {
    logger.warn('Redis miss during session lookup — falling back to Postgres')
  }

  // 2. Authoritative DB fallback (handles Redis restarts)
  try {
    const session = await prisma.session.findUnique({
      where: { jti },
      select: { id: true, expiresAt: true },
    })
    if (!session) return false
    if (session.expiresAt < new Date()) {
      // Lazy delete expired session
      await prisma.session.delete({ where: { jti } }).catch(() => null)
      return false
    }
    // Warm Redis back up so next request is fast
    const ttl = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
    if (ttl > 0) {
      await redis.setex(`sess:${userId}:${jti}`, ttl, '1').catch(() => null)
    }
    return true
  } catch (err) {
    logger.error('Session DB lookup failed:', err)
    return false
  }
}

// ─── Revoke ───────────────────────────────────────────────────────────────────

/**
 * Revoke all sessions for a user (logout, password reset).
 * Deletes from both Postgres and Redis.
 */
export async function revokeAllSessions(userId: string): Promise<void> {
  // 1. Delete from Postgres
  try {
    await prisma.session.deleteMany({ where: { userId } })
  } catch (err) {
    logger.error('Session DB delete failed:', err)
  }

  // 2. Best-effort Redis cleanup
  try {
    let cursor = '0'
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `sess:${userId}:*`, 'COUNT', '100')
      cursor = nextCursor
      if (keys.length > 0) await redis.del(...keys)
    } while (cursor !== '0')
  } catch (err) {
    logger.warn('Redis session cleanup failed (DB already cleared):', err)
  }
}

/**
 * Revoke a single session (e.g. on token rotation).
 */
export async function revokeSingleSession(userId: string, jti: string): Promise<void> {
  try {
    await prisma.session.delete({ where: { jti } })
  } catch {
    // Already gone — safe to ignore
  }
  try {
    await redis.del(`sess:${userId}:${jti}`)
  } catch {
    // Best effort
  }
}

// ─── Housekeeping ─────────────────────────────────────────────────────────────

/**
 * Purge expired sessions from Postgres. Run on a cron (e.g. nightly).
 * Redis entries expire automatically via TTL.
 */
export async function pruneExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
    logger.info(`Session prune: removed ${result.count} expired sessions`)
    return result.count
  } catch (err) {
    logger.error('Session prune failed:', err)
    return 0
  }
}
