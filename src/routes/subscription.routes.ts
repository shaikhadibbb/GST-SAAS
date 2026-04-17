// src/routes/subscription.routes.ts
// Subscription lifecycle: create, upgrade, downgrade, cancel, usage, Razorpay webhooks
import { Router, Request, Response, NextFunction } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { AppError } from '../lib/errors'
import { prisma } from '../lib/prisma'
import { sendGenericEmail } from '../lib/emailService'
import { PLAN_CONFIG, PlanType, TRIAL_DAYS, GRACE_PERIOD_DAYS } from '../config/plans'
import { addDays, addMonths, addYears, format } from 'date-fns'
import crypto from 'crypto'

const router = Router()

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = (req: Request) => req.user!.sub

function getPeriodDates(billingCycle: 'MONTHLY' | 'ANNUAL') {
  const start = new Date()
  const end = billingCycle === 'ANNUAL' ? addYears(start, 1) : addMonths(start, 1)
  return { currentPeriodStart: start, currentPeriodEnd: end }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: All plans
// ─────────────────────────────────────────────────────────────────────────────

router.get('/plans', async (_req: Request, res: Response) => {
  const plans = Object.entries(PLAN_CONFIG).map(([key, cfg]) => ({ id: key, ...cfg }))
  res.json({ success: true, data: plans })
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATED routes below
// ─────────────────────────────────────────────────────────────────────────────

router.use(authenticate)

// GET /api/v1/subscriptions/current
router.get('/subscriptions/current', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId: uid(req) },
      include: { usageHistory: { orderBy: { createdAt: 'desc' }, take: 3 } },
    })
    if (!sub) return res.json({ success: true, data: null })

    const plan = PLAN_CONFIG[sub.plan as PlanType]
    res.json({
      success: true,
      data: {
        ...sub,
        planDetails: plan,
        isTrialing: sub.status === 'TRIAL',
        isActive: ['TRIAL', 'ACTIVE'].includes(sub.status),
        daysUntilRenewal: sub.currentPeriodEnd
          ? Math.max(0, Math.ceil((sub.currentPeriodEnd.getTime() - Date.now()) / 86400000))
          : null,
      },
    })
  } catch (err) { next(err) }
})

// POST /api/v1/subscriptions/create
router.post('/subscriptions/create', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { plan = 'FREE', billingCycle = 'MONTHLY', razorpayPaymentId } = req.body
    if (!PLAN_CONFIG[plan as PlanType]) throw new AppError(`Invalid plan: ${plan}`, 400)

    const existing = await prisma.subscription.findUnique({ where: { userId: uid(req) } })
    if (existing) throw new AppError('Subscription already exists. Use /upgrade to change plans.', 409)

    const periods = getPeriodDates(billingCycle as 'MONTHLY' | 'ANNUAL')
    const trialEndsAt = addDays(new Date(), TRIAL_DAYS)
    const isFree = plan === 'FREE'

    const sub = await prisma.subscription.create({
      data: {
        userId: uid(req),
        plan: plan as PlanType,
        status: isFree ? 'ACTIVE' : razorpayPaymentId ? 'ACTIVE' : 'TRIAL',
        billingCycle: billingCycle as 'MONTHLY' | 'ANNUAL',
        trialEndsAt: !isFree ? trialEndsAt : undefined,
        usage: {},
        ...periods,
      },
    })

    await sendGenericEmail(req.user!.email, 'Welcome to GSTPro!', `
      <h2>Your ${PLAN_CONFIG[plan as PlanType].label} plan is now active.</h2>
      ${!isFree && !razorpayPaymentId
        ? `<p>Your free trial ends on <strong>${format(trialEndsAt, 'dd MMM yyyy')}</strong>.</p>`
        : ''}
      <p>Log in to GSTPro dashboard to start managing compliance.</p>
    `)

    res.status(201).json({ success: true, data: sub })
  } catch (err) { next(err) }
})

// POST /api/v1/subscriptions/upgrade
router.post('/subscriptions/upgrade', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { plan, billingCycle, razorpayPaymentId } = req.body
    if (!plan || !PLAN_CONFIG[plan as PlanType]) throw new AppError(`Invalid plan: ${plan}`, 400)

    const sub = await prisma.subscription.findUnique({ where: { userId: uid(req) } })
    if (!sub) throw new AppError('No active subscription found', 404)

    const oldPlan = sub.plan
    const periods = getPeriodDates((billingCycle || sub.billingCycle) as 'MONTHLY' | 'ANNUAL')

    const updated = await prisma.subscription.update({
      where: { userId: uid(req) },
      data: {
        plan: plan as PlanType,
        status: 'ACTIVE',
        billingCycle: (billingCycle || sub.billingCycle) as 'MONTHLY' | 'ANNUAL',
        usage: {},
        downgradeTo: null,
        ...periods,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: uid(req),
        action: 'SUBSCRIPTION_UPGRADED',
        entityType: 'Subscription',
        entityId: sub.id,
        before: { plan: oldPlan },
        after: { plan },
        metadata: { razorpayPaymentId },
      },
    })

    res.json({ success: true, data: updated, message: `Upgraded from ${oldPlan} to ${plan}` })
  } catch (err) { next(err) }
})

// POST /api/v1/subscriptions/downgrade
router.post('/subscriptions/downgrade', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { plan } = req.body
    if (!plan || !PLAN_CONFIG[plan as PlanType]) throw new AppError('Invalid plan', 400)

    const sub = await prisma.subscription.findUnique({ where: { userId: uid(req) } })
    if (!sub) throw new AppError('No active subscription found', 404)

    await prisma.subscription.update({
      where: { userId: uid(req) },
      data: { downgradeTo: plan as PlanType },
    })

    res.json({
      success: true,
      message: `Downgrade to ${plan} scheduled for ${format(sub.currentPeriodEnd, 'dd MMM yyyy')}`,
    })
  } catch (err) { next(err) }
})

// POST /api/v1/subscriptions/cancel
router.post('/subscriptions/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason, feedback } = req.body
    const sub = await prisma.subscription.findUnique({ where: { userId: uid(req) } })
    if (!sub) throw new AppError('No active subscription found', 404)

    const gracePeriodEndsAt = addDays(sub.currentPeriodEnd, GRACE_PERIOD_DAYS)

    await prisma.subscription.update({
      where: { userId: uid(req) },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: reason, gracePeriodEndsAt },
    })

    await sendGenericEmail(req.user!.email, 'GSTPro Subscription Cancelled', `
      <p>Your ${sub.plan} subscription has been cancelled.</p>
      <p>You have access until <strong>${format(sub.currentPeriodEnd, 'dd MMM yyyy')}</strong>.</p>
      <p>You can reactivate within ${GRACE_PERIOD_DAYS} days (before ${format(gracePeriodEndsAt, 'dd MMM yyyy')}).</p>
      ${feedback ? `<p>Feedback: ${feedback}</p>` : ''}
    `)

    res.json({ success: true, message: 'Subscription cancelled. Access continues until period end.' })
  } catch (err) { next(err) }
})

// POST /api/v1/subscriptions/reactivate
router.post('/subscriptions/reactivate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await prisma.subscription.findUnique({ where: { userId: uid(req) } })
    if (!sub) throw new AppError('No subscription found', 404)
    if (sub.status !== 'CANCELLED') throw new AppError('Subscription is not cancelled', 400)

    const isWithinGrace = sub.gracePeriodEndsAt && sub.gracePeriodEndsAt > new Date()
    const isBeforePeriodEnd = sub.currentPeriodEnd > new Date()

    if (!isWithinGrace && !isBeforePeriodEnd) {
      throw new AppError('Reactivation window has expired. Please create a new subscription.', 400)
    }

    await prisma.subscription.update({
      where: { userId: uid(req) },
      data: { status: 'ACTIVE', cancelledAt: null, cancellationReason: null, gracePeriodEndsAt: null },
    })

    res.json({ success: true, message: 'Subscription reactivated!' })
  } catch (err) { next(err) }
})

// GET /api/v1/subscriptions/usage
router.get('/subscriptions/usage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await prisma.subscription.findUnique({ where: { userId: uid(req) } })
    if (!sub) return res.json({ success: true, data: null })

    const plan = PLAN_CONFIG[sub.plan as PlanType]
    const usage = (sub.usage as Record<string, number>) || {}

    const breakdown = Object.entries(plan.limits).map(([key, limit]) => ({
      key,
      limit: limit as number,
      used: usage[key] || 0,
      usedPct: (limit as number) > 0
        ? Math.min(100, Math.round(((usage[key] || 0) / (limit as number)) * 100))
        : 0,
      isUnlimited: (limit as number) >= 999999,
    }))

    res.json({ success: true, data: { plan: sub.plan, breakdown, usage, limits: plan.limits } })
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────────────────────
// Razorpay Webhook
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/webhooks/razorpay (no auth — Razorpay calls this)
router.post('/webhooks/razorpay', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'razorpay_mock_secret'
    const signature = req.headers['x-razorpay-signature'] as string

    if (!req.rawBody || !signature) {
      throw new AppError('Missing signature or raw body payload', 400)
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.rawBody.toString('utf8'))
      .digest('hex')

    // Timing-safe equality to prevent timing attacks
    if (expectedSignature !== signature) {
      throw new AppError('Invalid webhook signature', 400)
    }

    const event: string = req.body?.event
    const payload = req.body?.payload

    if (event === 'subscription.charged') {
      const rzpSubId = payload?.subscription?.entity?.id
      const sub = await prisma.subscription.findFirst({ where: { razorpaySubscriptionId: rzpSubId } })
      if (sub) {
        const periods = getPeriodDates(sub.billingCycle as 'MONTHLY' | 'ANNUAL')
        await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'ACTIVE', usage: {}, ...periods } })
      }
    }

    if (event === 'subscription.payment_failed') {
      const rzpSubId = payload?.subscription?.entity?.id
      const sub = await prisma.subscription.findFirst({
        where: { razorpaySubscriptionId: rzpSubId },
        include: { user: true },
      })
      if (sub) {
        await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'PAST_DUE' } })
        await sendGenericEmail(sub.user.email, 'Payment Failed — Action Required', `
          <p>Your GSTPro payment failed. Please update your payment method.</p>
          <p>You have a ${GRACE_PERIOD_DAYS}-day grace period before your account is restricted.</p>
        `)
      }
    }

    if (event === 'subscription.cancelled') {
      const rzpSubId = payload?.subscription?.entity?.id
      await prisma.subscription.updateMany({
        where: { razorpaySubscriptionId: rzpSubId },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      })
    }

    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
