import nodemailer from 'nodemailer'
import { logger } from './logger'

function otpEmailHtml(otp: string, type: 'verify' | 'reset', name: string): string {
  const title = type === 'verify' ? 'Verify Your Email' : 'Reset Your Password'
  const message = type === 'verify' ? 'Use this OTP to verify your email' : 'Use this OTP to reset your password'
  return `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
<div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:32px;text-align:center;">
    <div style="font-size:28px;font-weight:800;color:white;">⚡ GSTPro</div>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#1e293b;margin:0 0 8px;">${title}</h2>
    <p style="color:#64748b;margin:0 0 24px;">Hi ${name}, ${message}:</p>
    <div style="background:#f0f0ff;border:2px dashed #4F46E5;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <div style="font-size:36px;font-weight:800;color:#4F46E5;letter-spacing:8px;font-family:monospace;">${otp}</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:8px;">Expires in 15 minutes</div>
    </div>
    <p style="font-size:12px;color:#94a3b8;">Never share this OTP with anyone.</p>
  </div>
</div>
</body></html>`
}

export async function sendOTPEmail(
  email: string,
  otp: string,
  type: 'verify' | 'reset',
  name = 'User'
): Promise<void> {
  // ✅ ALWAYS log OTP in terminal for debugging
  logger.info(`\n${'='.repeat(50)}`)
  logger.info(`📧 OTP EMAIL`)
  logger.info(`To: ${email}`)
  logger.info(`Type: ${type.toUpperCase()}`)
  logger.info(`OTP: ${otp}`)
  logger.info(`${'='.repeat(50)}\n`)

  // Only try to send email if SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER === '') {
    logger.warn('📭 SMTP not configured — OTP shown in terminal above')
    return
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })

    const subject = type === 'verify' ? '✅ Verify your GSTPro email' : '🔐 Reset your GSTPro password'
    await transporter.sendMail({
      from: `"GSTPro" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html: otpEmailHtml(otp, type, name),
    })
    logger.info(`✅ Email sent to ${email}`)
  } catch (err) {
    logger.error(`❌ Email send failed — use OTP from terminal above`, err)
    // Don't throw — OTP is still usable from terminal
  }
}

// CHANGED: Task 3 + Task 4 — Generic email sender for notifications
export async function sendGenericEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  logger.info(`[EMAIL] To: ${to} | Subject: ${subject}`)

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER === '') {
    logger.warn('📭 SMTP not configured — email suppressed')
    return
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    await transporter.sendMail({
      from: `"GSTPro" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:24px;">${htmlBody}</body></html>`,
    })
    logger.info(`✅ Generic email sent to ${to}`)
  } catch (err) {
    logger.error(`❌ Generic email send failed to ${to}:`, err)
  }
}

