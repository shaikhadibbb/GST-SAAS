// src/config/plans.ts
// Canonical plan configuration — single source of truth for features and limits

export type PlanType = 'FREE' | 'STARTER' | 'GROWTH' | 'PRO' | 'CA_FIRM' | 'ENTERPRISE'
export type LimitKey = keyof typeof PLAN_CONFIG['FREE']['limits']
export type FeatureKey = keyof typeof PLAN_CONFIG['FREE']['features']

export const PLAN_CONFIG = {
  FREE: {
    label: 'Free',
    priceMonthly: 0,
    priceAnnual: 0,
    annualSavingsPct: 0,
    limits: {
      invoices: 50,
      gstins: 1,
      bulkOperations: 0,
      apiCalls: 0,
      users: 1,
      storageMb: 100,
    },
    features: {
      basicReconciliation: true,
      itcProtection: false,
      bulkOperations: false,
      whiteLabel: false,
      caPortal: false,
      apiAccess: false,
      prioritySupport: false,
      advancedAnalytics: false,
      autoReconciliation: false,
      multiGstin: false,
    },
  },
  STARTER: {
    label: 'Starter',
    priceMonthly: 999,
    priceAnnual: 9999,
    annualSavingsPct: 16,
    limits: {
      invoices: 500,
      gstins: 2,
      bulkOperations: 0,
      apiCalls: 0,
      users: 2,
      storageMb: 1000,
    },
    features: {
      basicReconciliation: true,
      itcProtection: true,
      bulkOperations: false,
      whiteLabel: false,
      caPortal: false,
      apiAccess: false,
      prioritySupport: false,
      advancedAnalytics: false,
      autoReconciliation: false,
      multiGstin: false,
    },
  },
  GROWTH: {
    label: 'Growth',
    priceMonthly: 2499,
    priceAnnual: 24999,
    annualSavingsPct: 17,
    limits: {
      invoices: 2000,
      gstins: 5,
      bulkOperations: 50,
      apiCalls: 0,
      users: 5,
      storageMb: 5000,
    },
    features: {
      basicReconciliation: true,
      itcProtection: true,
      bulkOperations: true,
      whiteLabel: false,
      caPortal: false,
      apiAccess: false,
      prioritySupport: false,
      advancedAnalytics: true,
      autoReconciliation: true,
      multiGstin: true,
    },
  },
  PRO: {
    label: 'Pro',
    priceMonthly: 4999,
    priceAnnual: 49999,
    annualSavingsPct: 17,
    limits: {
      invoices: 10000,
      gstins: 10,
      bulkOperations: 500,
      apiCalls: 100000,
      users: 15,
      storageMb: 20000,
    },
    features: {
      basicReconciliation: true,
      itcProtection: true,
      bulkOperations: true,
      whiteLabel: true,
      caPortal: false,
      apiAccess: true,
      prioritySupport: true,
      advancedAnalytics: true,
      autoReconciliation: true,
      multiGstin: true,
    },
  },
  CA_FIRM: {
    label: 'CA Firm',
    priceMonthly: 9999,
    priceAnnual: 99999,
    annualSavingsPct: 17,
    limits: {
      invoices: 999999, // Unlimited
      gstins: 50,
      bulkOperations: 999999,
      apiCalls: 999999,
      users: 999999,
      storageMb: 100000,
    },
    features: {
      basicReconciliation: true,
      itcProtection: true,
      bulkOperations: true,
      whiteLabel: true,
      caPortal: true,
      apiAccess: true,
      prioritySupport: true,
      advancedAnalytics: true,
      autoReconciliation: true,
      multiGstin: true,
    },
  },
  ENTERPRISE: {
    label: 'Enterprise',
    priceMonthly: 0, // Custom pricing
    priceAnnual: 0,
    annualSavingsPct: 0,
    limits: {
      invoices: 999999,
      gstins: 999999,
      bulkOperations: 999999,
      apiCalls: 999999,
      users: 999999,
      storageMb: 999999,
    },
    features: {
      basicReconciliation: true,
      itcProtection: true,
      bulkOperations: true,
      whiteLabel: true,
      caPortal: true,
      apiAccess: true,
      prioritySupport: true,
      advancedAnalytics: true,
      autoReconciliation: true,
      multiGstin: true,
    },
  },
} as const

export function getPlanConfig(plan: PlanType) {
  return PLAN_CONFIG[plan]
}

export function checkFeatureAccess(plan: PlanType, feature: FeatureKey): boolean {
  return PLAN_CONFIG[plan].features[feature] ?? false
}

export function checkLimit(plan: PlanType, limitType: LimitKey, currentUsage: number): boolean {
  const limit = PLAN_CONFIG[plan].limits[limitType]
  if (typeof limit !== 'number') return true
  return currentUsage < limit
}

export function getLimit(plan: PlanType, limitType: LimitKey): number {
  return PLAN_CONFIG[plan].limits[limitType] as number
}

export const TRIAL_DAYS = 14
export const GRACE_PERIOD_DAYS = 3
