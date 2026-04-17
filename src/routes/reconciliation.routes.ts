import { Router, Request, Response, NextFunction } from 'express'
import Decimal from 'decimal.js'
import { prisma } from '../lib/prisma'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { reconcileMatchSchema } from '../lib/validators'
import { cacheGet, cacheSet } from '../lib/redis'
import { NotFoundError } from '../lib/errors'

const router = Router()
router.use(authenticate)

// ✅ Normalize invoice numbers: remove spaces, dashes, slashes, lowercase
function normalizeInvoiceNumber(num: string): string {
  return num.trim().toLowerCase().replace(/[\s\-\/\\_.]+/g, '')
}

// ✅ Fuzzy date match: configurable tolerance (default 2 days)
// CHANGED: Task 2 — toleranceDays now reads from ClientConfig instead of hardcoded 2
function datesWithinTolerance(d1: Date, d2: Date, toleranceDays = 2): boolean {
  const diffMs = Math.abs(d1.getTime() - d2.getTime())
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays <= toleranceDays
}

router.post(
  '/match',
  authorize('ADMIN', 'CA', 'ACCOUNTANT'),
  validate(reconcileMatchSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { gstinRegId, month, year, tolerance } = req.body

      const gstinReg = await prisma.gSTINRegistration.findFirst({
        where: { id: gstinRegId, companyId: req.user!.companyId },
      })
      if (!gstinReg) throw new NotFoundError('GSTIN registration')

      // CHANGED: Task 2 — read per-client date tolerance from ClientConfig (fallback 2)
      const clientConfig = await prisma.clientConfig.findUnique({
        where: { companyId: req.user!.companyId },
        select: { dateToleranceDays: true },
      })
      const dateTolerance = clientConfig?.dateToleranceDays ?? 2

      const cacheKey = `reconciliation:${req.user!.companyId}:${gstinRegId}:${year}${month}:tol${tolerance}:dt${dateTolerance}`
      const cached = await cacheGet(cacheKey)
      if (cached) return res.json({ success: true, data: cached, cached: true })

      const periodStart = new Date(year, month - 1, 1)
      const periodEnd = new Date(year, month, 0, 23, 59, 59)

      // Expand window by dateTolerance days on each side to catch cross-month entries
      // CHANGED: Task 2 — use configurable dateTolerance instead of hardcoded 2
      const expandedStart = new Date(periodStart)
      expandedStart.setDate(expandedStart.getDate() - dateTolerance)
      const expandedEnd = new Date(periodEnd)
      expandedEnd.setDate(expandedEnd.getDate() + dateTolerance)

      const [gstr2aEntries, invoices] = await Promise.all([
        prisma.gSTR2AEntry.findMany({
          where: {
            gstin: gstinReg.gstin,
            companyId: req.user!.companyId,
            invoiceDate: { gte: expandedStart, lte: expandedEnd },
          },
        }),
        prisma.invoice.findMany({
          where: {
            gstinRegId,
            invoiceDate: { gte: expandedStart, lte: expandedEnd },
            status: { not: 'CANCELLED' },
            deletedAt: null,
          },
        }),
      ])

      const toleranceDec = new Decimal(tolerance)
      const matchedPairs: Array<{
        gstr2aEntryId: string
        invoiceId: string
        invoiceNumber: string
        taxableValue: string
        discrepancy: { taxableValue: string; igst: string; cgst: string; sgst: string }
        matchType: 'exact' | 'fuzzy_date' | 'fuzzy_number'
      }> = []
      const matchedGstr2aIds = new Set<string>()
      const matchedInvoiceIds = new Set<string>()

      // ✅ FIXED: O(n) HashMap with normalized keys + fuzzy fallback
      // Pass 1: Exact normalized invoice number match
      const invoiceMap = new Map<string, typeof invoices[0]>()
      for (const invoice of invoices) {
        const key = normalizeInvoiceNumber(invoice.invoiceNumber)
        invoiceMap.set(key, invoice)
      }

      for (const entry of gstr2aEntries) {
        const normalizedEntryNum = normalizeInvoiceNumber(entry.invoiceNumber)
        const invoice = invoiceMap.get(normalizedEntryNum)
        if (!invoice || matchedInvoiceIds.has(invoice.id)) continue

        const tvDiff = new Decimal(entry.taxableValue.toString())
          .sub(new Decimal(invoice.taxableValue.toString())).abs()

        if (tvDiff.lte(toleranceDec)) {
          const matchType = entry.invoiceNumber === invoice.invoiceNumber ? 'exact' : 'fuzzy_number'
          matchedPairs.push({
            gstr2aEntryId: entry.id,
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            taxableValue: invoice.taxableValue.toString(),
            matchType,
            discrepancy: {
              taxableValue: new Decimal(entry.taxableValue.toString()).sub(invoice.taxableValue.toString()).toFixed(2),
              igst: new Decimal(entry.igst.toString()).sub(invoice.igst.toString()).toFixed(2),
              cgst: new Decimal(entry.cgst.toString()).sub(invoice.cgst.toString()).toFixed(2),
              sgst: new Decimal(entry.sgst.toString()).sub(invoice.sgst.toString()).toFixed(2),
            },
          })
          matchedGstr2aIds.add(entry.id)
          matchedInvoiceIds.add(invoice.id)
        }
      }

      // Pass 2: Fuzzy date match (±2 days) for unmatched entries
      const unmatchedEntries = gstr2aEntries.filter(e => !matchedGstr2aIds.has(e.id))
      const unmatchedInvoices = invoices.filter(i => !matchedInvoiceIds.has(i.id))

      for (const entry of unmatchedEntries) {
        const normalizedEntryNum = normalizeInvoiceNumber(entry.invoiceNumber)
        for (const invoice of unmatchedInvoices) {
          if (matchedInvoiceIds.has(invoice.id)) continue
          const normalizedInvNum = normalizeInvoiceNumber(invoice.invoiceNumber)
          if (normalizedEntryNum !== normalizedInvNum) continue

          // Numbers match but dates differ — check within client-configured tolerance
          // CHANGED: Task 2 — pass dateTolerance (from ClientConfig) instead of hardcoded 2
          if (!datesWithinTolerance(entry.invoiceDate, invoice.invoiceDate, dateTolerance)) continue

          const tvDiff = new Decimal(entry.taxableValue.toString())
            .sub(new Decimal(invoice.taxableValue.toString())).abs()
          if (!tvDiff.lte(toleranceDec)) continue

          matchedPairs.push({
            gstr2aEntryId: entry.id,
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            taxableValue: invoice.taxableValue.toString(),
            matchType: 'fuzzy_date',
            discrepancy: {
              taxableValue: new Decimal(entry.taxableValue.toString()).sub(invoice.taxableValue.toString()).toFixed(2),
              igst: new Decimal(entry.igst.toString()).sub(invoice.igst.toString()).toFixed(2),
              cgst: new Decimal(entry.cgst.toString()).sub(invoice.cgst.toString()).toFixed(2),
              sgst: new Decimal(entry.sgst.toString()).sub(invoice.sgst.toString()).toFixed(2),
            },
          })
          matchedGstr2aIds.add(entry.id)
          matchedInvoiceIds.add(invoice.id)
          break
        }
      }

      // Persist to DB BEFORE caching
      if (matchedPairs.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const pair of matchedPairs) {
            await tx.gSTR2AEntry.update({
              where: { id: pair.gstr2aEntryId },
              data: { invoiceId: pair.invoiceId, matched: true },
            })

            // Auto-progression: GSTR1_FILED → RECONCILED
            const inv = await tx.invoice.findUnique({ where: { id: pair.invoiceId }, select: { status: true } })
            if (inv && inv.status === 'GSTR1_FILED') {
              await tx.invoice.update({
                where: { id: pair.invoiceId },
                data: { status: 'RECONCILED' },
              })
              await tx.auditLog.create({
                data: {
                  userId: req.user!.sub,
                  action: 'STATUS_CHANGE',
                  entityType: 'Invoice',
                  entityId: pair.invoiceId,
                  invoiceId: pair.invoiceId,
                  before: { status: 'GSTR1_FILED' } as any,
                  after: { status: 'RECONCILED' } as any,
                  metadata: { reason: 'Auto-progression after reconciliation match' },
                  ipAddress: req.ip,
                },
              })
            }
          }
        })
      }

      const missingInBooks = gstr2aEntries
        .filter(e => !matchedGstr2aIds.has(e.id))
        .map(e => ({
          id: e.id, invoiceNumber: e.invoiceNumber, invoiceDate: e.invoiceDate,
          taxableValue: e.taxableValue.toString(), igst: e.igst.toString(),
          cgst: e.cgst.toString(), sgst: e.sgst.toString(),
          supplierGSTIN: e.supplierGSTIN,
        }))

      const missingIn2A = invoices
        .filter(i => !matchedInvoiceIds.has(i.id))
        .map(i => ({
          id: i.id, invoiceNumber: i.invoiceNumber, invoiceDate: i.invoiceDate,
          taxableValue: i.taxableValue.toString(), igst: i.igst.toString(),
          cgst: i.cgst.toString(), sgst: i.sgst.toString(),
          customerName: i.customerName,
        }))

      // ✅ ITC at Risk calculation
      const itcAtRisk = missingInBooks.reduce((sum, e) => {
        return sum + Number(e.igst) + Number(e.cgst) + Number(e.sgst)
      }, 0)

      const result = {
        matched: matchedPairs,
        missingInBooks,
        missingIn2A,
        summary: {
          totalIn2A: gstr2aEntries.length,
          totalInBooks: invoices.length,
          matched: matchedPairs.length,
          exactMatches: matchedPairs.filter(p => p.matchType === 'exact').length,
          fuzzyMatches: matchedPairs.filter(p => p.matchType !== 'exact').length,
          missingInBooks: missingInBooks.length,
          missingIn2A: missingIn2A.length,
          itcAtRisk: itcAtRisk.toFixed(2),
        },
      }

      // Cache AFTER DB write
      await cacheSet(cacheKey, result, 120)
      return res.json({ success: true, data: result })
    } catch (err) { return next(err) }
  }
)

export default router
