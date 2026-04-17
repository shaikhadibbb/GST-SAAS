import axios from 'axios'
import { logger } from '../lib/logger'

export const sendWhatsAppMessage = async (to: string, message: string) => {
  try {
    const FACEBOOK_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!FACEBOOK_ACCESS_TOKEN || !PHONE_NUMBER_ID) {
        logger.info(`WhatsApp (MOCK) to ${to}: ${message}`)
        return { success: true, mock: true }
    }

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message },
      },
      { headers: { Authorization: `Bearer ${FACEBOOK_ACCESS_TOKEN}` } }
    )
    return response.data
  } catch (error) {
    logger.error('WhatsApp Send Error:', error)
    throw error
  }
}

export const downloadWhatsAppMedia = async (mediaId: string): Promise<Buffer> => {
    try {
        const FACEBOOK_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
        const res = await axios.get(`https://graph.facebook.com/v18.0/${mediaId}`, {
            headers: { Authorization: `Bearer ${FACEBOOK_ACCESS_TOKEN}` }
        })
        const downloadUrl = res.data.url
        const mediaRes = await axios.get(downloadUrl, {
            headers: { Authorization: `Bearer ${FACEBOOK_ACCESS_TOKEN}` },
            responseType: 'arraybuffer'
        })
        return Buffer.from(mediaRes.data)
    } catch (error) {
        logger.error('WhatsApp Media Download Error:', error)
        throw error
    }
}

export const analyzeInvoiceWithGemini = async (imageBuffer: Buffer) => {
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY
        if (!GEMINI_API_KEY) {
            // Mock extraction
            return {
                invoiceNumber: 'INV-' + Math.floor(Math.random() * 9000),
                totalAmount: 12500,
                customerName: 'Mock Customer',
                taxableValue: 10593,
                totalTax: 1907
            }
        }

        // Logic to call Gemini 1.5 Pro with Vision
        // Since I'm an AI, I'll simulate the structured output I'd get from myself
        const base64Image = imageBuffer.toString('base64')
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [
                        { text: "Extract invoice details as JSON: invoiceNumber, totalAmount, customerName, taxableValue, totalTax." },
                        { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                    ]
                }],
                generationConfig: { response_mime_type: "application/json" }
            }
        )
        
        const content = response.data.candidates[0].content.parts[0].text
        return JSON.parse(content)
    } catch (error) {
        logger.error('Gemini Vision Extraction Error:', error)
        throw error
    }
}
