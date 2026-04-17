import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { sendWeeklyComplianceEmail } from '../lib/weeklyEmail'
import { NotFoundError } from '../lib/errors'

const router = Router()
router.use(authenticate)

// POST /api/notifications/send-weekly/:userId (Admin/Manan Testing)
router.post('/send-weekly/:userId', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.userId } })
    if (!user) throw new NotFoundError('User')
    
    await sendWeeklyComplianceEmail(user.id)
    res.json({ success: true, message: `Weekly snaphot sent to ${user.email}` })
  } catch (err) { next(err) }
})

// GET /api/notifications/preferences
router.get('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In real app, we would have a NotificationPreference table
    // Mocking for now
    res.json({
      success: true,
      data: {
        email: { weeklySnapshot: true, riskAlerts: true, filingReminders: true },
        sms: { otpOnly: true },
        whatsApp: { riskAlerts: false }
      }
    })
  } catch (err) { next(err) }
})

// PATCH /api/notifications/preferences
router.patch('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Logic to update preferences
    res.json({ success: true, message: 'Preferences updated successfully' })
  } catch (err) { next(err) }
})

export default router
