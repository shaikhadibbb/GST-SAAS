import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'
import { sendWhatsAppMessage, downloadWhatsAppMedia, analyzeInvoiceWithGemini } from '../integrations/whatsapp'
import { Prisma } from '@prisma/client'

const router = Router()

// WhatsApp Webhook Verification
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge)
  } else {
    res.sendStatus(403)
  }
})

// WhatsApp Webhook Body Handler
router.post('/webhook', async (req, res) => {
  try {
    const { body } = req
    if (body.object !== 'whatsapp_business_account') return res.sendStatus(404)

    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const message = value?.messages?.[0]
    const from = message?.from // Sender's phone number

    if (!message) return res.sendStatus(200)

    // Find user by phone number (in real app, users would link phone)
    const user = await prisma.user.findFirst({
        where: { memberships: { some: { user: { phone: from } } } } // Assuming phone field updated in migration
    })

    if (message.type === 'image' && user && user.companyId) {
        const mediaId = message.image.id
        const buffer = await downloadWhatsAppMedia(mediaId)
        const extracted = await analyzeInvoiceWithGemini(buffer)

        // Create DRAFT invoice
        await prisma.invoice.create({
            data: {
                invoiceNumber: extracted.invoiceNumber,
                invoiceDate: new Date(),
                customerName: extracted.customerName,
                totalAmount: new Prisma.Decimal(extracted.totalAmount),
                taxableValue: new Prisma.Decimal(extracted.taxableValue),
                totalTax: new Prisma.Decimal(extracted.totalTax),
                status: 'DRAFT',
                placeOfSupply: '27', // Default or extracted
                gstinReg: { connect: { id: (await prisma.gSTINRegistration.findFirst({ where: { companyId: user.companyId } }))?.id } }
            }
        })

        await sendWhatsAppMessage(from, `✅ Invoice extracted: ${extracted.invoiceNumber} for ₹${extracted.totalAmount.toLocaleString('en-IN')}.\n\nReply "CONFIRM ${extracted.invoiceNumber}" to save it officially.`)
    }

    if (message.type === 'text') {
        const text = message.text.body.toUpperCase()
        if (text.startsWith('CONFIRM')) {
            const invPrefix = text.split(' ')[1]
            await prisma.invoice.updateMany({
                where: { invoiceNumber: { startsWith: invPrefix }, status: 'DRAFT' },
                data: { status: 'GENERATED' }
            })
            // Log audit
            await sendWhatsAppMessage(from, `🚀 Invoice ${invPrefix} has been GENERATED and saved to your dashboard.`)
        } else if (text.startsWith('CANCEL')) {
            const invPrefix = text.split(' ')[1]
            await prisma.invoice.updateMany({
                where: { invoiceNumber: { startsWith: invPrefix }, status: 'DRAFT' },
                data: { status: 'CANCELLED' }
            })
            await sendWhatsAppMessage(from, `⚠️ Invoice ${invPrefix} has been cancelled.`)
        } else if (text === 'STATUS') {
            await sendWhatsAppMessage(from, `📊 Your April 2026 Summary:\n- Invoices: 12\n- Tax Liability: ₹1.2L\n- ITC Risk: ₹14K\n- Health Score: 92/100\n- Next Deadline: May 11 (GSTR-1)`)
        }
    }

    res.sendStatus(200)
  } catch (error) {
    logger.error('WhatsApp Webhook Error:', error)
    res.sendStatus(500)
  }
})

router.get('/qr', async (req, res) => {
    // In real WhatsApp Business API Cloud, we create a chat link
    const phone = process.env.WHATSAPP_DISPLAY_PHONE || '911234567890'
    const link = `https://wa.me/${phone}?text=HI`
    res.json({ success: true, data: { qrLink: link } })
})

export default router
