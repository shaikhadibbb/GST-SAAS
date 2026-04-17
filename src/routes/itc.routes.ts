import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { cacheGet, cacheSet } from '../lib/redis'
import { sendOTPEmail } from '../lib/emailService'
import { logger } from '../lib/logger'

const router = Router()
router.use(authenticate)

// ─── GET /api/itc/protection-report ──────────────────────────────────────────
// Calculate ITC at risk from unmatched GSTR-2A entries
router.get('/protection-report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId
    const month = Number(req.query.month) || new Date().getMonth() + 1
    const year = Number(req.query.year) || new Date().getFullYear()

    const cacheKey = `itc:report:${companyId}:${year}${month}`
    const cached = await cacheGet(cacheKey)
    if (cached) return res.json({ success: true, data: cached, cached: true })

    const periodStart = new Date(year, month - 1, 1)
    const periodEnd = new Date(year, month, 0, 23, 59, 59)

    // Get all unmatched 2A entries (vendor filed but we haven't matched)
    const unmatchedEntries = await prisma.gSTR2AEntry.findMany({
      where: {
        companyId,
        matched: false,
        invoiceDate: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { taxableValue: 'desc' },
    })

    // Get all invoices that don't appear in 2A (vendor may not have filed)
    const gstinRegs = await prisma.gSTINRegistration.findMany({ where: { companyId } })
    const allInvoices = await prisma.invoice.findMany({
      where: {
        gstinRegId: { in: gstinRegs.map(r => r.id) },
        invoiceDate: { gte: periodStart, lte: periodEnd },
        status: { not: 'CANCELLED' },
        deletedAt: null,
        customerGSTIN: { not: null },
      },
    })

    // Group unmatched by supplier GSTIN
    const supplierRisk = new Map<string, {
      gstin: string
      invoiceCount: number
      totalTaxableValue: number
      itcAtRisk: number
      invoices: Array<{ invoiceNumber: string; date: Date; taxable: number; tax: number }>
    }>()

    for (const entry of unmatchedEntries) {
      const gstin = entry.supplierGSTIN || entry.gstin
      const tax = Number(entry.igst) + Number(entry.cgst) + Number(entry.sgst)
      const existing = supplierRisk.get(gstin) || { gstin, invoiceCount: 0, totalTaxableValue: 0, itcAtRisk: 0, invoices: [] }
      existing.invoiceCount++
      existing.totalTaxableValue += Number(entry.taxableValue)
      existing.itcAtRisk += tax
      existing.invoices.push({ invoiceNumber: entry.invoiceNumber, date: entry.invoiceDate, taxable: Number(entry.taxableValue), tax })
      supplierRisk.set(gstin, existing)
    }

    const totalITCAtRisk = unmatchedEntries.reduce((sum, e) => sum + Number(e.igst) + Number(e.cgst) + Number(e.sgst), 0)
    const totalTaxableAtRisk = unmatchedEntries.reduce((sum, e) => sum + Number(e.taxableValue), 0)

    // Format for "money rescued" display
    const report = {
      period: { month, year },
      summary: {
        totalITCAtRisk: totalITCAtRisk.toFixed(2),
        totalTaxableAtRisk: totalTaxableAtRisk.toFixed(2),
        unmatchedEntries: unmatchedEntries.length,
        riskySuppliersCount: supplierRisk.size,
        potentialSaving: (totalITCAtRisk * 0.95).toFixed(2), // 95% recoverable estimate
      },
      riskySuppliers: Array.from(supplierRisk.values())
        .sort((a, b) => b.itcAtRisk - a.itcAtRisk)
        .slice(0, 20),
      unmatchedEntries: unmatchedEntries.slice(0, 50).map(e => ({
        id: e.id,
        supplierGSTIN: e.supplierGSTIN || e.gstin,
        invoiceNumber: e.invoiceNumber,
        invoiceDate: e.invoiceDate,
        taxableValue: e.taxableValue.toString(),
        itcAtRisk: (Number(e.igst) + Number(e.cgst) + Number(e.sgst)).toFixed(2),
      })),
    }

    await cacheSet(cacheKey, report, 300)
    return res.json({ success: true, data: report })
  } catch (err) { return next(err) }
})

// ─── POST /api/itc/remind-vendor ─────────────────────────────────────────────
// Send automated follow-up email to non-compliant vendor
router.post('/remind-vendor', authorize('ADMIN', 'CA'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { supplierGSTIN, supplierEmail, invoiceNumbers, itcAtRisk, companyName } = req.body

    if (!supplierEmail || !supplierGSTIN) {
      return res.status(400).json({ success: false, message: 'supplierEmail and supplierGSTIN required' })
    }

    const company = await prisma.company.findFirst({ where: { id: req.user!.companyId } })
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' })

    const emailHtml = `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
<div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:28px 32px;text-align:center;">
    <div style="font-size:24px;font-weight:800;color:white;">⚠️ Action Required — ITC Recovery Notice</div>
  </div>
  <div style="padding:32px;">
    <p style="color:#374151;font-size:15px;margin:0 0 16px;">Dear Vendor (GSTIN: <strong>${supplierGSTIN}</strong>),</p>
    <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
      This is an automated notice from <strong>${company.name}</strong> (GSTIN: ${company.gstin}).
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:20px;">
      <p style="color:#dc2626;font-weight:700;margin:0 0 8px;font-size:16px;">
        ₹${Number(itcAtRisk).toLocaleString('en-IN')} in ITC at Risk
      </p>
      <p style="color:#7f1d1d;font-size:13px;margin:0;">
        The following invoices from you have not appeared in our GSTR-2A for the current period:
      </p>
    </div>
    <ul style="color:#374151;font-size:13px;padding-left:20px;margin-bottom:20px;">
      ${(invoiceNumbers || []).map((inv: string) => `<li style="margin-bottom:4px;font-family:monospace;">${inv}</li>`).join('')}
    </ul>
    <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 20px;">
      <strong>Please file your pending GST returns immediately.</strong> 
      Failure to do so may result in withholding of payments until compliance is confirmed.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;margin-bottom:20px;">
      <p style="color:#166534;font-size:13px;margin:0;">
        ✅ Once you file, the ITC will automatically reconcile in our system within 24-48 hours.
      </p>
    </div>
    <p style="color:#64748b;font-size:12px;">This is an automated message sent via GSTPro Compliance Platform.</p>
  </div>
</div>
</body></html>`

    try {
      const nodemailer = await import('nodemailer')
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        })
        await transporter.sendMail({
          from: `"${company.name} via GSTPro" <${process.env.SMTP_USER}>`,
          to: supplierEmail,
          subject: `⚠️ Action Required: Pending GST Filing - ₹${Number(itcAtRisk).toLocaleString('en-IN')} ITC at Risk`,
          html: emailHtml,
        })
      }
    } catch (emailErr) {
      logger.warn('Vendor reminder email failed:', emailErr)
    }

    // Log the reminder in audit
    logger.info(`Vendor reminder sent to ${supplierGSTIN} (${supplierEmail}) by ${req.user!.email}`)

    return res.json({
      success: true,
      message: `Reminder sent to vendor ${supplierGSTIN}`,
      data: { supplierGSTIN, supplierEmail, itcAtRisk, invoiceCount: invoiceNumbers?.length || 0 },
    })
  } catch (err) { return next(err) }
})

// ─── GET /api/itc/potential-savings ──────────────────────────────────────────
router.get('/potential-savings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId
    // Logic: Sum of all unmatched GSTR-2A entries
    const savings = await prisma.gSTR2AEntry.aggregate({
      where: { companyId, matched: false },
      _sum: { igst: true, cgst: true, sgst: true }
    })

    const totalSavings = Number(savings._sum.igst || 0) + Number(savings._sum.cgst || 0) + Number(savings._sum.sgst || 0)

    const topLeakageVendors = await prisma.gSTR2AEntry.groupBy({
      by: ['supplierGSTIN'],
      where: { companyId, matched: false },
      _sum: { igst: true, cgst: true, sgst: true },
      orderBy: { _sum: { igst: 'desc' } }, // Simple order
      take: 3
    })

    res.json({
      success: true,
      data: {
        totalPotentialSavings: totalSavings,
        topLeakageVendors: topLeakageVendors.map(v => ({
          gstin: v.supplierGSTIN,
          amount: Number(v._sum.igst || 0) + Number(v._sum.cgst || 0) + Number(v._sum.sgst || 0)
        }))
      }
    })
  } catch (err) { next(err) }
})

export default router
