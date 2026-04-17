import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'
import { HSN_RATES } from './taxCalculator'
import { logger } from './logger'

Handlebars.registerHelper('formatCurrency', (value: unknown) => {
  const num = Number(value || 0)
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convert(n: number): string {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '')
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '')
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '')
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '')
  }

  const intPart = Math.floor(num)
  const decPart = Math.round((num - intPart) * 100)
  let result = convert(intPart) + ' Rupees'
  if (decPart > 0) result += ' and ' + convert(decPart) + ' Paise'
  return result + ' Only'
}

interface InvoiceData {
  invoiceNumber: string
  invoiceDate: Date | string
  customerName: string
  customerGSTIN?: string | null
  placeOfSupply: string
  hsnCode?: string | null
  invoiceType?: string
  taxableValue: number | string
  cgst: number | string
  sgst: number | string
  igst: number | string
  totalTax: number | string
  totalAmount: number | string
  irn?: string | null
  ackNo?: string | null
}

interface CompanyData {
  name: string
  gstin: string
  pan: string
  stateCode: string
}

export async function generateInvoicePDF(invoiceData: InvoiceData, companyData: CompanyData): Promise<Buffer> {
  const templatePath = path.join(__dirname, '../templates/invoice.html')
  const templateHtml = fs.readFileSync(templatePath, 'utf-8')
  const template = Handlebars.compile(templateHtml)

  const isInterState = invoiceData.placeOfSupply !== companyData.stateCode
  const hsnInfo = invoiceData.hsnCode ? HSN_RATES[invoiceData.hsnCode] : null
  const rates = hsnInfo
    ? { igst: hsnInfo.igst, cgst: hsnInfo.cgst, sgst: hsnInfo.sgst }
    : { igst: 18, cgst: 9, sgst: 9 }

  const html = template({
    invoiceNumber: invoiceData.invoiceNumber,
    invoiceDate: new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    customerName: invoiceData.customerName,
    customerGSTIN: invoiceData.customerGSTIN,
    placeOfSupply: invoiceData.placeOfSupply,
    hsnCode: invoiceData.hsnCode || 'N/A',
    hsnDescription: hsnInfo ? (hsnInfo as { igst: number; cgst: number; sgst: number; description: string }).description : 'Services',
    invoiceType: invoiceData.invoiceType || 'B2B',
    isInterState,
    taxableValue: invoiceData.taxableValue,
    cgst: invoiceData.cgst,
    sgst: invoiceData.sgst,
    igst: invoiceData.igst,
    totalTax: invoiceData.totalTax,
    totalAmount: invoiceData.totalAmount,
    irn: invoiceData.irn,
    ackNo: invoiceData.ackNo,
    cgstRate: rates.cgst,
    sgstRate: rates.sgst,
    igstRate: rates.igst,
    amountInWords: numberToWords(Number(invoiceData.totalAmount)),
    company: companyData,
    generatedAt: new Date().toLocaleString('en-IN'),
  })

  let browser: { newPage: () => Promise<any>; close: () => Promise<void> } | null = null

  try {
    try {
      // Try puppeteer-core + @sparticuz/chromium (production/Lambda)
      const chromium = await import('@sparticuz/chromium').then(m => m.default ?? m)
      const puppeteer = await import('puppeteer-core').then(m => m.default ?? m)
      browser = await (puppeteer as any).launch({
        args: chromium.args as string[],
        // ✅ FIXED: cast defaultViewport to avoid type mismatch
        defaultViewport: (chromium as any).defaultViewport as { width: number; height: number } | null,
        executablePath: await chromium.executablePath(),
        headless: true,
      })
    } catch {
      // Fallback: regular puppeteer (local dev)
      const puppeteer = await import('puppeteer').then(m => m.default ?? m)
      browser = await (puppeteer as any).launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      })
    }

    const page = await browser!.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 10000 })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      timeout: 15000,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    })

    return Buffer.from(pdfBuffer)
  } finally {
    if (browser) {
      try { await browser.close() }
      catch (e) { logger.warn('Browser close failed:', e) }
    }
  }
}
