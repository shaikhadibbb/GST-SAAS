import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const company = await prisma.company.findFirst()
  if (!company) {
    console.log('No company found. Please register first.')
    return
  }

  console.log(`Seeding leakage data for company: ${company.name}`)

  // Create some unmatched 2A entries to trigger the "Revenue Leakage" monitor
  const vendors = [
    { gstin: '27AAAAA0000A1Z5', name: 'Alpha Services', amount: 45000 },
    { gstin: '24BBBBB1111B2Z6', name: 'Beta Logistics', amount: 12500 },
    { gstin: '29CCCCC2222C3Z7', name: 'Gamma Infotech', amount: 8400 }
  ]

  for (const v of vendors) {
    await prisma.gSTR2AEntry.create({
      data: {
        gstin: company.gstin, // Our company GSTIN
        supplierGSTIN: v.gstin,
        invoiceNumber: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
        invoiceDate: new Date(),
        taxableValue: v.amount * 5,
        igst: v.amount,
        cgst: 0,
        sgst: 0,
        matched: false, // CRITICAL: This triggers the leakage monitor
        companyId: company.id
      }
    })
  }

  console.log('✅ Seeded 3 "Revenue Leakage" cases. Refresh your dashboard!')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
