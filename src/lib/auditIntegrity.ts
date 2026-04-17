import crypto from 'crypto'
import { prisma } from './prisma'

export async function createHashedAuditLog(data: {
  userId: string
  action: string
  entityType: string
  entityId: string
  invoiceId?: string
  before?: any
  after?: any
  metadata?: any
  ipAddress?: string
}) {
  // Get latest log for chain
  const lastLog = await prisma.auditLog.findFirst({
    orderBy: { createdAt: 'desc' }
  })

  const prevHash = lastLog?.hash || '0'
  const timestamp = new Date().toISOString()
  
  const content = `${prevHash}|${data.action}|${data.entityType}|${data.entityId}|${timestamp}`
  const hash = crypto.createHmac('sha256', process.env.ENCRYPTION_KEY || 'audit-secret')
    .update(content)
    .digest('hex')

  return await prisma.auditLog.create({
    data: {
      ...data,
      hash,
      previousHash: prevHash
    }
  })
}

export async function verifyAuditChain() {
   const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'asc' } })
   let currentPrevHash = '0'
   
   for (const log of logs) {
      const content = `${currentPrevHash}|${log.action}|${log.entityType}|${log.entityId}|${log.createdAt.toISOString()}`
      const expectedHash = crypto.createHmac('sha256', process.env.ENCRYPTION_KEY || 'audit-secret')
        .update(content)
        .digest('hex')
        
      if (log.hash !== expectedHash) return { valid: false, brokenAt: log.id }
      currentPrevHash = log.hash!
   }
   return { valid: true }
}
