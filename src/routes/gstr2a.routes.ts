import { Router, Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { gstr2aUploadSchema } from '../lib/validators'
import { cacheDel } from '../lib/redis'
import { NotFoundError, ValidationError } from '../lib/errors'
import { logger } from '../lib/logger'
import { gstnSyncQueue } from '../queues/gstnSyncQueue'

const router = Router()
router.use(authenticate)

// ✅ POST /api/gstr2a/sync — Trigger portal sync
router.post(
  '/sync',
  authorize('ADMIN', 'CA', 'ACCOUNTANT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { gstin, period } = req.body
      if (!gstin || !period) throw new ValidationError('gstin and period (MMYYYY) required')

      const gstinReg = await prisma.gSTINRegistration.findFirst({
        where: { gstin, companyId: req.user!.companyId },
      })
      if (!gstinReg) throw new NotFoundError('GSTIN registration')

      const job = await gstnSyncQueue.add(
        `sync-${gstin}-${period}`,
        {
          gstin,
          companyId: req.user!.companyId,
          syncType: 'GSTR2A',
          period,
          requestedBy: req.user!.sub,
        },
        { jobId: `sync-${gstin}-${period}-${Date.now()}` }
      )

      logger.info(`GSTN Sync queued: job ${job.id} for ${gstin} (${period})`)
      res.status(202).json({
        success: true,
        message: 'Sync job queued successfully',
        data: { jobId: job.id },
      })
    } catch (err) { next(err) }
  }
)

function parseGSTDate(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number)
  const [day, month, year] = parts
  if (!day || !month || !year) throw new ValidationError(`Invalid date format: ${dateStr}`)
  return new Date(year, month - 1, day)
}

// ✅ POST /api/gstr2a/upload — with validation middleware
router.post(
  '/upload',
  authorize('ADMIN', 'CA', 'ACCOUNTANT'),
  validate(gstr2aUploadSchema),            // ✅ FIXED: was missing validation
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { gstin, fp, b2b } = req.body

      const gstinReg = await prisma.gSTINRegistration.findFirst({
        where: { companyId: req.user!.companyId },
      })
      if (!gstinReg) throw new NotFoundError('GSTIN registration')

      const month = Number(fp.substring(0, 2))
      const year = Number(fp.substring(2, 6))
      const entries: Prisma.GSTR2AEntryCreateManyInput[] = []
      const b2bArr: Array<{ gstin?: string; ctin?: string; inv?: Array<{ inum: string; idt: string; val: number; pos: string; itms: Array<{ num: number; itm_det: { txval: number; igst?: number; cgst?: number; sgst?: number } }> }> }> = b2b || []

      for (const supplier of b2bArr) {
        const supplierGSTIN = supplier.gstin || supplier.ctin
        for (const inv of supplier.inv || []) {
          let invoiceDate: Date
          try { invoiceDate = parseGSTDate(inv.idt) }
          catch { logger.warn(`Skipping invoice with invalid date: ${inv.inum}`); continue }

          let taxableValue = 0, igst = 0, cgst = 0, sgst = 0
          for (const item of inv.itms || []) {
            taxableValue += item.itm_det?.txval || 0
            igst += item.itm_det?.igst || 0
            cgst += item.itm_det?.cgst || 0
            sgst += item.itm_det?.sgst || 0
          }

          entries.push({
            gstin,
            invoiceNumber: inv.inum,
            invoiceDate,
            taxableValue: new Prisma.Decimal(taxableValue.toFixed(2)),
            igst: new Prisma.Decimal(igst.toFixed(2)),
            cgst: new Prisma.Decimal(cgst.toFixed(2)),
            sgst: new Prisma.Decimal(sgst.toFixed(2)),
            matched: false,
            supplierGSTIN: supplierGSTIN || null,
            companyId: req.user!.companyId,
          })
        }
      }

      const periodStart = new Date(year, month - 1, 1)
      const periodEnd = new Date(year, month, 0, 23, 59, 59)

      await prisma.$transaction(async (tx) => {
        await tx.gSTR2AEntry.deleteMany({
          where: { gstin, companyId: req.user!.companyId, invoiceDate: { gte: periodStart, lte: periodEnd } },
        })
        if (entries.length > 0) {
          await tx.gSTR2AEntry.createMany({ data: entries, skipDuplicates: true })
        }
      })

      await cacheDel(`reconciliation:${req.user!.companyId}:*`)
      await cacheDel(`dashboard:${req.user!.companyId}:*`)

      logger.info(`GSTR-2A uploaded: ${entries.length} entries for ${gstin}`)
      return res.status(201).json({
        success: true,
        message: entries.length > 0
          ? `GSTR-2A uploaded: ${entries.length} entries imported`
          : 'File uploaded but no entries found. Ensure JSON has b2b array with inv items.',
        data: { gstin, period: fp, imported: entries.length, suppliers: b2bArr.length },
      })
    } catch (err) { return next(err) }
  }
)

// ✅ GET /api/gstr2a/entries — with role authorization
router.get(
  '/entries',
  authorize('ADMIN', 'CA', 'ACCOUNTANT', 'VIEWER'), // ✅ FIXED: added authorization
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1
      const limit = Math.min(Number(req.query.limit) || 50, 200)
      const matched = req.query.matched !== undefined ? req.query.matched === 'true' : undefined
      const gstin = typeof req.query.gstin === 'string' ? req.query.gstin : undefined

      const where: Prisma.GSTR2AEntryWhereInput = {
        companyId: req.user!.companyId,
        ...(matched !== undefined && { matched }),
        ...(gstin && { gstin }),
      }

      const [entries, total] = await Promise.all([
        prisma.gSTR2AEntry.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { invoiceDate: 'desc' },
        }),
        prisma.gSTR2AEntry.count({ where }),
      ])

      res.json({
        success: true,
        data: entries,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      })
    } catch (err) { next(err) }
  }
)

export default router
