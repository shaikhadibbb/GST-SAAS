import Razorpay from 'razorpay'
import crypto from 'crypto'
import { logger } from '../lib/logger'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret'
})

export const createRazorpaySubscription = async (planId: string, customerEmail: string) => {
  try {
    // In real prod, you might create a customer first if not exists
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12, // For 1 year if monthly, or 1 if annual? 
      // Actually total_count is how many times it will charge.
      quantity: 1,
    })
    return subscription
  } catch (error) {
    logger.error('Razorpay Subscription Creation Failed:', error)
    throw error
  }
}

export const verifyRazorpaySignature = (
  razorpayPaymentId: string,
  razorpaySubscriptionId: string,
  razorpaySignature: string
) => {
  const secret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret'
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayPaymentId}|${razorpaySubscriptionId}`)
    .digest('hex')

  return generatedSignature === razorpaySignature
}

export const verifyWebhookSignature = (body: string, signature: string) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret'
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  return expectedSignature === signature
}

export default razorpay
