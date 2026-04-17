import axios, { AxiosInstance } from 'axios'
import { redis } from '../../lib/redis'
import { logger } from '../../lib/logger'
import {
  generateAppKey,
  encryptAsymmetric,
  encryptSymmetric,
  decryptSymmetric,
  generateHmac,
} from './crypto'
import { prisma } from '../../lib/prisma'
import { decryptField } from '../../lib/encryption'

const GSTN_BASE_URL = process.env.GSTN_BASE_URL || 'https://sandbox.cleartax.in/gst/api'
const GSP_CLIENT_ID = process.env.GSP_CLIENT_ID || 'sandbox_client_id'
const GSP_CLIENT_SECRET = process.env.GSP_CLIENT_SECRET || 'sandbox_client_secret'

interface GstnAuthResponse {
  status_cd: string
  auth_token?: string
  sek?: string
  error?: { message: string; code: string }
}

export class GSTNClient {
  private apiClient: AxiosInstance

  constructor(private gstin: string, private companyId: string) {
    this.apiClient = axios.create({
      baseURL: GSTN_BASE_URL,
      timeout: 30000,
    })
  }

  /**
   * Orchestrates the authentication dance.
   * Caches AuthToken and Decrypted SEK in Redis for 6 hours.
   */
  public async authenticate(): Promise<{ token: string; sek: string }> {
    const redisKeyToken = `gstn:auth:${this.gstin}`
    const redisKeySek = `gstn:sek:${this.gstin}`

    // Check Cache
    const cachedToken = await redis.get(redisKeyToken)
    const cachedSek = await redis.get(redisKeySek)

    if (cachedToken && cachedSek) {
      return { token: cachedToken, sek: cachedSek }
    }

    // Fetch user credentials
    const credentials = await prisma.gSTINRegistration.findUnique({
      where: { gstin_companyId: { gstin: this.gstin, companyId: this.companyId } },
      select: { gspUsername: true, gspPassword: true },
    })

    if (!credentials?.gspUsername || !credentials?.gspPassword) {
      throw new Error(`GSP credentials missing for GSTIN ${this.gstin}`)
    }

    const plaintextPassword = decryptField(credentials.gspPassword)
    const appKey = generateAppKey()
    const encAppKey = encryptAsymmetric(appKey)

    try {
      const response = await this.apiClient.post('/v0.2/authenticate', {
        action: 'ACCESSTOKEN',
        username: credentials.gspUsername,
        password: encryptSymmetric(plaintextPassword, appKey), // password encrypted via symmetric appKey
        app_key: encAppKey,
      }, {
        headers: {
          'clientid': GSP_CLIENT_ID,
          'client-secret': GSP_CLIENT_SECRET,
          'gstin': this.gstin,
          'Content-Type': 'application/json',
        }
      })

      const data = response.data as GstnAuthResponse

      if (data.status_cd !== '1' || !data.auth_token || !data.sek) {
        throw new Error(data.error?.message || 'Authentication failed at GSTN')
      }

      // The returned SEK is encrypted via our AppKey. We decrypt it to get the raw SEK.
      const rawSekBase64 = decryptSymmetric(data.sek, appKey) // This is Base64 encoded JSON usually? No, it's just raw Base64 bytes.

      // Store in Redis (GSTN tokens valid for exactly 360 minutes / 6 hours)
      // We set to 5.5 hours to be safe.
      const TTL = 5.5 * 60 * 60
      await redis.setex(redisKeyToken, TTL, data.auth_token)
      await redis.setex(redisKeySek, TTL, rawSekBase64)

      return { token: data.auth_token, sek: rawSekBase64 }
    } catch (err: any) {
      logger.error('GSTN Authentication error:', err?.response?.data || err.message)
      throw new Error('Failed to authenticate with GSTN API')
    }
  }

  /**
   * Generic Post Method handling Payload Encryption and Headers
   */
  public async post(endpoint: string, payload: any): Promise<any> {
    const { token, sek } = await this.authenticate()
    
    // Stringify and base64
    const jsonPayload = JSON.stringify(payload)
    const base64Payload = Buffer.from(jsonPayload).toString('base64')

    // Encrypt Data
    const encryptedData = encryptSymmetric(base64Payload, sek)
    
    // Generate HMAC
    const hmac = generateHmac(base64Payload, sek)

    const requestBody = {
      action: payload.action || 'REQS',
      data: encryptedData,
      hmac: hmac,
    }

    try {
      const res = await this.apiClient.post(endpoint, requestBody, {
        headers: {
          'clientid': GSP_CLIENT_ID,
          'auth-token': token,
          'gstin': this.gstin,
          'Content-Type': 'application/json',
        }
      })

      // If response is encrypted, decrypt it. Note: Many GET endpoints return encrypted data,
      // but some POST APIs return raw status. We handle generic decryption here.
      if (res.data && res.data.data) {
        const decryptedBase64 = decryptSymmetric(res.data.data, sek)
        const rawJsonString = Buffer.from(decryptedBase64, 'base64').toString('utf8')
        try {
          res.data.data = JSON.parse(rawJsonString)
        } catch {
          res.data.data = rawJsonString
        }
      }

      return res.data
    } catch (err: any) {
      logger.error(`GSTN API Error on ${endpoint}:`, err?.response?.data || err.message)
      throw new Error(`GSTN request failed on ${endpoint}`)
    }
  }

  /**
   * Generic Get Method (GET APIs often don't encrypt payload as there is none, but encrypt the response)
   */
  public async get(endpoint: string, params: Record<string, string>): Promise<any> {
    const { token, sek } = await this.authenticate()

    try {
      const res = await this.apiClient.get(endpoint, {
        params,
        headers: {
          'clientid': GSP_CLIENT_ID,
          'auth-token': token,
          'gstin': this.gstin,
        }
      })

      if (res.data && res.data.data) {
        const decryptedBase64 = decryptSymmetric(res.data.data, sek)
        const rawJsonString = Buffer.from(decryptedBase64, 'base64').toString('utf8')
        try {
          res.data.data = JSON.parse(rawJsonString)
        } catch {
          res.data.data = rawJsonString
        }
      }

      return res.data
    } catch (err: any) {
      logger.error(`GSTN API Error on ${endpoint}:`, err?.response?.data || err.message)
      throw new Error(`GSTN request failed on ${endpoint}`)
    }
  }
}
