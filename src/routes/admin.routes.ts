/**
 * TASK 2: Admin ClientConfig routes
 *
 * ADMIN only: GET/PATCH per-company reconciliation settings.
 * Currently manages dateToleranceDays (0–7, default 2).
 *
 * AuditLog written on every change (before/after JSON).
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { NotFoundError } from '../lib/errors'

const router = Router()
router.use(authenticate)

const updateClientConfigSchema = z.object({
  dateToleranceDays: z.number().int().min(0).max(7),
})

// ─── GET /api/admin/client-config ────────────────────────────────────────────
// Fetch the ClientConfig for the requester's company (creates default if missing)
router.get('/client-config', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await prisma.clientConfig.upsert({
      where: { companyId: req.user!.companyId },
      create: { companyId: req.user!.companyId, dateToleranceDays: 2 },
      update: {},
    })
    res.json({ success: true, data: config })
  } catch (err) { next(err) }
})

// ─── PATCH /api/admin/client-config ──────────────────────────────────────────
// Update tolerance. Creates record if it doesn't exist (idempotent).
router.patch(
  '/client-config',
  authorize('ADMIN'),
  validate(updateClientConfigSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dateToleranceDays } = req.body

      // Read before state (for AuditLog)
      const existing = await prisma.clientConfig.findUnique({
        where: { companyId: req.user!.companyId },
      })

      const updated = await prisma.$transaction(async (tx) => {
        const config = await tx.clientConfig.upsert({
          where: { companyId: req.user!.companyId },
          create: { companyId: req.user!.companyId, dateToleranceDays },
          update: { dateToleranceDays },
        })

        await tx.auditLog.create({
          data: {
            userId: req.user!.sub,
            action: 'CLIENT_CONFIG_UPDATE',
            entityType: 'ClientConfig',
            entityId: config.id,
            before: existing ? { dateToleranceDays: existing.dateToleranceDays } as any : null,
            after: { dateToleranceDays } as any,
            ipAddress: req.ip,
          },
        })

        return config
      })

      res.json({
        success: true,
        message: `Date tolerance updated to ±${dateToleranceDays} days`,
        data: updated,
      })
    } catch (err) { next(err) }
  }
)

export default router
