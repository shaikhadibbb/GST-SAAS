import crypto from 'crypto'
import { logger } from './logger'

// Must be exactly 32 bytes (256 bits)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef' // 32 chars fallback for dev
const ALGORITHM = 'aes-256-gcm'

/**
 * Encrypts a string using AES-256-GCM.
 * Used for storing sensitive credentials (like GSP passwords) at rest in the DB.
 */
export function encryptField(text: string): string {
  if (!text) return text
  try {
    const iv = crypto.randomBytes(12) // 12 bytes is standard for GCM
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()
    
    // Format: iv:authTag:encryptedText
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (err) {
    logger.error('Encryption failed:', err)
    throw new Error('Failed to encrypt field')
  }
}

/**
 * Decrypts a string previously encrypted with encryptField().
 */
export function decryptField(encryptedStr: string): string {
  if (!encryptedStr) return encryptedStr
  try {
    const parts = encryptedStr.split(':')
    if (parts.length !== 3) throw new Error('Invalid encrypted format')
    
    const [ivHex, authTagHex, encryptedText] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (err) {
    logger.error('Decryption failed:', err)
    throw new Error('Failed to decrypt field')
  }
}
