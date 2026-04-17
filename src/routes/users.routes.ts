/**
 * TASK 5: DPDP Act 2023 — User Data & Privacy Routes
 *
 * Endpoints:
 *  GET  /api/users/me/export             — Export own data (any authenticated user)
 *  POST /api/users/me/consent            — Log consent for a purpose
 *  GET  /api/users/me/consents           — View own consent history
 *  POST /api/users/:id/request-deletion  — ADMIN: schedule hard delete (30-day delay)
 *  POST /api/users/:id/cancel-deletion   — ADMIN: cancel pending deletion
 *  POST /api/admin/dpdp/anonymize        — ADMIN: trigger GSTIN anonymization sweep
 *
 * Constraints:
 *  - No soft delete: DPDP requests become hard deletes after 30 days
 *  - Existing users: grandfathered (implied consent logged, not blocked)
 *  - AuditLog written on every action
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { exportUserData, runGSTINAnonymization } from '../services/privacy/anonymize'
import { ForbiddenError, NotFoundError, ValidationError, AppError } from '../lib/errors'
import { logger } from '../lib/logger'

const router = Router()
router.use(authenticate)

const consentSchema = z.object({
  purpose: z.enum(['INVOICE_PROCESSING', 'VENDOR_RECONCILIATION', 'MARKETING']),
  granted: z.boolean().default(true),
})

// ─── GET /api/users/me/export ─────────────────────────────────────────────────
// Any logged-in user can export their own data (DPDP right to portability)
router.get('/me/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await exportUserData(req.user!.sub)

    await prisma.auditLog.create({
      data: {
        userId: req.user!.sub,
        action: 'DPDP_DATA_EXPORT',
        entityType: 'User',
        entityId: req.user!.sub,
        after: { exportedAt: new Date().toISOString() } as any,
        ipAddress: req.ip,
      },
    })

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="user-data-export-${req.user!.sub}.json"`)
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

// ─── POST /api/users/me/consent ───────────────────────────────────────────────
// Log a consent decision for a purpose
router.post('/me/consent', validate(consentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { purpose, granted } = req.body

    const consent = await prisma.consentLog.create({
      data: {
        userId: req.user!.sub,
        purpose,
        granted,
        ipAddress: req.ip,
        version: '1.0',
      },
    })

    logger.info(`Consent ${granted ? 'granted' : 'withdrawn'} by user ${req.user!.sub}: ${purpose}`)
    res.status(201).json({ success: true, data: consent })
  } catch (err) { next(err) }
})

// ─── GET /api/users/me/consents ───────────────────────────────────────────────
// View own consent history
router.get('/me/consents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const consents = await prisma.consentLog.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: consents })
  } catch (err) { next(err) }
})

// ─── POST /api/users/:id/request-deletion ────────────────────────────────────
// ADMIN only: Schedule a hard delete 30 days from now (DPDP erasure right)
router.post(
  '/:id/request-deletion',
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const { reason } = req.body

      if (!reason || reason.trim().length < 10) {
        throw new ValidationError('Deletion reason must be at least 10 characters')
      }

      const targetUser = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, deletionRequestedAt: true, companyId: true } })
      if (!targetUser) throw new NotFoundError('User')

      // Prevent deleting self
      if (targetUser.id === req.user!.sub) {
        throw new AppError('Admins cannot request their own deletion — contact another admin', 400)
      }

      // Prevent duplicate requests
      if (targetUser.deletionRequestedAt) {
        const scheduledFor = new Date(targetUser.deletionRequestedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
        throw new AppError(`Deletion already scheduled for ${scheduledFor.toISOString()}`, 409)
      }

      const now = new Date()
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id },
          data: { deletionRequestedAt: now },
        })
        await tx.auditLog.create({
          data: {
            userId: req.user!.sub,
            action: 'DPDP_DELETION_REQUEST',
            entityType: 'User',
            entityId: id,
            before: { deletionRequestedAt: null } as any,
            after: { deletionRequestedAt: now.toISOString() } as any,
            metadata: { reason, scheduledHardDeleteAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() } as any,
            ipAddress: req.ip,
          },
        })
      })

      const scheduledFor = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      logger.info(`DPDP: Deletion requested for user ${id} (${targetUser.email}) by ${req.user!.sub}. Hard delete on ${scheduledFor.toISOString()}`)

      res.json({
        success: true,
        message: `Deletion scheduled. Hard delete will occur on ${scheduledFor.toISOString()}`,
        data: { userId: id, requestedAt: now, hardDeleteAt: scheduledFor },
      })
    } catch (err) { next(err) }
  }
)

// ─── POST /api/users/:id/cancel-deletion ─────────────────────────────────────
// ADMIN only: Cancel a pending deletion within the 30-day window
router.post(
  '/:id/cancel-deletion',
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const targetUser = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, deletionRequestedAt: true } })
      if (!targetUser) throw new NotFoundError('User')
      if (!targetUser.deletionRequestedAt) {
        throw new AppError('No pending deletion request for this user', 400)
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id }, data: { deletionRequestedAt: null } })
        await tx.auditLog.create({
          data: {
            userId: req.user!.sub,
            action: 'DPDP_DELETION_CANCELLED',
            entityType: 'User',
            entityId: id,
            before: { deletionRequestedAt: targetUser.deletionRequestedAt?.toISOString() } as any,
            after: { deletionRequestedAt: null } as any,
            ipAddress: req.ip,
          },
        })
      })

      res.json({ success: true, message: 'Deletion request cancelled' })
    } catch (err) { next(err) }
  }
)

// ─── POST /api/admin/anonymize ────────────────────────────────────────────────
// ADMIN only: Trigger GSTIN anonymization sweep on records > 7 years old
router.post(
  '/admin/anonymize-old-gstins',
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info(`DPDP: Anonymization sweep triggered by ${req.user!.sub}`)

      // Run async — don't wait for completion in request (can take minutes)
      runGSTINAnonymization().then((stats) => {
        logger.info(`DPDP: Anonymization sweep completed:`, stats)
      }).catch((err) => {
        logger.error('DPDP: Anonymization sweep failed:', err)
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user!.sub,
          action: 'DPDP_ANONYMIZATION_TRIGGERED',
          entityType: 'System',
          entityId: 'gstin-anonymization',
          ipAddress: req.ip,
        },
      })

      res.json({
        success: true,
        message: 'GSTIN anonymization sweep started in background. Check logs for completion.',
      })
    } catch (err) { next(err) }
  }
)

export default router
