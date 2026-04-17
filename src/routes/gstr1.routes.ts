import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { NotFoundError, ValidationError } from '../lib/errors'

const router = Router()
router.use(authenticate)

const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d[Z]{1}[A-Z\d]{1}$/

// ✅ FIXED: Locale-independent date format
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function formatGSTDate(date: Date): string {
  const d = new Date(date)
  return `${String(d.getDate()).padStart(2, '0')}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`
}

// Helper for categorization
async function getGSTR1Data(companyId: string, month: number, year: number) {
  const periodStart = new Date(year, month - 1, 1)
  const periodEnd = new Date(year, month, 0, 23, 59, 59)

  const gstinRegs = await prisma.gSTINRegistration.findMany({
    where: { companyId },
    include: { company: true },
  })
  if (!gstinRegs.length) return null

  const primaryReg = gstinRegs[0]
  const company = primaryReg.company

  const invoices = await prisma.invoice.findMany({
    where: {
      gstinRegId: { in: gstinRegs.map(r => r.id) },
      invoiceDate: { gte: periodStart, lte: periodEnd },
      status: { not: 'CANCELLED' },
      deletedAt: null,
    },
    orderBy: { invoiceDate: 'asc' },
  })

  const stats = {
    totalInvoices: invoices.length,
    taxableValue: 0,
    totalTax: 0,
    totalAmount: 0,
    categories: [
      { category: 'B2B (Registered)', key: 'b2b', count: 0, taxableValue: 0, taxAmount: 0, percentage: 0 },
      { category: 'B2CS (Small Unregistered)', key: 'b2cs', count: 0, taxableValue: 0, taxAmount: 0, percentage: 0 },
      { category: 'B2CL (Large Unregistered)', key: 'b2cl', count: 0, taxableValue: 0, taxAmount: 0, percentage: 0 },
    ],
    errors: [] as string[]
  }

  const b2bMap = new Map<string, any[]>()
  const b2csMap = new Map<string, any>()
  const b2cl: any[] = []
  const hsnMap = new Map<string, any>()

  for (const inv of invoices) {
    const taxableValue = Number(inv.taxableValue)
    const totalTax = Number(inv.totalTax)
    const totalAmount = Number(inv.totalAmount)
    const isInterState = inv.placeOfSupply !== company.stateCode

    stats.taxableValue += taxableValue
    stats.totalTax += totalTax
    stats.totalAmount += totalAmount

    // Validation check for summary
    if (inv.hsnCode && !/^\d{4,8}$/.test(inv.hsnCode)) stats.errors.push(`Invoice ${inv.invoiceNumber}: Invalid HSN ${inv.hsnCode}`)
    if (inv.customerGSTIN && !GSTIN_REGEX.test(inv.customerGSTIN)) stats.errors.push(`Invoice ${inv.invoiceNumber}: Invalid customer GSTIN`)

    const invEntry = {
      inum: inv.invoiceNumber,
      idt: formatGSTDate(inv.invoiceDate),
      val: totalAmount,
      pos: inv.placeOfSupply,
      rchrg: 'N',
      inv_typ: inv.invoiceType === 'SEZ' ? 'SEWP' : 'R',
      itms: [{
        num: 1,
        itm_det: {
          rt: totalTax > 0 ? Math.round(totalTax / taxableValue * (isInterState ? 100 : 200)) : 0,
          txval: taxableValue,
          igst: Number(inv.igst),
          cgst: Number(inv.cgst),
          sgst: Number(inv.sgst),
        },
      }],
    }

    if (inv.customerGSTIN) {
      const idx = stats.categories.findIndex(c => c.key === 'b2b')
      stats.categories[idx].count++
      stats.categories[idx].taxableValue += taxableValue
      stats.categories[idx].taxAmount += totalTax
      
      const existing = b2bMap.get(inv.customerGSTIN) || []
      existing.push(invEntry)
      b2bMap.set(inv.customerGSTIN, existing)
    } else if (!isInterState && taxableValue <= 250000) {
      const idx = stats.categories.findIndex(c => c.key === 'b2cs')
      stats.categories[idx].count++
      stats.categories[idx].taxableValue += taxableValue
      stats.categories[idx].taxAmount += totalTax

      const rate = totalTax > 0 ? Math.round(Number(inv.cgst) / taxableValue * 200) : 0
      const key = `${rate}::${inv.placeOfSupply}`
      const existing = b2csMap.get(key) || { sply_ty: 'INTRA', rt: rate, pos: inv.placeOfSupply, txval: 0, igst: 0, cgst: 0, sgst: 0 }
      existing.txval += taxableValue
      existing.igst += Number(inv.igst)
      existing.cgst += Number(inv.cgst)
      existing.sgst += Number(inv.sgst)
      b2csMap.set(key, existing)
    } else {
      const idx = stats.categories.findIndex(c => c.key === 'b2cl')
      stats.categories[idx].count++
      stats.categories[idx].taxableValue += taxableValue
      stats.categories[idx].taxAmount += totalTax
      b2cl.push({ pos: inv.placeOfSupply, inv: [invEntry] })
    }

    // HSN summary
    if (inv.hsnCode) {
      const h = hsnMap.get(inv.hsnCode) || { txval: 0, igst: 0, cgst: 0, sgst: 0, qty: 0 }
      hsnMap.set(inv.hsnCode, { txval: h.txval + taxableValue, igst: h.igst + Number(inv.igst), cgst: h.cgst + Number(inv.cgst), sgst: h.sgst + Number(inv.sgst), qty: h.qty + 1 })
    }
  }

  // Calculate percentages and add HSN Summary as a row
  stats.categories.forEach(c => {
    c.percentage = stats.taxableValue > 0 ? Math.round((c.taxableValue / stats.taxableValue) * 100) : 0
  })

  const hsnCount = hsnMap.size
  const hsnTaxable = Array.from(hsnMap.values()).reduce((sum, h) => sum + h.txval, 0)
  const hsnTax = Array.from(hsnMap.values()).reduce((sum, h) => sum + h.igst + h.cgst + h.sgst, 0)

  stats.categories.push({
    category: 'HSN Summary',
    key: 'hsn',
    count: hsnCount,
    taxableValue: hsnTaxable,
    taxAmount: hsnTax,
    percentage: 100
  })

  const gstr1 = {
    gstin: company.gstin,
    fp: `${String(month).padStart(2, '0')}${year}`,
    gt: stats.totalAmount,
    cur_gt: stats.totalAmount,
    b2b: Array.from(b2bMap.entries()).map(([ctin, inv]) => ({ ctin, inv })),
    b2cs: Array.from(b2csMap.values()),
    b2cl,
    hsn: {
      data: Array.from(hsnMap.entries()).map(([hsn_sc, data]) => ({
        hsn_sc, desc: 'Goods/Services', uqc: 'OTH', cnt: data.qty, txval: data.txval, igst: data.igst, cgst: data.cgst, sgst: data.sgst
      }))
    }
  }

  return { stats, gstr1, company }
}

router.get('/summary', prepare)
router.get('/prepare', prepare)
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = Number(req.query.month); const year = Number(req.query.year)
    if (!month || !year) throw new ValidationError('month and year required')
    const data = await getGSTR1Data(req.user!.companyId, month, year)
    if (!data) throw new NotFoundError('GSTIN registration')
    res.json({ success: true, data: data.stats.categories })
  } catch (err) { next(err) }
})

async function prepare(req: Request, res: Response, next: NextFunction) {
  try {
    const month = Number(req.query.month); const year = Number(req.query.year)
    if (!month || !year) throw new ValidationError('month and year required')
    const data = await getGSTR1Data(req.user!.companyId, month, year)
    if (!data) throw new NotFoundError('GSTIN registration')
    res.json({ success: true, data: { ...data.stats, filingStatus: 'READY_TO_FILE' } })
  } catch (err) { next(err) }
}

router.get('/validate', validateGstr1)
router.post('/validate', validateGstr1)

async function validateGstr1(req: Request, res: Response, next: NextFunction) {
  try {
    const month = Number(req.body.month || req.query.month)
    const year = Number(req.body.year || req.query.year)
    if (!month || !year) throw new ValidationError('month and year required')
    const data = await getGSTR1Data(req.user!.companyId, month, year)
    if (!data) throw new NotFoundError('GSTIN registration')
    const success = data.stats.errors.length === 0
    res.json({ success: true, data: { success, errors: data.stats.errors } })
  } catch (err) { next(err) }
}

router.get('/export', authorize('ADMIN', 'CA', 'ACCOUNTANT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = Number(req.query.month)
    const year = Number(req.query.year)
    if (!month || !year) throw new ValidationError('month and year required')

    const data = await getGSTR1Data(req.user!.companyId, month, year)
    if (!data || !data.gstr1) throw new NotFoundError('GSTIN registration')

    if (data.stats.errors.length > 0) {
      return res.status(422).json({ success: false, message: 'Validation errors present', errors: data.stats.errors })
    }

    const fileName = `GSTR1_${data.company.gstin}_${data.gstr1.fp}.json`
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    return res.json(data.gstr1)
  } catch (err) { next(err) }
})

export default router
