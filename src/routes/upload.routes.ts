import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { GoogleGenerativeAI } from '@google/generative-ai'
import rateLimit from 'express-rate-limit'
import { authenticate } from '../middleware/auth.middleware'
import { AppError, ValidationError } from '../lib/errors'
import { logger } from '../lib/logger'

const router = Router()
router.use(authenticate)

// ─── Rate Limiter: 10 uploads per hour ────────────────────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10,
  keyGenerator: (req) => req.user?.sub || req.ip,
  message: { success: false, message: 'Rate limit exceeded: 10 uploads per hour. Please try later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// ─── Multer Configuration: Memory only, max 10MB ─────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new ValidationError('Invalid file type. Only PDF, JPG, and PNG are supported.'))
  }
})

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// ─── POST /api/upload/invoice ────────────────────────────────────────────────
router.post('/invoice', uploadLimiter, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new ValidationError('No file uploaded')
    if (!process.env.GEMINI_API_KEY) throw new AppError('AI processing is currently disabled (missing Gemini API key)', 503)

    let mimeType = req.file.mimetype
    let base64Data: string

    // Image optimization with Sharp
    if (req.file.mimetype.startsWith('image/')) {
       const optimized = await sharp(req.file.buffer)
        .resize({ width: 2000, withoutEnlargement: true }) // Downscale if huge
        .jpeg({ quality: 80 })
        .toBuffer()
       base64Data = optimized.toString('base64')
       mimeType = 'image/jpeg'
    } else {
       // PDFs are passed through directly if within size limits
       base64Data = req.file.buffer.toString('base64')
    }

    logger.info(`Gemini AI Parsing initiated for user ${req.user!.sub} (${req.file.mimetype})`)

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' } 
    })

    const prompt = `You are a GST invoice parser. Extract metadata from Indian GST invoices.
    Return a valid JSON object with these fields:
    - supplierName (string)
    - supplierGSTIN (string, uppercase)
    - invoiceNumber (string)
    - invoiceDate (string, YYYY-MM-DD)
    - taxableValue (number)
    - cgst (number)
    - sgst (number)
    - igst (number)
    - totalAmount (number)
    - hsnCode (string, optional)
    
    If any tax field is missing, set it to 0.`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ])

    const response = await result.response
    const textResponse = response.text()
    
    let parsedData
    try {
      parsedData = JSON.parse(textResponse)
    } catch (e) {
      logger.error('Failed to parse Gemini response:', textResponse)
      throw new AppError('AI failed to parse the invoice context correctly. Please enter details manually.', 500)
    }

    res.json({
      success: true,
      data: parsedData
    })

  } catch (err) {
    next(err)
  }
})

export default router
