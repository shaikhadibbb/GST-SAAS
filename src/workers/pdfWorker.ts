import { Worker, Job } from 'bullmq'
import { Cluster } from 'puppeteer-cluster'
import path from 'path'
import fs from 'fs'
import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'
import { generateInvoicePDFContent } from '../lib/pdfGenerator'

let cluster: Cluster | null = null
const MAX_CONCURRENCY = 2
const JOBS_PER_BROWSER = 50
let jobCount = 0

async function getCluster() {
  if (!cluster || jobCount >= JOBS_PER_BROWSER) {
    if (cluster) {
      await cluster.idle()
      await cluster.close()
    }
    cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_PAGE,
      maxConcurrency: MAX_CONCURRENCY,
      puppeteerOptions: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      }
    })
    jobCount = 0
    logger.info('🚀 PDF Browser Cluster (re)started')
  }
  return cluster
}

export const startPdfWorker = () => {
  const worker = new Worker(
    'pdf-queue',
    async (job: Job) => {
      const { invoiceId, requestedBy, companyId, pdfJobDbId } = job.data
      logger.info(`Processing PDF job ${job.id} for invoice ${invoiceId}`)

      try {
        await prisma.pdfJob.update({ where: { id: pdfJobDbId }, data: { status: 'PROCESSING', attempts: { increment: 1 } } })

        const invoice = await prisma.invoice.findUnique({
          where: { id: invoiceId },
          include: { gstinReg: { include: { company: true } } }
        })

        if (!invoice) throw new Error('Invoice not found')

        const pool = await getCluster()
        const filename = `Invoice_${invoice.invoiceNumber}_${Date.now()}.pdf`
        const filepath = path.join(process.cwd(), 'pdf-output', filename)

        if (!fs.existsSync(path.dirname(filepath))) {
           fs.mkdirSync(path.dirname(filepath), { recursive: true })
        }

        // Use the cluster for the task
        await pool.execute(invoice, async ({ page, data }) => {
          const html = await generateInvoicePDFContent(data, data.gstinReg.company)
          await page.setContent(html, { waitUntil: 'networkidle0' })
          await page.pdf({
            path: filepath,
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
          })
        })

        jobCount++

        await prisma.pdfJob.update({
          where: { id: pdfJobDbId },
          data: {
            status: 'COMPLETED',
            downloadUrl: filename,
            updatedAt: new Date()
          }
        })

        logger.info(`✅ PDF generated for job ${job.id}: ${filename}`)
      } catch (error: any) {
        logger.error(`❌ PDF job ${job.id} failed: ${error.message}`)
        
        // Critical Fallback logic for Survivability
        if (job.attemptsMade >= 3) {
            logger.warn(`Fallback: Attempting HTML-to-PDF mock/simple for job ${job.id}`)
            // In a real survival scenario, we would use a library like 'html-pdf-node' here
            // For now, we update status to FAILED so dunning/error UI can handle it
        }

        await prisma.pdfJob.update({
          where: { id: pdfJobDbId },
          data: {
            status: 'FAILED',
            errorMsg: error.message,
            updatedAt: new Date()
          }
        })
        throw error
      }
    },
    {
      connection: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT) || 6379 },
      concurrency: MAX_CONCURRENCY
    }
  )

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed with ${err.message}`)
  })

  logger.info('✅ PDF worker started with Puppeteer Cluster')
  return worker
}
