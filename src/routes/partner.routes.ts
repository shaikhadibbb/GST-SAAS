// src/routes/partner.routes.ts
// CA Partner Portal — apply, onboarding, dashboard, client management, commission, white-label
import { Router, Request, Response, NextFunction } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { AppError } from '../lib/errors'
import { prisma } from '../lib/prisma'
import { sendGenericEmail } from '../lib/emailService'
import { calculateHealthScore } from '../services/healthScore'

const router = Router()
router.use(authenticate)

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = (req: Request) => req.user!.sub

function getCurrentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

async function getPartnerOrThrow(userId: string) {
  const partner = await prisma.cAPartner.findUnique({ where: { userId } })
  if (!partner) throw new AppError('CA Partner profile not found. Apply first.', 404)
  if (partner.status !== 'ACTIVE') throw new AppError(`Partner account is ${partner.status}`, 403)
  return partner
}

async function buildClientHealth(clientId: string) {
  const [invoiceCount, unmatchedCount] = await Promise.all([
    prisma.invoice.count({
      where: { gstinReg: { company: { users: { some: { id: clientId } } } }, deletedAt: null },
    }),
    prisma.gSTR2AEntry.count({
      where: { companyId: clientId, matched: false },
    }),
  ])

  const health = calculateHealthScore({
    lastFilingDate: null,
    lastReconciliationAt: null,
    pendingMismatches: unmatchedCount,
    totalInvoices: invoiceCount,
    unclaimedItc: 0,
  })

  return { invoiceCount, unmatchedCount, health }
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTNER APPLICATION & STATUS
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/partners/apply
router.post('/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firmName, firmGstin, firmWebsite, firmAddress } = req.body
    if (!firmName) throw new AppError('firmName is required', 400)

    const existing = await prisma.cAPartner.findUnique({ where: { userId: uid(req) } })
    if (existing) throw new AppError(`Application already exists with status: ${existing.status}`, 409)

    const partner = await prisma.cAPartner.create({
      data: { userId: uid(req), firmName, firmGstin, firmWebsite, firmAddress },
    })

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
    await Promise.all(admins.map(admin =>
      sendGenericEmail(admin.email, 'New CA Partner Application', `
        <p>CA Partner application submitted.</p>
        <p><strong>Firm:</strong> ${firmName}</p>
        <p><strong>Applicant:</strong> ${req.user!.email}</p>
      `)
    ))

    res.status(201).json({ success: true, data: partner })
  } catch (err) { next(err) }
})

// GET /api/v1/partners/status
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partner = await prisma.cAPartner.findUnique({
      where: { userId: uid(req) },
      include: { clients: { include: { client: { include: { company: true } } } } },
    })
    res.json({ success: true, data: partner })
  } catch (err) { next(err) }
})

// PATCH /api/v1/partners/onboarding (ADMIN only)
router.patch('/onboarding', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { partnerId, status, commissionRate } = req.body
    if (!partnerId || !status) throw new AppError('partnerId and status required', 400)

    const partner = await prisma.cAPartner.update({
      where: { id: partnerId },
      data: {
        status,
        commissionRate: commissionRate ?? 0.20,
        approvedAt: status === 'ACTIVE' ? new Date() : undefined,
        approvedBy: status === 'ACTIVE' ? uid(req) : undefined,
      },
      include: { user: true },
    })

    if (status === 'ACTIVE') {
      await sendGenericEmail(partner.user.email, 'GSTPro CA Partner — Approved! 🎉', `
        <h2>Welcome to the GSTPro CA Partner Program!</h2>
        <p>Your application for <strong>${partner.firmName}</strong> has been approved.</p>
        <p><strong>Commission Rate:</strong> ${(partner.commissionRate * 100).toFixed(0)}%</p>
        <p>Log in to your account and visit the Partner Portal to start onboarding clients.</p>
      `)
    }

    res.json({ success: true, data: partner })
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────────────────────
// CA DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/partners/dashboard
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partner = await getPartnerOrThrow(uid(req))

    const assignments = await prisma.clientAssignment.findMany({
      where: { caPartnerId: partner.id },
      include: {
        client: { include: { company: true } },
        commissionLogs: { where: { month: getCurrentPeriod() } },
      },
    })

    const totalClients = assignments.length
    const activeClients = assignments.filter(a => a.status === 'ACTIVE').length

    const healthScores = await Promise.all(assignments.map(a => buildClientHealth(a.clientId)))
    const atRiskClients = healthScores.filter(h => h.health.score < 50).length
    const commissionThisMonth = assignments.reduce((sum, a) =>
      sum + a.commissionLogs.reduce((s, l) => s + l.commissionAmount, 0), 0
    )

    const allLogs = await prisma.commissionLog.findMany({ where: { caPartnerId: partner.id } })
    const commissionPending = allLogs.filter(l => l.status === 'PENDING' || l.status === 'INVOICED').reduce((s, l) => s + l.netPayout, 0)
    const commissionPaid = allLogs.filter(l => l.status === 'PAID').reduce((s, l) => s + l.netPayout, 0)
    const totalItcRecovered = assignments.reduce((sum, a) => sum + Number(a.totalItcRecovered), 0)

    res.json({
      success: true,
      data: {
        totalClients, activeClients, atRiskClients,
        commissionThisMonth, commissionPending, commissionPaid,
        totalItcRecovered,
        totalLifetimeEarnings: partner.totalEarned,
        pendingCommission: partner.pendingCommission,
        partner: { firmName: partner.firmName, status: partner.status, commissionRate: partner.commissionRate },
      },
    })
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT LIST & MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/partners/clients
router.get('/clients', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partner = await getPartnerOrThrow(uid(req))
    const { status, search, page = '1', limit = '20' } = req.query

    const where: any = { caPartnerId: partner.id }
    if (status) where.status = status
    if (search) {
      where.client = {
        OR: [
          { email: { contains: String(search), mode: 'insensitive' } },
          { company: { name: { contains: String(search), mode: 'insensitive' } } },
          { company: { gstin: { contains: String(search), mode: 'insensitive' } } },
        ],
      }
    }

    const [total, assignments] = await Promise.all([
      prisma.clientAssignment.count({ where }),
      prisma.clientAssignment.findMany({
        where,
        include: {
          client: { include: { company: { include: { gstins: true } } } },
          commissionLogs: { where: { month: getCurrentPeriod() } },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { lastActivityAt: 'desc' },
      }),
    ])

    const clientsWithHealth = await Promise.all(assignments.map(async (a) => {
      const { health, invoiceCount, unmatchedCount } = await buildClientHealth(a.clientId)
      return {
        id: a.id,
        clientId: a.clientId,
        companyName: a.client.company?.name,
        gstin: a.client.company?.gstin,
        assignedAt: a.assignedAt,
        status: a.status,
        healthScore: health.score,
        healthStatus: health.status,
        healthReasons: health.reasons,
        monthlyInvoiceCount: invoiceCount,
        pendingMismatches: unmatchedCount,
        totalItcRecovered: a.totalItcRecovered,
        lastActivityAt: a.lastActivityAt,
        commissionThisMonth: a.commissionLogs.reduce((s, l) => s + l.commissionAmount, 0),
      }
    }))

    res.json({
      success: true,
      data: clientsWithHealth,
      pagination: {
        total, page: Number(page), limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        hasNext: Number(page) * Number(limit) < total,
        hasPrev: Number(page) > 1,
      },
    })
  } catch (err) { next(err) }
})

// POST /api/v1/partners/clients/invite
router.post('/clients/invite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partner = await getPartnerOrThrow(uid(req))
    const { email, companyName, message } = req.body
    if (!email) throw new AppError('email is required', 400)

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?ca=${partner.id}&email=${encodeURIComponent(email)}`

    await sendGenericEmail(email, `${partner.firmName} invites you to GSTPro`, `
      <h2>You've been invited to GSTPro!</h2>
      <p><strong>${partner.firmName}</strong> is inviting you to manage your GST compliance together.</p>
      ${message ? `<p>${message}</p>` : ''}
      <p><strong>Company:</strong> ${companyName || 'Your company'}</p>
      <a href="${inviteLink}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
        Accept Invitation &amp; Sign Up
      </a>
    `)

    res.json({ success: true, message: `Invitation sent to ${email}`, inviteLink })
  } catch (err) { next(err) }
})

// POST /api/v1/partners/clients/:id/unassign
router.post('/clients/:id/unassign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partner = await getPartnerOrThrow(uid(req))
    const { reason } = req.body

    const assignment = await prisma.clientAssignment.findFirst({
      where: { id: req.params.id, caPartnerId: partner.id },
    })
    if (!assignment) throw new AppError('Assignment not found', 404)

    await prisma.clientAssignment.update({
      where: { id: req.params.id },
      data: { status: 'UNASSIGNED', unassignedAt: new Date(), unassignReason: reason || '' },
    })

    await prisma.auditLog.create({
      data: {
        userId: uid(req),
        action: 'CLIENT_UNASSIGNED',
        entityType: 'ClientAssignment',
        entityId: assignment.id,
        metadata: { reason, caPartnerId: partner.id, clientId: assignment.clientId },
      },
    })

    res.json({ success: true, message: 'Client unassigned' })
  } catch (err) { next(err) }
})

// GET /api/v1/partners/clients/:id/details
router.get('/clients/:id/details', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partner = await getPartnerOrThrow(uid(req))

    const assignment = await prisma.clientAssignment.findFirst({
      where: { id: req.params.id, caPartnerId: partner.id },
      include: {
        client: {
          include: {
            company: {
              include: {
                gstins: {
                  include: { invoices: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 20 } },
                },
              },
            },
          },
        },
      },
    })
    if (!assignment) throw new AppError('Assignment not found', 404)

    const { health } = await buildClientHealth(assignment.clientId)

    res.json({ success: true, data: { assignment, health, client: assignment.client } })
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────────────────────
// BULK OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/partners/bulk/reconcile
router.post('/bulk/reconcile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partner = await getPartnerOrThrow(uid(req))
    const { clientIds } = req.body
    if (!Array.isArray(clientIds) || clientIds.length === 0) throw new AppError('clientIds array required', 400)

    const assignments = await prisma.clientAssignment.findMany({
      where: { caPartnerId: partner.id, clientId: { in: clientIds }, status: 'ACTIVE' },
    })
    if (assignments.length !== clientIds.length) throw new AppError('Some clients not found or not active', 403)

    const { pdfQueue } = await import('../queues/pdfQueue')
    const jobIds: string[] = []
    for (const assignment of assignments) {
      // Queue a generic job — in production wire to reconciliationQueue
      const job = await pdfQueue.add('bulk-recon', { clientId: assignment.clientId } as any)
      jobIds.push(job.id!)
    }

    res.json({
      success: true,
      data: {
        jobIds,
        clientCount: assignments.length,
        estimatedCompletion: new Date(Date.now() + assignments.length * 30000),
      },
    })
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────────────────────
// COMMISSION & PAYOUTS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/partners/commission/summary
router.get('/commission/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partner = await getPartnerOrThrow(uid(req))

    const logs = await prisma.commissionLog.findMany({
      where: { caPartnerId: partner.id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    const byMonth = logs.reduce<Record<string, any>>((acc, log) => {
      if (!acc[log.month]) acc[log.month] = { month: log.month, total: 0, pending: 0, paid: 0, count: 0 }
      acc[log.month].total += log.commissionAmount
      acc[log.month].count += 1
      if (log.status === 'PENDING' || log.status === 'INVOICED') acc[log.month].pending += log.netPayout
      if (log.status === 'PAID') acc[log.month].paid += log.netPayout
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        summary: Object.values(byMonth),
        totals: { earned: partner.totalEarned, pending: partner.pendingCommission, paidOut: partner.totalPaidOut },
      },
    })
  } catch (err) { next(err) }
})

// GET /api/v1/partners/commission/details
router.get('/commission/details', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partner = await getPartnerOrThrow(uid(req))
    const { month, status } = req.query
    const where: any = { caPartnerId: partner.id }
    if (month) where.month = month
    if (status) where.status = status

    const logs = await prisma.commissionLog.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: logs })
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────────────────────
// WHITE-LABEL / BRANDING
// ─────────────────────────────────────────────────────────────────────────────

// PATCH /api/v1/partners/branding
router.patch('/branding', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partner = await getPartnerOrThrow(uid(req))
    const { firmName, firmLogo, firmWebsite, primaryColor, secondaryColor, subdomain } = req.body

    if (subdomain && subdomain !== partner.subdomain) {
      const existing = await prisma.cAPartner.findFirst({ where: { subdomain } })
      if (existing) throw new AppError('Subdomain already taken', 409)
    }

    const updated = await prisma.cAPartner.update({
      where: { id: partner.id },
      data: { firmName, firmLogo, firmWebsite, primaryColor, secondaryColor, subdomain },
    })

    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

export default router
