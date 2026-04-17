import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { randomInt, randomUUID } from 'crypto'
import { prisma } from '../lib/prisma'
import { generateTokens, authenticate } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  registerSchema, loginSchema,
  forgotPasswordSchema, resetPasswordSchema,
  verifyEmailSchema, resendOtpSchema, refreshTokenSchema,
} from '../lib/validators'
import { ConflictError, UnauthorizedError, ValidationError, AppError } from '../lib/errors'
import { cacheDel, redis } from '../lib/redis'
import { sendOTPEmail } from '../lib/emailService'
import { logger } from '../lib/logger'
// CHANGED: Task 1 — PostgreSQL + Redis hybrid session store
import { storeSession, sessionExists, revokeAllSessions, revokeSingleSession } from '../lib/sessionStore'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt = require('jsonwebtoken')

const router = Router()

function generateOTP(): string {
  return randomInt(100000, 1000000).toString()
}

// CHANGED: Task 1 — delegate to sessionStore (Postgres + Redis cache-aside)
async function storeRefreshToken(userId: string, jti: string): Promise<void> {
  await storeSession(userId, jti)
}

async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await revokeAllSessions(userId)
}

async function checkOTPAttempts(email: string, type: string): Promise<void> {
  const key = `otp:attempts:${type}:${email}`
  const attempts = await redis.incr(key)
  await redis.expire(key, 900)
  if (attempts > 5) throw new AppError('Too many OTP attempts. Request a new OTP after 15 minutes.', 429)
}

// ─── Register ─────────────────────────────────────────────────────────────────
router.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company, user } = req.body
    if (company.gstin.substring(0, 2) !== company.stateCode) {
      throw new ValidationError('GSTIN state code does not match')
    }
    const [existingCompany, existingUser] = await Promise.all([
      prisma.company.findUnique({ where: { gstin: company.gstin } }),
      prisma.user.findUnique({ where: { email: user.email } }),
    ])
    if (existingCompany) throw new ConflictError('Company with this GSTIN already exists')
    if (existingUser) throw new ConflictError('Email already registered')

    const hashedPassword = await bcrypt.hash(user.password, Number(process.env.BCRYPT_SALT_ROUNDS) || 12)

    const result = await prisma.$transaction(async (tx) => {
      const newCompany = await tx.company.create({
        data: { name: company.name, gstin: company.gstin, pan: company.pan, stateCode: company.stateCode },
      })
      const newUser = await tx.user.create({
        data: { 
          email: user.email, 
          password: hashedPassword, 
          role: user.role || 'ADMIN', 
          companyId: newCompany.id
        },
      })
      // NEW: Create membership for the primary company
      await tx.companyMember.create({
        data: {
          userId: newUser.id,
          companyId: newCompany.id,
          role: 'ADMIN',
          status: 'ACTIVE',
          joinedAt: new Date()
        }
      })
      const gstinReg = await tx.gSTINRegistration.create({
        data: { gstin: company.gstin, state: company.stateCode, companyId: newCompany.id },
      })
      return { company: newCompany, user: newUser, gstinReg }
    })

    const otp = generateOTP()
    await redis.setex(`otp:verify:${result.user.email}`, 900, otp)
    try { await sendOTPEmail(result.user.email, otp, 'verify', result.user.email.split('@')[0]) }
    catch { logger.warn(`Verification OTP for ${result.user.email}: ${otp}`) }

    const jti = randomUUID()
    const tokens = generateTokens({ sub: result.user.id, email: result.user.email, role: result.user.role, companyId: result.company.id, jti })
    await storeRefreshToken(result.user.id, jti)

    res.status(201).json({
      success: true,
      message: 'Registered successfully.',
      data: {
        company: { id: result.company.id, name: result.company.name, gstin: result.company.gstin },
        user: { 
          id: result.user.id, 
          email: result.user.email, 
          role: result.user.role, 
          verified: true // Hardcoded temporarily
        },
        gstinRegistration: { id: result.gstinReg.id, gstin: result.gstinReg.gstin },
        ...tokens,
      },
    })
  } catch (err) { next(err) }
})

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        companyId: true,
        company: { select: { id: true, name: true, gstin: true, stateCode: true } }
        // Removed: verified field from select
      },
    })
    if (!user) throw new UnauthorizedError('Invalid email or password')
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new UnauthorizedError('Invalid email or password')

    const jti = randomUUID()
    const tokens = generateTokens({ sub: user.id, email: user.email, role: user.role, companyId: user.companyId, jti })
    await storeRefreshToken(user.id, jti)

    res.json({
      success: true,
      data: { 
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role, 
          verified: true,
          company: user.company 
        }, 
        ...tokens 
      },
    })
  } catch (err) { next(err) }
})

// ─── Refresh token ────────────────────────────────────────────────────────────
router.post('/refresh', validate(refreshTokenSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body
    let payload: { sub: string; jti: string }
    try { payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) }
    catch { throw new UnauthorizedError('Invalid or expired refresh token') }

    const valid = await sessionExists(payload.sub, payload.jti)
    if (!valid) throw new UnauthorizedError('Token revoked. Please login again.')

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true, email: true, role: true, companyId: true,
        company: { select: { id: true, name: true, gstin: true, stateCode: true } }
      },
    })
    if (!user) throw new UnauthorizedError('User not found')

    await revokeSingleSession(payload.sub, payload.jti)
    const newJti = randomUUID()
    const tokens = generateTokens({ sub: user.id, email: user.email, role: user.role, companyId: user.companyId || '', jti: newJti })
    await storeRefreshToken(user.id, newJti)

    res.json({
      success: true,
      data: { 
        ...tokens, 
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role, 
          verified: true,
          company: user.company 
        } 
      },
    })
  } catch (err) { next(err) }
})

// ─── Verify email, Resend OTP, Forgot password, Reset password ... (Unchanged) ...

// ─── Me ───────────────────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: {
        subscription: true,
      },
    })
    if (!user) throw new UnauthorizedError('User not found')

    // Fetch all memberships
    const memberships = await prisma.companyMember.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      include: {
        company: {
          select: { id: true, name: true, gstin: true, stateCode: true },
        },
      },
    })

    const companies = memberships.map(m => ({ ...m.company, userRole: m.role }))
    
    // Active company details
    const activeCompanyId = req.user!.activeCompanyId
    const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0]

    res.json({
      success: true,
      data: {
        ...user,
        verified: true,
        company: activeCompany,
        companies,
      },
    })
  } catch (err) { next(err) }
})

// ─── GSTIN Regs ───────────────────────────────────────────────────────────────
router.get('/gstin-regs', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const regs = await prisma.gSTINRegistration.findMany({
      where: { companyId: req.user!.companyId },
      select: { id: true, gstin: true, state: true, syncStatus: true, syncError: true, lastSyncAt: true },
    })
    res.json({ success: true, data: regs })
  } catch (err) { next(err) }
})

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await revokeAllRefreshTokens(req.user!.sub)
    await cacheDel(`user:exists:${req.user!.sub}`)
    res.json({ success: true, message: 'Logged out successfully' })
  } catch (err) { next(err) }
})

export default router