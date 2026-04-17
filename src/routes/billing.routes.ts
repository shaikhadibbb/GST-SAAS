import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth.middleware'
import { createRazorpaySubscription, verifyRazorpaySignature, verifyWebhookSignature } from '../integrations/razorpay'
import { logger } from '../lib/logger'
import { ValidationError, ForbiddenError } from '../lib/errors'

const router = Router()

// Map our plans to Razorpay Plan IDs (In reality, these come from DB or Env)
const PLAN_MAP: Record<string, string> = {
  STARTER_MONTHLY: process.env.RZP_PLAN_STARTER_MO || 'plan_starter_mo',
  GROWTH_MONTHLY: process.env.RZP_PLAN_GROWTH_MO || 'plan_growth_mo',
  GROWTH_ANNUAL: process.env.RZP_PLAN_GROWTH_AN || 'plan_growth_an',
}

router.post('/create-subscription', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planKey } = req.body
    const planId = PLAN_MAP[planKey]

    if (!planId) throw new ValidationError('Invalid plan selected')

    const subscription = await createRazorpaySubscription(planId, req.user!.email)

    // Store pending subscription in our DB
    await prisma.subscription.upsert({
      where: { userId: req.user!.sub },
      update: {
        razorpaySubscriptionId: subscription.id,
        status: 'PAST_DUE', // Mark as pending payment
      },
      create: {
        userId: req.user!.sub,
        razorpaySubscriptionId: subscription.id,
        status: 'PAST_DUE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Placeholder
      }
    })

    res.json({
      success: true,
      data: {
        key: process.env.RAZORPAY_KEY_ID,
        subscriptionId: subscription.id,
        email: req.user!.email
      }
    })
  } catch (err) { next(err) }
})

router.post('/verify', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body

    const isValid = verifyRazorpaySignature(
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature
    )

    if (!isValid) throw new ForbiddenError('Invalid payment signature')

    // Update subscription to active
    const subscription = await prisma.subscription.update({
      where: { userId: req.user!.sub },
      data: {
        status: 'ACTIVE',
        razorpaySubscriptionId: razorpay_subscription_id,
        // In real world, fetch plan details from RZP or calculate based on planId
      }
    })

    logger.info(`Subscription activated for user ${req.user!.sub}`)
    res.json({ success: true, data: subscription })
  } catch (err) { next(err) }
})

router.get('/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.sub }
    })
    res.json({ success: true, data: subscription })
  } catch (err) { next(err) }
})

  const { event, payload } = req.body
  const rzpSubscriptionId = payload.subscription.entity.id

  switch (event) {
    case 'subscription.charged':
      await prisma.subscription.update({
        where: { razorpaySubscriptionId: rzpSubscriptionId },
        data: { status: 'ACTIVE' }
      })
      break
    case 'subscription.charge_failed':
      // DEATH RISK Fix: Dunning sequence
      await handleChargeFailed(payload.subscription.entity)
      break
    case 'subscription.expiring':
      await handleExpiring(payload.subscription.entity)
      break
    case 'subscription.halted':
    case 'subscription.cancelled':
      await prisma.subscription.update({
        where: { razorpaySubscriptionId: rzpSubscriptionId },
        data: { status: 'CANCELLED', cancelledAt: new Date() }
      })
      break
  }

  res.json({ status: 'ok' })
})

async function handleChargeFailed(rzpSub: any) {
    const sub = await prisma.subscription.findFirst({ where: { razorpaySubscriptionId: rzpSub.id }, include: { user: true } })
    if (!sub) return

    await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'PAST_DUE' }
    })

    // Logic: Email user (Day 0)
    logger.warn(`Dunning Day 0: Charge failed for user ${sub.user.email}`)
    // EmailService.send(sub.user.email, 'Action Required: Payment Failed for GSTPro', '...')
}

async function handleExpiring(rzpSub: any) {
    const sub = await prisma.subscription.findFirst({ where: { razorpaySubscriptionId: rzpSub.id }, include: { user: true } })
    if (!sub) return
    logger.info(`Renewal Warning: Subscription ending soon for ${sub.user.email}`)
}

export default router
