/**
 * TASK 4: BullMQ PDF Generation Queue
 *
 * Uses existing Redis instance (ioredis) — NO new Redis instance.
 * Queue: "pdf-generation"
 * Strategy:
 *  - API adds job → returns jobId immediately (< 500ms response)
 *  - Worker processes in background
 *  - Retry 3x with exponential backoff on failure
 *  - After 3 failures → dead letter (PdfJobStatus.DEAD_LETTER in DB)
 *  - Job status via GET /api/invoices/pdf-jobs/:jobId
 */

import { Queue, QueueEvents } from 'bullmq'
import { redis } from '../lib/redis'
import { logger } from '../lib/logger'

export interface PdfJobPayload {
  invoiceId: string       // UUID only — fetch fresh from DB in worker
  requestedBy: string     // User sub (UUID)
  companyId: string       // For ownership check
  pdfJobDbId: string      // PdfJob.id in Postgres (for status updates)
}

// BullMQ needs a raw ioredis connection (not the shared one during subscribe ops)
// We duplicate the connection config safely
const queueConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
}

export const pdfQueue = new Queue<PdfJobPayload>('pdf-generation', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: { age: 30 * 24 * 3600 }, // Keep completed 30 days
    removeOnFail: false, // Keep failed jobs for inspection
  },
})

export const pdfQueueEvents = new QueueEvents('pdf-generation', {
  connection: queueConnection,
})

pdfQueue.on('error', (err) => {
  logger.error('PDF queue error:', err)
})

pdfQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`PDF job ${jobId} failed: ${failedReason}`)
})

pdfQueueEvents.on('completed', ({ jobId }) => {
  logger.info(`PDF job ${jobId} completed`)
})

logger.info('✅ PDF queue initialised')
