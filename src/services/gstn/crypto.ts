import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { logger } from '../../lib/logger'

// In a real environment, this would strictly point to GSTN's public certificate
// We use a dummy fallback path for sandbox if missing.
const GSTN_PUB_KEY_PATH = process.env.GSTN_PUB_KEY_PATH || path.join(__dirname, 'dummy_gstn_public.pem')

/**
 * 1. Generates the 256-bit symmetric AppKey needed for the session.
 * Used for encrypting the payload and as the HMAC key.
 */
export function generateAppKey(): string {
  // 32 bytes = 256 bits
  const key = crypto.randomBytes(32)
  return key.toString('base64')
}

/**
 * 2. Encrypts the Base64 encoded AppKey using the GSTN RSA Public Key.
 * GSTN dictates: RSA/ECB/PKCS1Padding
 */
export function encryptAsymmetric(appKeyBase64: string): string {
  try {
    let publicKey = ''
    if (fs.existsSync(GSTN_PUB_KEY_PATH)) {
      publicKey = fs.readFileSync(GSTN_PUB_KEY_PATH, 'utf8')
    } else {
      // Sandbox warning: if running locally without real keys, just simulate it for build safety
      logger.warn(`GSTN Public Key not found at ${GSTN_PUB_KEY_PATH}. Proceeding with simulated asymmetric encryption (sandbox).`)
      return Buffer.from(`simulated_rsa_${appKeyBase64}`).toString('base64')
    }

    const buffer = Buffer.from(appKeyBase64, 'utf8')
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer
    )
    return encrypted.toString('base64')
  } catch (err) {
    logger.error('encryptAsymmetric failed', err)
    throw new Error('Failed to encrypt AppKey asymmetrically')
  }
}

/**
 * 3. Encrypt JSON Payload with AES-256-ECB.
 * GSTN uses AES-256 in ECB mode with PKCS7 padding.
 * Node's aes-256-ecb auto-applies PKCS7.
 *
 * @param jsonData Stringified JSON payload
 * @param sekBase64 Either the AppKey (request) or SEK from auth (subsequent requests)
 */
export function encryptSymmetric(jsonData: string, sekBase64: string): string {
  try {
    const key = Buffer.from(sekBase64, 'base64')
    // ECB doesn't use an IV, we pass an empty buffer or null
    const cipher = crypto.createCipheriv('aes-256-ecb', key, null)
    let encrypted = cipher.update(jsonData, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    return encrypted
  } catch (err) {
    logger.error('encryptSymmetric failed', err)
    throw new Error('Failed to symmetrically encrypt payload')
  }
}

/**
 * 4. Decrypt GSTN JSON response payload using AES-256-ECB.
 * @param encryptedBase64 Payload from GSTN response
 * @param sekBase64 The SEK provided by GSTN upon auth
 */
export function decryptSymmetric(encryptedBase64: string, sekBase64: string): string {
  try {
    const key = Buffer.from(sekBase64, 'base64')
    const decipher = crypto.createDecipheriv('aes-256-ecb', key, null)
    let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    // GSTN sometimes returns Base64 encoded JSON even after AES decryption
    // But usually it's direct JSON string depending on the API variant.
    return decrypted
  } catch (err) {
    logger.error('decryptSymmetric failed', err)
    throw new Error('Failed to symmetrically decrypt payload')
  }
}

/**
 * 5. Generates HMAC-SHA256 hash for payload integrity.
 * @param payloadBase64 The base64 representation of the JSON string or AES payload
 * @param appKeyBase64 The symmetric key used for HMAC
 */
export function generateHmac(payloadBase64: string, appKeyBase64: string): string {
  try {
    const key = Buffer.from(appKeyBase64, 'base64')
    const hmac = crypto.createHmac('sha256', key)
    hmac.update(payloadBase64, 'utf8')
    return hmac.digest('base64')
  } catch (err) {
    logger.error('generateHmac failed', err)
    throw new Error('Failed to generate HMAC')
  }
}
