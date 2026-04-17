// src/services/healthScore.ts
// Client Health Score Algorithm — deterministic, 0–100 scale
import { differenceInDays } from 'date-fns'

export type HealthStatus = 'excellent' | 'good' | 'at-risk' | 'critical'

export interface HealthInput {
  lastFilingDate: Date | null
  lastReconciliationAt: Date | null
  pendingMismatches: number
  totalInvoices: number
  unclaimedItc: number   // ₹ amount
}

export interface HealthResult {
  score: number
  status: HealthStatus
  reasons: string[]
  color: 'green' | 'amber' | 'red'
}

export function calculateHealthScore(input: HealthInput): HealthResult {
  const now = new Date()
  let score = 100
  const reasons: string[] = []

  // ── Filing punctuality (max −25 pts) ────────────────────
  if (input.lastFilingDate) {
    const daysSinceFiling = differenceInDays(now, input.lastFilingDate)
    if (daysSinceFiling > 30) {
      score -= 25
      reasons.push('GSTR-1 filing overdue (>30 days)')
    } else if (daysSinceFiling > 15) {
      score -= 10
      reasons.push('GSTR-1 filing approaching deadline')
    }
  } else {
    score -= 25
    reasons.push('No GSTR-1 filing history')
  }

  // ── Reconciliation freshness (max −30 pts) ───────────────
  if (input.lastReconciliationAt) {
    const daysSinceRecon = differenceInDays(now, input.lastReconciliationAt)
    if (daysSinceRecon > 7) {
      score -= 15
      reasons.push('Reconciliation stale (>7 days)')
    }
  } else {
    score -= 30
    reasons.push('Never reconciled')
  }

  // ── Mismatch ratio (max −20 pts) ────────────────────────
  if (input.totalInvoices > 0) {
    const mismatchRatio = input.pendingMismatches / input.totalInvoices
    if (mismatchRatio > 0.2) {
      score -= 20
      reasons.push('High mismatch ratio (>20%)')
    } else if (mismatchRatio > 0.1) {
      score -= 10
      reasons.push('Moderate mismatch ratio (>10%)')
    }
  }

  // ── ITC leakage (max −10 pts) ───────────────────────────
  if (input.unclaimedItc > 50000) {
    score -= 10
    reasons.push(`Significant unclaimed ITC (₹${(input.unclaimedItc / 1000).toFixed(0)}K)`)
  }

  const finalScore = Math.max(0, score)

  let status: HealthStatus
  let color: 'green' | 'amber' | 'red'
  if (finalScore >= 90) { status = 'excellent'; color = 'green' }
  else if (finalScore >= 70) { status = 'good'; color = 'green' }
  else if (finalScore >= 50) { status = 'at-risk'; color = 'amber' }
  else { status = 'critical'; color = 'red' }

  return { score: finalScore, status, reasons, color }
}
