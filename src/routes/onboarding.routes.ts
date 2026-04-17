import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth.middleware'
import { AppError } from '../lib/errors'

const router = Router()
router.use(authenticate)

const ONBOARDING_STEPS = [
  'COMPANY_SETUP',
  'FIRST_INVOICE',
  'UPLOAD_2A',
  'RUN_RECONCILIATION',
  'INVITE_TEAM'
]

router.get('/progress', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const companyId = req.user!.companyId

    let progress = await prisma.onboardingProgress.findUnique({
      where: { userId }
    })

    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: {
          userId,
          companyId,
          steps: ONBOARDING_STEPS.reduce((acc, step) => ({ ...acc, [step]: false }), {})
        }
      })
    }

    const currentSteps = progress.steps as Record<string, boolean>
    const updatedSteps = { ...currentSteps }

    // Auto-detection logic
    const [invoiceCount, entryCount, matchedCount, teamCount] = await Promise.all([
      prisma.invoice.count({ where: { gstinReg: { companyId } } }),
      prisma.gSTR2AEntry.count({ where: { companyId } }),
      prisma.gSTR2AEntry.count({ where: { companyId, matched: true } }),
      prisma.user.count({ where: { companyId } })
    ])

    if (req.user!.companyId) updatedSteps['COMPANY_SETUP'] = true
    if (invoiceCount > 0) updatedSteps['FIRST_INVOICE'] = true
    if (entryCount > 0) updatedSteps['UPLOAD_2A'] = true
    if (matchedCount > 0) updatedSteps['RUN_RECONCILIATION'] = true
    if (teamCount > 1) updatedSteps['INVITE_TEAM'] = true

    // Check if progress changed
    const hasChanged = ONBOARDING_STEPS.some(step => updatedSteps[step] !== currentSteps[step])
    
    if (hasChanged) {
      const allDone = ONBOARDING_STEPS.every(step => updatedSteps[step])
      progress = await prisma.onboardingProgress.update({
        where: { id: progress.id },
        data: { 
          steps: updatedSteps,
          completedAt: allDone ? new Date() : null
        }
      })
    }

    const completedCount = ONBOARDING_STEPS.filter(step => updatedSteps[step]).length

    res.json({
      success: true,
      data: {
        steps: updatedSteps,
        completedCount,
        totalSteps: ONBOARDING_STEPS.length,
        percentage: (completedCount / ONBOARDING_STEPS.length) * 100,
        completedAt: progress.completedAt,
        isCompleted: completedCount === ONBOARDING_STEPS.length
      }
    })
  } catch (err) { next(err) }
})

router.post('/complete-step', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stepId } = req.body
    if (!ONBOARDING_STEPS.includes(stepId)) {
      throw new AppError('Invalid step ID', 400)
    }

    const userId = req.user!.sub
    let progress = await prisma.onboardingProgress.findUnique({ where: { userId } })

    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: {
          userId,
          companyId: req.user!.companyId,
          steps: ONBOARDING_STEPS.reduce((acc, step) => ({ ...acc, [step]: false }), {})
        }
      })
    }

    const updatedSteps = { ...(progress.steps as Record<string, boolean>), [stepId]: true }
    const allDone = ONBOARDING_STEPS.every(step => updatedSteps[step])

    const updated = await prisma.onboardingProgress.update({
      where: { id: progress.id },
      data: { 
        steps: updatedSteps,
        completedAt: allDone ? new Date() : (progress.completedAt || null)
      }
    })

    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

export default router
