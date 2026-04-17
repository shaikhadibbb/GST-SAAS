import 'dotenv/config'
import express, { Application, Request, Response, NextFunction } from 'express'

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer
    }
  }
}

import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { prisma } from './lib/prisma'
import { redis } from './lib/redis'
import { logger } from './lib/logger'
import { AppError } from './lib/errors'
import authRoutes from './routes/auth.routes'
import invoiceRoutes from './routes/invoice.routes'
import gstr2aRoutes from './routes/gstr2a.routes'
import reconciliationRoutes from './routes/reconciliation.routes'
import dashboardRoutes from './routes/dashboard.routes'
import gstr1Routes from './routes/gstr1.routes'
import itcRoutes from './routes/itc.routes'
import adminRoutes from './routes/admin.routes'
import userRoutes from './routes/users.routes'
import onboardingRoutes from './routes/onboarding.routes'
import companyRoutes from './routes/company.routes'
// Phase 1: CA Partner Portal + Subscription Billing
import partnerRoutes from './routes/partner.routes'
import subscriptionRoutes from './routes/subscription.routes'
import uploadRoutes from './routes/upload.routes'
import healthRoutes from './routes/health.routes'
import notificationRoutes from './routes/notifications.routes'
import { startPdfWorker } from './workers/pdfWorker'
import { startGstnSyncWorker } from './queues/gstnSyncQueue'
import { pruneExpiredSessions } from './lib/sessionStore'

const app: Application = express()

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({
  origin: [process.env.ALLOWED_ORIGIN || 'http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id', 'Accept', 'X-Requested-With', 'Origin'],
  credentials: true,
}))

const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false })
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many authentication attempts.' } })

app.use('/api', globalLimiter)
app.use('/api/auth', authLimiter)
app.use(compression())
app.use(express.json({ 
  limit: '10mb',
  verify: (req: Request, _res: Response, buf: Buffer) => {
    if (req.originalUrl === '/api/v1/webhooks/razorpay') {
      req.rawBody = buf
    }
  }
}))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) }, skip: (req) => req.url === '/health' }))

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    const redisOk = await redis.ping()
    res.json({ status: 'ok', timestamp: new Date().toISOString(), services: { database: 'connected', redis: redisOk === 'PONG' ? 'connected' : 'degraded' } })
  } catch { res.status(503).json({ status: 'degraded' }) }
})

app.use('/api/auth', authRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/gstr2a', gstr2aRoutes)
app.use('/api/reconciliation', reconciliationRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/gstr1', gstr1Routes)
app.use('/api/itc', itcRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/users', userRoutes)
app.use('/api/onboarding', onboardingRoutes)
app.use('/api/companies', companyRoutes)
// Phase 1: CA Partner Portal
app.use('/api/v1/partners', partnerRoutes)
// Phase 1: Subscription Billing (plans + subscriptions + webhooks)
app.use('/api/v1', subscriptionRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/health', healthRoutes)
app.use('/api/notifications', notificationRoutes)

app.use((_req: Request, _res: Response, next: NextFunction) => { next(new AppError('Route not found', 404)) })

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message })
  }
  logger.error('Unhandled error:', err)
  return res.status(500).json({ success: false, message: err.message || 'Internal server error', stack: process.env.NODE_ENV === 'development' ? err.stack : undefined })
})

const PORT = Number(process.env.PORT) || 3000

async function bootstrap() {
  try {
    await prisma.$connect()
    logger.info('✅ PostgreSQL connected')
    await redis.ping()
    logger.info('✅ Redis connected')

    // workers
    startPdfWorker()
    startGstnSyncWorker()

    // CHANGED: Task 1 — prune expired sessions daily
    setInterval(() => { pruneExpiredSessions().catch((e) => logger.warn('Session prune error:', e)) }, 24 * 60 * 60 * 1000)

    app.listen(PORT, () => { logger.info(`🚀 GST SaaS API running on port ${PORT}`) })
  } catch (err) { logger.error('Failed to start server:', err); process.exit(1) }
}

process.on('SIGTERM', async () => { await prisma.$disconnect(); redis.disconnect(); process.exit(0) })
process.on('SIGINT', async () => { await prisma.$disconnect(); redis.disconnect(); process.exit(0) })

bootstrap()
export default app
