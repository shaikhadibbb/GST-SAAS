// src/middleware/featureGate.ts
// Plan-based feature gating and usage limit enforcement
import { Request, Response, NextFunction } from 'express'
import { AppError } from '../lib/errors'
import { checkFeatureAccess, checkLimit, FeatureKey, LimitKey, PlanType } from '../config/plans'
import { prisma } from '../lib/prisma'

export function requireFeature(feature: FeatureKey) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const plan: PlanType = ((req.user as any)?.plan || 'FREE') as PlanType
      if (!checkFeatureAccess(plan, feature)) {
        throw new AppError(`This feature is not available on your current plan. Upgrade to access "${feature}".`, 403)
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}

export function requireLimit(limitType: LimitKey) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const sub = (req.user as any)?.subscription
      if (!sub) return next()

      const plan: PlanType = (sub.plan || 'FREE') as PlanType
      const usage = (sub.usage as Record<string, number>) || {}
      const currentUsage = usage[limitType] || 0

      if (!checkLimit(plan, limitType, currentUsage)) {
        throw new AppError(`You've reached your ${limitType} limit for this period. Upgrade to continue.`, 403)
      }

      // Async increment — fire-and-forget, never blocks the request
      prisma.subscription.update({
        where: { id: sub.id },
        data: { usage: { ...(sub.usage as object), [limitType]: currentUsage + 1 } },
      }).catch(() => {})

      next()
    } catch (err) {
      next(err)
    }
  }
}
