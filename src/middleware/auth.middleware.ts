import { Request, Response, NextFunction } from 'express'
import { Role, CompanyMember } from '@prisma/client'
import { UnauthorizedError, ForbiddenError } from '../lib/errors'
import { prisma } from '../lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt = require('jsonwebtoken')

export interface JWTPayload {
  sub: string
  email: string
  role: Role
  companyId?: string // Now optional in token, as it may be passed via header
  jti?: string
  iat: number
  exp: number
}

declare global {
  namespace Express {
    interface Request { 
      user?: JWTPayload & { activeCompanyId?: string }
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or malformed Authorization header'))
    return
  }
  
  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload
    
    // Multi-company logic
    const headerCompanyId = req.headers['x-company-id'] as string
    let activeCompanyId = headerCompanyId

    if (activeCompanyId) {
      // Verify membership
      const membership = await prisma.companyMember.findUnique({
        where: { userId_companyId: { userId: payload.sub, companyId: activeCompanyId } }
      })
      if (!membership || membership.status !== 'ACTIVE') {
        next(new ForbiddenError('You do not have access to this company'))
        return
      }
    } else {
      // Try to find a default company from memberships
      const defaultMember = await prisma.companyMember.findFirst({
        where: { userId: payload.sub, status: 'ACTIVE' },
        orderBy: { joinedAt: 'asc' }
      })
      
      // Fallback priority: Header > Memberships > JWT payload
      activeCompanyId = defaultMember?.companyId || payload.companyId || undefined
    }

    req.user = { 
      ...payload, 
      activeCompanyId, 
      companyId: activeCompanyId // Override companyId for backward compatibility with existing routes
    }
    
    next()
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Token expired'))
    } else {
      next(new UnauthorizedError('Invalid token'))
    }
  }
}

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) { next(new UnauthorizedError()); return }
    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError(`Access denied. Required: ${allowedRoles.join(', ')}`))
      return
    }
    next()
  }
}

// ✅ FIXED: Explicit string type for expiresIn
export function generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  const jwtSecret: string = process.env.JWT_SECRET as string
  const jwtRefreshSecret: string = process.env.JWT_REFRESH_SECRET as string
  const expiresIn: string = (process.env.JWT_EXPIRES_IN as string) || '8h'
  const refreshExpiresIn: string = (process.env.JWT_REFRESH_EXPIRES_IN as string) || '7d'

  const accessToken = jwt.sign(
    { sub: payload.sub, email: payload.email, role: payload.role, companyId: payload.companyId },
    jwtSecret,
    { expiresIn }
  ) as string

  const refreshToken = jwt.sign(
    { sub: payload.sub, jti: payload.jti },
    jwtRefreshSecret,
    { expiresIn: refreshExpiresIn }
  ) as string

  return { accessToken, refreshToken }
}
