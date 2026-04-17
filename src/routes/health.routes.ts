import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.get('/score', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const companyId = req.user!.activeCompanyId

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'No active company selected' })
    }

    // 1. Check GSTR-1 Filing for previous month
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const month = lastMonth.getMonth() + 1
    const year = lastMonth.getFullYear()

    // Simple check: do we have matched filings in history for last month?
    // In real app, check against a FilingHistory table
    const filedCount = await prisma.auditLog.count({
      where: { userId, action: 'FILING_GSTR1_COMPLETED', createdAt: { gte: lastMonth } }
    })
    const filingPoints = filedCount > 0 ? 25 : 0

    // 2. Reconciliation match rate
    const totalEntries = await prisma.gSTR2AEntry.count({ where: { companyId } })
    const matchedEntries = await prisma.gSTR2AEntry.count({ where: { companyId, matched: true } })
    const matchRate = totalEntries > 0 ? (matchedEntries / totalEntries) * 100 : 100
    
    let reconPoints = 0
    if (matchRate >= 80) reconPoints = 25
    else if (matchRate >= 60) reconPoints = 15
    else reconPoints = 5

    // 3. Invoice Timeliness (No DRAFT invoices > 30 days old)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const oldDrafts = await prisma.invoice.count({
      where: { gstinReg: { companyId }, status: 'DRAFT', createdAt: { lt: thirtyDaysAgo }, deletedAt: null }
    })
    const timelinessPoints = oldDrafts === 0 ? 20 : 0

    // 4. GSTR-2A Matching (unmatched entries)
    const unmatchedCount = await prisma.gSTR2AEntry.count({ where: { companyId, matched: false } })
    let gstr2aPoints = 0
    if (unmatchedCount === 0) gstr2aPoints = 20
    else if (unmatchedCount < 5) gstr2aPoints = 10
    else gstr2aPoints = 0

    // 5. Account Verification
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { verified: true } })
    const verificationPoints = user?.verified ? 10 : 0

    const totalScore = filingPoints + reconPoints + timelinessPoints + gstr2aPoints + verificationPoints
    
    let grade = 'F'
    if (totalScore >= 90) grade = 'A'
    else if (totalScore >= 80) grade = 'B'
    else if (totalScore >= 70) grade = 'C'
    else if (totalScore >= 60) grade = 'D'

    res.json({
      success: true,
      data: {
        score: totalScore,
        grade,
        breakdown: [
          { category: 'GSTR-1 Filing', points: filingPoints, maxPoints: 25, status: filingPoints === 25 ? 'complete' : 'pending', detail: filingPoints === 25 ? 'Filed on time' : 'Filing pending' },
          { category: 'Reconciliation', points: reconPoints, maxPoints: 25, status: matchRate >= 80 ? 'complete' : 'warning', detail: `${matchRate.toFixed(1)}% match rate` },
          { category: 'Invoice Timeliness', points: timelinessPoints, maxPoints: 20, status: timelinessPoints === 20 ? 'complete' : 'error', detail: timelinessPoints === 20 ? 'No stale drafts' : 'Pending draft invoices' },
          { category: 'GSTR-2A Matching', points: gstr2aPoints, maxPoints: 20, status: gstr2aPoints === 20 ? 'complete' : 'warning', detail: `${unmatchedCount} unmatched entries` },
          { category: 'Verification', points: verificationPoints, maxPoints: 10, status: verificationPoints === 10 ? 'complete' : 'pending', detail: verificationPoints === 10 ? 'Email verified' : 'Verification pending' }
        ]
      }
    })
  } catch (err) { next(err) }
})

export default router
