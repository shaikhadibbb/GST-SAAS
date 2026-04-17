import { prisma } from './prisma'
import { logger } from './logger'
// Use SMTP_USER / SMTP_PASS from process.env

export async function sendWeeklyComplianceEmail(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    })
    
    if (!user || !user.companyId) {
      logger.warn(`User ${userId} not found or has no company for weekly email.`)
      return
    }

    const companyId = user.companyId
    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Fetch metrics
    const [invoiceCount, itcAtRisk, unmatchedCount] = await Promise.all([
      prisma.invoice.count({ where: { gstinReg: { companyId }, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.gSTR2AEntry.aggregate({
         where: { companyId, matched: false },
         _sum: { igst: true, cgst: true, sgst: true }
      }),
      prisma.gSTR2AEntry.count({ where: { companyId, matched: false } })
    ])

    const totalItcAtRisk = Number(itcAtRisk._sum.igst || 0) + Number(itcAtRisk._sum.cgst || 0) + Number(itcAtRisk._sum.sgst || 0)
    
    // GSTR-1 Deadline logic (approximate)
    const deadline = new Date(now.getFullYear(), now.getMonth(), 11) // 11th of every month
    if (now > deadline) deadline.setMonth(deadline.getMonth() + 1)
    const daysToDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const emailHtml = `
      <!DOCTYPE html><html><body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <div style="background: #4f46e5; padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: -0.02em;">Weekly Compliance Snapshot</h1>
            <p style="color: rgba(255,255,255,0.8); margin-top: 8px; font-size: 14px;">${user.company?.name}</p>
          </div>
          <div style="padding: 40px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
               <div style="background: #fef2f2; padding: 20px; border-radius: 16px; border: 1px solid #fecaca; text-align: center;">
                  <p style="color: #991b1b; font-size: 11px; font-weight: 800; text-transform: uppercase; margin: 0;">ITC at Risk</p>
                  <p style="color: #dc2626; font-size: 24px; font-weight: 800; margin: 5px 0 0;">₹${totalItcAtRisk.toLocaleString()}</p>
               </div>
               <div style="background: #f0fdf4; padding: 20px; border-radius: 16px; border: 1px solid #bbf7d0; text-align: center;">
                  <p style="color: #166534; font-size: 11px; font-weight: 800; text-transform: uppercase; margin: 0;">Invoices (30d)</p>
                  <p style="color: #15803d; font-size: 24px; font-weight: 800; margin: 5px 0 0;">${invoiceCount}</p>
               </div>
            </div>

            <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 15px; font-size: 14px; color: #1e293b;">Next Filing Deadline</h3>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                 <span style="background: #4f46e5; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">GSTR-1</span>
                 <span style="font-weight: 800; color: #1e293b;">${daysToDeadline} Days Left</span>
              </div>
            </div>

            <div style="margin-bottom: 30px;">
               <h3 style="font-size: 14px; color: #1e293b; margin-bottom: 12px;">Action Required</h3>
               <ul style="padding: 0; margin: 0; list-style: none;">
                  <li style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">• Reconcile ${unmatchedCount} unmatched vendor entries</li>
                  <li style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">• Verify HSN codes for ${invoiceCount} new invoices</li>
               </ul>
            </div>

            <a href="https://gstpro.ai/dashboard" style="display: block; width: 100%; padding: 16px; background: #4f46e5; color: white; text-align: center; border-radius: 12px; font-weight: bold; text-decoration: none;">View Dashboard</a>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
             © 2026 GSTPro Technologies. Sent to ${user.email} in compliance with your notification preferences.
          </div>
        </div>
      </body></html>
    `

    // Mock send
    if (process.env.SMTP_USER) {
       const nodemailer = await import('nodemailer')
       const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
       })
       await transporter.sendMail({
          from: `"GSTPro Alerts" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: `Weekly Compliance Status: ₹${totalItcAtRisk.toLocaleString()} ITC at Risk`,
          html: emailHtml
       })
       logger.info(`Weekly email sent to ${user.email}`)
    } else {
       console.log('--- WEEKLY COMPLIANCE EMAIL (MOCK) ---')
       console.log(`To: ${user.email}`)
       console.log(`ITC at Risk: ₹${totalItcAtRisk}`)
       console.log('---------------------------------------')
    }

  } catch (err) {
    logger.error('Failed to send weekly compliance email:', err)
  }
}
