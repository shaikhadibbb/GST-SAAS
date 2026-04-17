import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth.middleware'
import { ValidationError } from '../lib/errors'

const router = Router()
router.use(authenticate)

export const calculateSuccessFee = (recoveredAmount: number) => {
  const fee = recoveredAmount * 0.005; // 0.5% success fee
  return Math.min(fee, 2499); // Max cap at Growth plan price (₹2,499)
}

router.get('/potential-savings', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId
    if (!companyId) throw new ValidationError('No company linked')

    const unmatched = await prisma.gSTR2AEntry.findMany({
      where: { companyId, matched: false },
      include: { supplierGSTIN: true } // Mock relation
    })

    const totalLeakage = unmatched.reduce((sum, item) => sum + Number(item.igst || 0) + Number(item.cgst || 0) + Number(item.sgst || 0), 0)
    
    // Group by supplier
    const vendorMap: Record<string, number> = {}
    unmatched.forEach(item => {
      if (item.supplierGSTIN) {
        vendorMap[item.supplierGSTIN] = (vendorMap[item.supplierGSTIN] || 0) + Number(item.igst || 0) + Number(item.cgst || 0) + Number(item.sgst || 0)
      }
    })

    const topLeakageVendors = Object.entries(vendorMap)
      .map(([gstin, amount]) => ({ gstin, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    const successFee = calculateSuccessFee(totalLeakage)

    res.json({
      success: true,
      data: {
        totalPotentialSavings: totalLeakage,
        topLeakageVendors,
        successFee,
        isCapped: successFee === 2499,
        recoveryStats: {
            unmatchedCount: unmatched.length,
            grade: totalLeakage > 50000 ? 'CRITICAL' : 'MODERATE'
        }
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch leakage' })
  }
})

router.post('/remind-vendor', async (req: Request, res: Response) => {
    // Logic for sending reminder and potentially logging the success-fee triggering event
    res.json({ success: true, message: 'Vendor reminded. Progress tracked for success fee.' })
})

export default router
