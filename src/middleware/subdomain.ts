import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'

declare global {
  namespace Express {
    interface Request {
      whitelabel?: {
        partnerId: string
        logoUrl: string | null
        primaryColor: string
        firmName: string
        subdomain: string
      }
    }
  }
}

export const subdomainMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const host = req.headers.host || ''
    const parts = host.split('.')
    
    // Check if we have a subdomain (excluding 'www' and local hosts)
    if (parts.length > 2 && !host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
      const subdomain = parts[0].toLowerCase()
      if (subdomain !== 'app' && subdomain !== 'www') {
        const partner = await prisma.cAPartner.findUnique({
          where: { subdomain },
          select: {
            id: true,
            firmName: true,
            firmLogo: true,
            primaryColor: true,
            subdomain: true
          }
        })

        if (partner && partner.subdomain) {
          req.whitelabel = {
            partnerId: partner.id,
            logoUrl: partner.firmLogo,
            primaryColor: partner.primaryColor,
            firmName: partner.firmName,
            subdomain: partner.subdomain
          }
        }
      }
    }
    next()
  } catch (err) {
    next()
  }
}
