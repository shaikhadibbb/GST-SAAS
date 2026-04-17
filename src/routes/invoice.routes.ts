import { Router, Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import rateLimit from 'express-rate-limit'
import path from 'path'
import fs from 'fs'
import { prisma } from '../lib/prisma'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { createInvoiceSchema, invoiceListQuerySchema } from '../lib/validators'
import { calculateTax } from '../lib/taxCalculator'
import { cacheDel } from '../lib/redis'
import { NotFoundError, ForbiddenError, ValidationError, ConflictError, AppError } from '../lib/errors'
import { logger } from '../lib/logger'
// CHANGED: Task 3 — email service for COMPLIANCE_OFFICER notification
import { sendGenericEmail } from '../lib/emailService'
// CHANGED: Task 4 — BullMQ PDF queue
import { pdfQueue } from '../queues/pdfQueue'

const router = Router()
router.use(authenticate)

const pdfLimiter = rateLimit({
  windowMs: 60 * 1000, max: 5,
  keyGenerator: (req: any) => req.user?.sub || req.ip,
  message: { success: false, message: 'Too many PDF requests. Max 5 per minute.' },
})

async function invalidateCompanyCache(companyId: string) {
  await Promise.all([
    cacheDel(`invoices:${companyId}:*`),
    cacheDel(`dashboard:${companyId}:*`),
    cacheDel(`reconciliation:${companyId}:*`),
  ])
}

function determineInvoiceType(customerGSTIN: string | null, placeOfSupply: string, companyStateCode: string, taxableValue: number): string {
  if (customerGSTIN) return 'B2B'
  const isInterState = placeOfSupply !== companyStateCode
  if (!isInterState && taxableValue <= 250000) return 'B2CS'
  return 'B2CL'
}

router.post('/', authorize('ADMIN', 'CA', 'ACCOUNTANT'), validate(createInvoiceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceNumber, invoiceDate, customerGSTIN, customerName, placeOfSupply, taxableValue, gstinRegId, hsnCode } = req.body

    const gstinReg = await prisma.gSTINRegistration.findFirst({
      where: { id: gstinRegId, companyId: req.user!.companyId },
      include: { company: { select: { stateCode: true } } },
    })
    if (!gstinReg) throw new NotFoundError('GSTIN registration')

    if (customerGSTIN) {
      const { GSTIN_REGEX } = await import('../lib/validators')
      if (!GSTIN_REGEX.test(customerGSTIN)) throw new ValidationError('Invalid customer GSTIN format')
    }

    const existing = await prisma.invoice.findFirst({ where: { invoiceNumber, gstinRegId, deletedAt: null } })
    if (existing) throw new ConflictError(`Invoice number ${invoiceNumber} already exists`)

    const tax = calculateTax({ taxableValue, placeOfSupply, companyStateCode: gstinReg.company.stateCode, hsnCode })
    const invoiceType = determineInvoiceType(customerGSTIN || null, placeOfSupply, gstinReg.company.stateCode, taxableValue) as any

    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          invoiceNumber, invoiceDate: new Date(invoiceDate),
          customerGSTIN: customerGSTIN || null, customerName, placeOfSupply,
          taxableValue: new Prisma.Decimal(tax.taxableValue),
          cgst: new Prisma.Decimal(tax.cgst), sgst: new Prisma.Decimal(tax.sgst),
          igst: new Prisma.Decimal(tax.igst), totalTax: new Prisma.Decimal(tax.totalTax),
          totalAmount: new Prisma.Decimal(tax.totalAmount),
          status: 'DRAFT', invoiceType, gstinRegId, hsnCode: hsnCode || null,
        },
        include: { gstinReg: { select: { gstin: true, state: true } } },
      })
      await tx.auditLog.create({
        data: { userId: req.user!.sub, action: 'CREATE', entityType: 'Invoice', entityId: created.id, invoiceId: created.id, after: created as any, ipAddress: req.ip },
      })
      return created
    })

    await invalidateCompanyCache(req.user!.companyId)
    logger.info(`Invoice created: ${invoiceNumber}`)
    res.status(201).json({ success: true, message: 'Invoice created successfully', data: { ...invoice, taxBreakdown: tax } })
  } catch (err) { next(err) }
})

router.get('/', validate(invoiceListQuerySchema, 'query'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, status, gstinRegId, from, to } = req.query as any
    const showArchived = req.query.archived === 'true'

    const companyGstinRegs = await prisma.gSTINRegistration.findMany({ where: { companyId: req.user!.companyId }, select: { id: true } })
    const gstinRegIds = companyGstinRegs.map(r => r.id)

    const where: Prisma.InvoiceWhereInput = {
      gstinRegId: gstinRegId ? (gstinRegIds.includes(gstinRegId) ? gstinRegId : '__none__') : { in: gstinRegIds },
      deletedAt: showArchived ? { not: null } : null,
      ...(status && { status }),
      ...((from || to) ? { invoiceDate: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}),
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { invoiceDate: 'desc' }, include: { gstinReg: { select: { gstin: true, state: true } } } }),
      prisma.invoice.count({ where }),
    ])

    return res.json({ success: true, data: invoices, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } })
  } catch (err) { return next(err) }
})

router.get('/hsn-list', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { getHSNList } = await import('../lib/taxCalculator')
    res.json({ success: true, data: getHSNList() })
  } catch (err) { next(err) }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { gstinReg: { include: { company: true } } } })
    if (!invoice) throw new NotFoundError('Invoice')
    if (invoice.gstinReg.companyId !== req.user!.companyId) throw new ForbiddenError()
    res.json({ success: true, data: invoice })
  } catch (err) { next(err) }
})

router.get('/:id/pdf', pdfLimiter, authorize('ADMIN', 'CA', 'ACCOUNTANT', 'VIEWER', 'COMPLIANCE_OFFICER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { gstinReg: { include: { company: true } } } })
    if (!invoice) throw new NotFoundError('Invoice')
    if (invoice.gstinReg.companyId !== req.user!.companyId) throw new ForbiddenError()
    const { generateInvoicePDF } = await import('../lib/pdfGenerator')
    // CHANGED: serialize Prisma Decimal → string (generateInvoicePDF accepts number | string)
    const invoiceForPdf = {
      ...invoice,
      taxableValue: invoice.taxableValue.toString(),
      cgst: invoice.cgst.toString(),
      sgst: invoice.sgst.toString(),
      igst: invoice.igst.toString(),
      totalTax: invoice.totalTax.toString(),
      totalAmount: invoice.totalAmount.toString(),
    }
    const pdfBuffer = await generateInvoicePDF(invoiceForPdf, invoice.gstinReg.company)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="Invoice_${invoice.invoiceNumber}.pdf"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    res.end(pdfBuffer)
  } catch (err) { next(err) }
})

// CHANGED: Task 4 — Async PDF generation (BullMQ). Returns jobId < 500ms.
router.post('/:id/pdf-async', pdfLimiter, authorize('ADMIN', 'CA', 'ACCOUNTANT', 'VIEWER', 'COMPLIANCE_OFFICER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { gstinReg: { select: { companyId: true } } },
    })
    if (!invoice) throw new NotFoundError('Invoice')
    if (invoice.gstinReg.companyId !== req.user!.companyId) throw new ForbiddenError()

    // Create DB job record first
    const pdfJobRecord = await prisma.pdfJob.create({
      data: {
        invoiceId: invoice.id,
        requestedBy: req.user!.sub,
        companyId: req.user!.companyId,
        status: 'PENDING',
      },
    })

    // Enqueue BullMQ job (payload stays under 1MB: IDs only, no objects)
    await pdfQueue.add(
      `pdf-${invoice.id}`,
      {
        invoiceId: invoice.id,
        requestedBy: req.user!.sub,
        companyId: req.user!.companyId,
        pdfJobDbId: pdfJobRecord.id,
      },
      { jobId: pdfJobRecord.id }
    )

    logger.info(`PDF async job enqueued: ${pdfJobRecord.id} for invoice ${invoice.id}`)
    res.status(202).json({
      success: true,
      message: 'PDF generation queued. Poll /pdf-jobs/:jobId for status.',
      data: { jobId: pdfJobRecord.id },
    })
  } catch (err) { next(err) }
})

// CHANGED: Task 4 — Poll PDF job status
router.get('/pdf-jobs/:jobId', authorize('ADMIN', 'CA', 'ACCOUNTANT', 'VIEWER', 'COMPLIANCE_OFFICER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await prisma.pdfJob.findUnique({ where: { id: req.params.jobId } })
    if (!job) throw new NotFoundError('PDF job')
    if (job.companyId !== req.user!.companyId) throw new ForbiddenError()
    res.json({ success: true, data: job })
  } catch (err) { next(err) }
})

// CHANGED: Task 4 — Download completed PDF by filename
const PDF_OUTPUT_DIR = path.join(process.cwd(), 'pdf-output')
router.get('/pdf-download/:filename', authorize('ADMIN', 'CA', 'ACCOUNTANT', 'VIEWER', 'COMPLIANCE_OFFICER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params
    // Prevent path traversal
    if (!/^[a-zA-Z0-9_\-.]+\.pdf$/.test(filename)) throw new ValidationError('Invalid filename')
    const filepath = path.join(PDF_OUTPUT_DIR, filename)
    if (!fs.existsSync(filepath)) throw new NotFoundError('PDF file')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.sendFile(filepath)
  } catch (err) { next(err) }
})

router.get('/:id/history', fetchHistory)
router.get('/:id/audit', fetchHistory)

async function fetchHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { gstinReg: { select: { companyId: true } } } })
    if (!invoice) throw new NotFoundError('Invoice')
    if (invoice.gstinReg.companyId !== req.user!.companyId) throw new ForbiddenError()
    const logs = await prisma.auditLog.findMany({ where: { invoiceId: req.params.id }, include: { user: { select: { email: true, role: true } } }, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: logs })
  } catch (err) { next(err) }
}

router.patch('/:id/archive', authorize('ADMIN', 'CA'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { gstinReg: { select: { companyId: true } } } })
    if (!invoice) throw new NotFoundError('Invoice')
    if (invoice.gstinReg.companyId !== req.user!.companyId) throw new ForbiddenError()
    if (invoice.status === 'IRN_GENERATED') throw new ValidationError('Cannot archive an IRN-verified invoice')

    const updated = await prisma.$transaction(async tx => {
      const u = await tx.invoice.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
      await tx.auditLog.create({ data: { userId: req.user!.sub, action: 'ARCHIVE', entityType: 'Invoice', entityId: invoice.id, invoiceId: invoice.id, before: { deletedAt: null } as any, after: { deletedAt: u.deletedAt } as any, ipAddress: req.ip } })
      return u
    })
    await invalidateCompanyCache(req.user!.companyId)
    res.json({ success: true, message: 'Invoice archived', data: updated })
  } catch (err) { next(err) }
})

router.patch('/:id/restore', authorize('ADMIN', 'CA'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { gstinReg: { select: { companyId: true } } } })
    if (!invoice) throw new NotFoundError('Invoice')
    if (invoice.gstinReg.companyId !== req.user!.companyId) throw new ForbiddenError()

    const updated = await prisma.$transaction(async tx => {
      const u = await tx.invoice.update({ where: { id: req.params.id }, data: { deletedAt: null } })
      await tx.auditLog.create({ data: { userId: req.user!.sub, action: 'RESTORE', entityType: 'Invoice', entityId: invoice.id, invoiceId: invoice.id, before: { deletedAt: invoice.deletedAt } as any, after: { deletedAt: null } as any, ipAddress: req.ip } })
      return u
    })
    await invalidateCompanyCache(req.user!.companyId)
    res.json({ success: true, message: 'Invoice restored', data: updated })
  } catch (err) { next(err) }
})

// CHANGED: Task 3 — COMPLIANCE_OFFICER can override to IRN_GENERATED with reason
// ADMIN/CA/ACCOUNTANT/VIEWER: still blocked from IRN_GENERATED
router.patch('/:id/status', authorize('ADMIN', 'CA', 'COMPLIANCE_OFFICER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, overrideReason } = req.body
    const userRole = req.user!.role

    // CHANGED: Task 3 — IRN_GENERATED only allowed for COMPLIANCE_OFFICER with a reason
    if (status === 'IRN_GENERATED') {
      if (userRole !== 'COMPLIANCE_OFFICER') {
        throw new AppError('IRN status can only be set via government IRP API integration. Manual override is not permitted.', 403)
      }
      // overrideReason: min 20 chars (business requirement)
      if (!overrideReason || overrideReason.trim().length < 20) {
        throw new ValidationError('overrideReason is required and must be at least 20 characters for IRN override')
      }
    }

    const validTransitions: Record<string, string[]> = {
      DRAFT: ['GENERATED', 'CANCELLED'],
      GENERATED: ['IRN_GENERATED', 'GSTR1_FILED', 'CANCELLED'],
      IRN_GENERATED: ['GSTR1_FILED', 'CANCELLED'],
      GSTR1_FILED: ['RECONCILED', 'CANCELLED'],
      RECONCILED: ['CANCELLED'],
      CANCELLED: [],
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { gstinReg: { select: { companyId: true } } } })
    if (!invoice) throw new NotFoundError('Invoice')
    if (invoice.gstinReg.companyId !== req.user!.companyId) throw new ForbiddenError()

    // COMPLIANCE_OFFICER can transition GENERATED → IRN_GENERATED (add to valid transitions)
    const effectiveTransitions = { ...validTransitions }
    if (userRole === 'COMPLIANCE_OFFICER') {
      effectiveTransitions['GENERATED'] = [...effectiveTransitions['GENERATED'], 'IRN_GENERATED']
      effectiveTransitions['DRAFT'] = [...effectiveTransitions['DRAFT'], 'IRN_GENERATED']
    }

    const allowed = effectiveTransitions[invoice.status] || []
    if (!allowed.includes(status)) throw new ValidationError(`Cannot transition from ${invoice.status} to ${status}`)

    const updated = await prisma.$transaction(async tx => {
      const u = await tx.invoice.update({ where: { id: req.params.id }, data: { status } })
      await tx.auditLog.create({
        data: {
          userId: req.user!.sub,
          action: status === 'IRN_GENERATED' ? 'IRN_OVERRIDE' : 'STATUS_CHANGE',
          entityType: 'Invoice',
          entityId: invoice.id,
          invoiceId: invoice.id,
          before: { status: invoice.status } as any,
          after: { status } as any,
          // CHANGED: Task 3 — override reason stored in metadata
          metadata: status === 'IRN_GENERATED'
            ? { overrideReason: overrideReason.trim(), officerId: req.user!.sub, officerRole: userRole } as any
            : null,
          ipAddress: req.ip,
        },
      })
      return u
    })

    // CHANGED: Task 3 — notify all ADMIN users when IRN override happens
    if (status === 'IRN_GENERATED') {
      prisma.user.findMany({
        where: { companyId: req.user!.companyId, role: 'ADMIN' },
        select: { email: true },
      }).then(admins => {
        const adminEmails = admins.map(a => a.email)
        if (adminEmails.length > 0) {
          sendGenericEmail(
            adminEmails.join(','),
            '⚠️ IRN Override Alert — GSTPro',
            `<p>A <strong>COMPLIANCE_OFFICER</strong> has manually overridden invoice <code>${invoice.id}</code> to <strong>IRN_GENERATED</strong> status.</p>
             <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
             <p><strong>Reason:</strong> ${overrideReason}</p>
             <p><strong>Officer ID:</strong> ${req.user!.sub}</p>
             <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
             <p>Review this in the Audit Log immediately.</p>`
          ).catch((e: unknown) => logger.warn('IRN override admin notification failed:', e))
        }
      }).catch((e: unknown) => logger.warn('Failed to fetch admins for IRN override notification:', e))
    }

    await invalidateCompanyCache(req.user!.companyId)
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

export default router
