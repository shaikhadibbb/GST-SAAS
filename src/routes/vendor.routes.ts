import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import rateLimit from 'express-rate-limit'

const router = Router()

const publicLookupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Public lookup limited to 10 requests per hour' }
})

router.get('/:gstin/health', publicLookupLimiter, async (req: Request, res: Response) => {
  try {
    const { gstin } = req.params

    // Logic: Find aggregate data for this GSTIN across our platform users 
    // (Anonymized: just filing consistency and counts)
    const invoices = await prisma.gSTR2AEntry.findMany({
        where: { supplierGSTIN: gstin },
        orderBy: { invoiceDate: 'desc' },
        take: 50
    })

    if (invoices.length === 0) {
        return res.json({
            success: true,
            data: {
                gstin,
                healthScore: 50,
                status: 'UNKNOWN',
                message: 'Not enough data in GSTPro network for this vendor.',
                recommendation: 'Request filing history from vendor directly.'
            }
        })
    }

    const matchedCount = invoices.filter(i => i.matched).length
    const score = Math.round((matchedCount / invoices.length) * 100)
    
    let recommendation = 'Safe to trade'
    if (score < 40) recommendation = 'High risk: Delay payment until GSTR-1 filed'
    else if (score < 75) recommendation = 'Monitor: Some filing delays observed'

    res.json({
        success: true,
        data: {
            gstin,
            healthScore: score,
            filingConsistency: `${matchedCount}/${invoices.length}`,
            lastFiled: invoices.find(i => i.matched)?.invoiceDate || null,
            recommendation,
            stats: {
                totalNetworkTransactions: invoices.length,
                matchedPercent: score
            }
        }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during lookup' })
  }
})

export default router
