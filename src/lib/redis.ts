import Redis from 'ioredis'
import { logger } from './logger'

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  maxRetriesPerRequest: 3,
  lazyConnect: false,
})

redis.on('error', (err) => logger.error('Redis error:', err))

const DEFAULT_TTL = Number(process.env.REDIS_TTL_SECONDS) || 300

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key)
    return value ? (JSON.parse(value) as T) : null
  } catch { return null }
}

export async function cacheSet(key: string, value: unknown, ttl = DEFAULT_TTL): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value))
  } catch (err) { logger.warn('Cache set failed:', err) }
}

// ✅ FIXED: Use SCAN instead of KEYS (non-blocking)
export async function cacheDel(pattern: string): Promise<void> {
  try {
    let cursor = '0'
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', '100')
      cursor = nextCursor
      if (keys.length > 0) await redis.del(...keys)
    } while (cursor !== '0')
  } catch (err) { logger.warn('Cache delete failed:', err) }
}
