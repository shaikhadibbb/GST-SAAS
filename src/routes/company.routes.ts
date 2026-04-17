import { Router, Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth.middleware'
import { AppError, NotFoundError, ForbiddenError, ConflictError } from '../lib/errors'
import { MemberRole } from '@prisma/client'
import { sendGenericEmail } from '../lib/emailService'
import { logger } from '../lib/logger'

const router = Router()
router.use(authenticate)

// ─── List Companies ────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberships = await prisma.companyMember.findMany({
      where: { userId: req.user!.sub, status: 'ACTIVE' },
      include: {
        company: {
          select: { id: true, name: true, gstin: true, pan: true, stateCode: true, subscriptionPlan: true, status: true }
        }
      }
    })
    res.json({ success: true, data: memberships.map(m => ({ ...m.company, userRole: m.role })) })
  } catch (err) { next(err) }
})

// ─── Create Company ───────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, gstin, pan, stateCode } = req.body
    if (!name || !gstin || !pan || !stateCode) throw new AppError('Missing required fields', 400)

    const existing = await prisma.company.findUnique({ where: { gstin } })
    if (existing) throw new ConflictError('Company with this GSTIN already exists')

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name, gstin, pan, stateCode }
      })
      const member = await tx.companyMember.create({
        data: {
          companyId: company.id,
          userId: req.user!.sub,
          role: MemberRole.ADMIN,
          status: 'ACTIVE',
          joinedAt: new Date()
        }
      })
      // Also create a default GSTIN registration for the firm
      await tx.gSTINRegistration.create({
        data: { gstin, state: stateCode, companyId: company.id }
      })
      return { company, member }
    })

    res.status(201).json({ success: true, data: result.company })
  } catch (err) { next(err) }
})

// ─── Get Company Details (with Members) ──────────────────────────────────────
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const membership = await prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: req.user!.sub, companyId: id } }
    })
    if (!membership) throw new ForbiddenError('Access denied')

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true } }
          }
        }
      }
    })
    if (!company) throw new NotFoundError('Company')

    res.json({ success: true, data: company })
  } catch (err) { next(err) }
})

// ─── Invite Member ────────────────────────────────────────────────────────────
router.post('/:id/invite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { email, role } = req.body

    const membership = await prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: req.user!.sub, companyId: id } }
    })
    if (!membership || membership.role !== MemberRole.ADMIN) throw new ForbiddenError('Admin access required')

    const token = randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        companyId: id,
        email,
        role: role as MemberRole,
        token,
        expiresAt
      },
      include: { company: { select: { name: true } } }
    })

    // Send email
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${token}`
    await sendGenericEmail(
      email,
      `Invitation to join ${invitation.company.name} on GSTPro`,
      `You have been invited to join ${invitation.company.name} as a ${role}.\n\nAccept here: ${inviteLink}`
    )

    res.json({ success: true, message: 'Invitation sent' })
  } catch (err) { next(err) }
})

// ─── Accept Invite ────────────────────────────────────────────────────────────
router.post('/accept-invite/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { company: true }
    })

    if (!invitation || invitation.accepted || invitation.expiresAt < new Date()) {
      throw new AppError('Invalid or expired invitation', 400)
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create membership
      const membership = await tx.companyMember.upsert({
        where: { userId_companyId: { userId: req.user!.sub, companyId: invitation.companyId } },
        update: { 
          role: invitation.role,
          status: 'ACTIVE',
          joinedAt: new Date()
        },
        create: {
          userId: req.user!.sub,
          companyId: invitation.companyId,
          role: invitation.role,
          status: 'ACTIVE',
          joinedAt: new Date()
        }
      })

      // Mark invitation accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { accepted: true }
      })

      return membership
    })

    res.json({ success: true, message: 'Invitation accepted', data: result })
  } catch (err) { next(err) }
})

// ─── Member Roles & Removal ───────────────────────────────────────────────────
router.patch('/:id/members/:userId/role', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, userId } = req.params
    const { role } = req.body

    const adminCheck = await prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: req.user!.sub, companyId: id } }
    })
    if (!adminCheck || adminCheck.role !== MemberRole.ADMIN) throw new ForbiddenError('Admin access required')

    await prisma.companyMember.update({
      where: { userId_companyId: { userId, companyId: id } },
      data: { role: role as MemberRole }
    })

    res.json({ success: true, message: 'Role updated' })
  } catch (err) { next(err) }
})

router.delete('/:id/members/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, userId } = req.params
    if (userId === req.user!.sub) throw new AppError('Cannot remove yourself', 400)

    const adminCheck = await prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: req.user!.sub, companyId: id } }
    })
    if (!adminCheck || adminCheck.role !== MemberRole.ADMIN) throw new ForbiddenError('Admin access required')

    await prisma.companyMember.delete({
      where: { userId_companyId: { userId, companyId: id } }
    })

    res.json({ success: true, message: 'Member removed' })
  } catch (err) { next(err) }
})

export default router
