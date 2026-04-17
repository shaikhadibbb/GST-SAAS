import { Queue, Worker, QueueEvents, Job } from 'bullmq'
import { redis } from '../lib/redis'
import { logger } from '../lib/logger'
import { prisma } from '../lib/prisma'
import { GSTNClient } from '../services/gstn/apiClient'

export interface GstnSyncPayload {
  gstin: string
  companyId: string
  syncType: 'GSTR2A' | 'GSTR2B' | 'LEDGER'
  period: string // e.g., "042023" for April 2023
  requestedBy: string
}

const queueConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
}

export const gstnSyncQueue = new Queue<GstnSyncPayload>('gstn-sync', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // GSTN is strict, backoff heavily (5s, 10s, 20s)
    },
    removeOnComplete: { age: 7 * 24 * 3600 }, // Keep for 7 days
    removeOnFail: false,
  },
})

export const gstnSyncEvents = new QueueEvents('gstn-sync', { connection: queueConnection })

gstnSyncEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`GSTN Sync job ${jobId} failed: ${failedReason}`)
})

export function startGstnSyncWorker() {
  const worker = new Worker<GstnSyncPayload>(
    'gstn-sync',
    async (job: Job<GstnSyncPayload>) => {
      const { gstin, companyId, syncType, period } = job.data

      logger.info(`Starting ${syncType} sync for ${gstin} period ${period}`)

      // Mark status as SYNCING
      await prisma.gSTINRegistration.updateMany({
        where: { gstin, companyId },
        data: { syncStatus: 'SYNCING', syncError: null },
      })

      try {
        const client = new GSTNClient(gstin, companyId)

        if (syncType === 'GSTR2A') {
          // Dummy Endpoint: /v0.2/returns/gstr2a
          // GSTN GET params usually require action = B2B, CDNR, etc.
          // We loop through required actions based on specification
          const actions = ['B2B', 'B2BA', 'CDNR', 'CDNRA']
          let totalRecords = 0

          for (const action of actions) {
            try {
              const response = await client.get('/v0.2/returns/gstr2a', { action, ret_period: period })
              // Process standard payload (e.g. response.data.b2b)
              // This is where standard DB normalization logic goes.
              // For demonstration, we just log and mimic success.
              logger.info(`Pulled ${action} data successfully.`)
              if (response.data && Array.isArray(response.data[action.toLowerCase()])) {
                 totalRecords += response.data[action.toLowerCase()].length
              }
            } catch (err: any) {
              // Not all actions have data, often throws 404/No Data Found. We can safely ignore some.
              logger.warn(`Action ${action} empty or failed: ${err.message}`)
            }
            
            // Sleep briefly between action pulls to avoid rapid fire rate limits
            await new Promise(r => setTimeout(r, 500))
          }

          logger.info(`Completed GSTR2A pull. Total blocks: ${totalRecords}`)
        }

        // Reset status to IDLE and mark sync time
        await prisma.gSTINRegistration.updateMany({
          where: { gstin, companyId },
          data: { syncStatus: 'IDLE', lastSyncAt: new Date() },
        })

        return { success: true, processedType: syncType }
        
      } catch (err: any) {
        logger.error(`Failed ${syncType} sync for ${gstin}: ${err.message}`)
        
        await prisma.gSTINRegistration.updateMany({
          where: { gstin, companyId },
          data: { syncStatus: 'ERROR', syncError: err.message },
        })
        
        throw err // Trigger bullmq retry
      }
    },
    {
      connection: queueConnection,
      concurrency: 5, // Process max 5 GSTNs simultaneously to protect single IP bandwidth
      limiter: {
        max: 50, // Max 50 jobs
        duration: 1000 * 60, // per 1 minute (Rate limiting integration)
      }
    }
  )

  worker.on('error', err => logger.error('GSTN Sync Worker Error:', err))
  logger.info('✅ GSTN Sync Worker started')
  return worker
}
