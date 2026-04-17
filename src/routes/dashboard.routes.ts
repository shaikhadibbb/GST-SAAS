import { Router, Request, Response, NextFunction } from 'express';
import Decimal from 'decimal.js';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { cacheGet, cacheSet } from '../lib/redis';
import { calculateHealthScore } from '../services/healthScore';

const router = Router();
router.use(authenticate);

router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;

    const cacheKey = `dashboard:${companyId}:${year}:${month}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const gstinRegs = await prisma.gSTINRegistration.findMany({
      where: { companyId },
      select: { id: true, gstin: true },
    });
    const gstinRegIds = gstinRegs.map((r) => r.id);

    const [monthlyInvoices, yearlyInvoices, invoicesByStatus, gstr2aStats] = await Promise.all([
      prisma.invoice.aggregate({
        where: { gstinRegId: { in: gstinRegIds }, invoiceDate: { gte: monthStart, lte: monthEnd }, status: { not: 'CANCELLED' } },
        _sum: { taxableValue: true, cgst: true, sgst: true, igst: true, totalTax: true, totalAmount: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: { gstinRegId: { in: gstinRegIds }, invoiceDate: { gte: yearStart, lte: yearEnd }, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true, totalTax: true },
        _count: true,
      }),
      prisma.invoice.groupBy({
        by: ['status'],
        where: { gstinRegId: { in: gstinRegIds }, invoiceDate: { gte: monthStart, lte: monthEnd } },
        _count: { status: true },
      }),
      prisma.gSTR2AEntry.aggregate({
        where: { companyId, invoiceDate: { gte: monthStart, lte: monthEnd } },
        _count: true,
        _sum: { taxableValue: true, igst: true, cgst: true, sgst: true },
      }),
    ]);

    // ✅ FIXED: Real 6-month trend from DB
    const trendData = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date(year, month - 1 - (5 - i), 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        return prisma.invoice.aggregate({
          where: { gstinRegId: { in: gstinRegIds }, invoiceDate: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
          _sum: { totalTax: true, totalAmount: true },
          _count: true,
        }).then(r => ({
          month: d.toLocaleString('default', { month: 'short' }),
          year: d.getFullYear(),
          tax: Number(r._sum.totalTax || 0),
          amount: Number(r._sum.totalAmount || 0),
          count: r._count,
        }));
      })
    );

    const matchedCount = await prisma.gSTR2AEntry.count({
      where: { companyId, invoiceDate: { gte: monthStart, lte: monthEnd }, matched: true },
    });

    const total2A = gstr2aStats._count || 0;
    const unmatchedCount = total2A - matchedCount;

    // Determine the last Reconciliation date by sorting the audit logs or 2A entries
    const lastReconRecord = await prisma.gSTR2AEntry.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });

    // Determine Unclaimed ITC based on unmatched entries in 2A
    const unclaimedItc = Number(gstr2aStats._sum.igst || 0) + Number(gstr2aStats._sum.cgst || 0) + Number(gstr2aStats._sum.sgst || 0);

    const health = calculateHealthScore({
      lastFilingDate: null, // Since we don't have GSTN filing statuses pulled yet
      lastReconciliationAt: lastReconRecord?.createdAt || null,
      pendingMismatches: unmatchedCount,
      totalInvoices: monthlyInvoices._count,
      unclaimedItc,
    });
    const matchRate = total2A > 0 ? ((matchedCount / total2A) * 100).toFixed(1) : '0.0';
    const statusMap: Record<string, number> = {};
    for (const s of invoicesByStatus) { statusMap[s.status] = s._count.status; }
    const monthlyTax = monthlyInvoices._sum;

    const result = {
      period: { month, year },
      monthly: {
        invoiceCount: monthlyInvoices._count,
        taxableValue: new Decimal(monthlyTax.taxableValue?.toString() || '0').toFixed(2),
        totalAmount: new Decimal(monthlyTax.totalAmount?.toString() || '0').toFixed(2),
        taxLiability: {
          cgst: new Decimal(monthlyTax.cgst?.toString() || '0').toFixed(2),
          sgst: new Decimal(monthlyTax.sgst?.toString() || '0').toFixed(2),
          igst: new Decimal(monthlyTax.igst?.toString() || '0').toFixed(2),
          totalTax: new Decimal(monthlyTax.totalTax?.toString() || '0').toFixed(2),
        },
        byStatus: statusMap,
      },
      yearly: {
        invoiceCount: yearlyInvoices._count,
        totalAmount: new Decimal(yearlyInvoices._sum.totalAmount?.toString() || '0').toFixed(2),
        totalTax: new Decimal(yearlyInvoices._sum.totalTax?.toString() || '0').toFixed(2),
      },
      reconciliation: { total2AEntries: total2A, matched: matchedCount, unmatched: total2A - matchedCount, matchRate: `${matchRate}%` },
      gstinRegistrations: gstinRegs.length,
      filingStatus: {
        gstr1Due: new Date(year, month, 11).toISOString().split('T')[0],
        gstr3bDue: new Date(year, month, 20).toISOString().split('T')[0],
        period: `${String(month).padStart(2, '0')}/${year}`,
      },
      trend: trendData,
      health,
    };

    await cacheSet(cacheKey, result, 60);
    return res.json({ success: true, data: result });
  } catch (err) { return next(err); }
});

export default router;
