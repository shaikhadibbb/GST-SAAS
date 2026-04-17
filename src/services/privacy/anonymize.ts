/**
 * TASK 5: DPDP Act 2023 — Anonymization Service
 *
 * Anonymizes vendor GSTINs in GSTR2A entries older than 7 years.
 * Pattern: Replace first 11 chars with SHA-256 hash prefix, keep last 4 for pattern analysis.
 *
 * Example: 27AAPFU0939F1ZV → ANON_a3f2c1d9_1ZV + last 4
 * Result:  ANON_a3f2c1d9_1ZV  (still searchable for filing patterns)
 */

import crypto from 'crypto'
import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'

const SEVEN_YEARS_MS = 7 * 365.25 * 24 * 60 * 60 * 1000

/**
 * Deterministic anonymization of a GSTIN.
 * Same GSTIN always produces same hash → consistent pattern analysis.
 * Last 4 chars preserved for GST filing pattern detection.
 */
export function anonymizeGSTIN(gstin: string): string {
  if (!gstin || gstin.startsWith('ANON_')) return gstin // Already anonymized

  const hash = crypto
    .createHash('sha256')
    .update(gstin + (process.env.ANONYMIZE_SALT || 'gstpro_anon_v1'))
    .digest('hex')
    .substring(0, 8)

  const last4 = gstin.slice(-4)
  return `ANON_${hash}_${last4}`
}

/**
 * Run DPDP anonymization sweep on GSTR2A entries older than 7 years.
 * Processes in batches of 100 to avoid memory pressure.
 * Safe to re-run — already-anonymized records are left untouched.
 */
export async function runGSTINAnonymization(): Promise<{
  processed: number
  anonymized: number
  errors: number
}> {
  const cutoff = new Date(Date.now() - SEVEN_YEARS_MS)
  let cursor: string | undefined
  let processed = 0
  let anonymized = 0
  let errors = 0

  logger.info(`DPDP: Starting GSTIN anonymization for entries before ${cutoff.toISOString()}`)

  do {
    const entries = await prisma.gSTR2AEntry.findMany({
      where: {
        createdAt: { lt: cutoff },
        // Skip already anonymized
        gstin: { not: { startsWith: 'ANON_' } },
      },
      take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'asc' },
      select: { id: true, gstin: true, supplierGSTIN: true },
    })

    if (entries.length === 0) break
    cursor = entries[entries.length - 1].id

    for (const entry of entries) {
      try {
        await prisma.gSTR2AEntry.update({
          where: { id: entry.id },
          data: {
            gstin: anonymizeGSTIN(entry.gstin),
            supplierGSTIN: entry.supplierGSTIN ? anonymizeGSTIN(entry.supplierGSTIN) : null,
          },
        })
        anonymized++
      } catch (err) {
        logger.error(`DPDP: Failed to anonymize entry ${entry.id}:`, err)
        errors++
      }
      processed++
    }

    logger.info(`DPDP: anonymized ${anonymized}/${processed} entries so far...`)
  } while (true) // eslint-disable-line no-constant-condition

  logger.info(`DPDP anonymization complete: processed=${processed} anonymized=${anonymized} errors=${errors}`)
  return { processed, anonymized, errors }
}

/**
 * Export all data for a user (DPDP right-to-access / data portability).
 * Returns JSON of all personal data across tables.
 */
export async function exportUserData(userId: string): Promise<Record<string, unknown>> {
  const [user, auditLogs, consentLogs, sessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        verified: true,
        createdAt: true,
        deletionRequestedAt: true,
        company: { select: { name: true, gstin: true, pan: true, stateCode: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
    prisma.consentLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.session.findMany({
      where: { userId },
      select: { jti: true, expiresAt: true, createdAt: true },
    }),
  ])

  return {
    exportedAt: new Date().toISOString(),
    dpdpVersion: '2023',
    user,
    consentLogs,
    activeSessions: sessions,
    auditLogs: auditLogs.map((log) => ({
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      createdAt: log.createdAt,
      ipAddress: log.ipAddress,
      // Omit before/after to prevent data leakage to other entities
    })),
  }
}
