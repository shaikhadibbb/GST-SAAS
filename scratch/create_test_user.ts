import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'testuser@example.com'
  const password = 'Password@123'
  const hashedPassword = await bcrypt.hash(password, 12)

  // Find or create a company
  const company = await prisma.company.findFirst()
  if (!company) {
    console.error('No company found in database. Please register first.')
    return
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword },
    create: {
      email,
      password: hashedPassword,
      role: 'ADMIN',
      companyId: company.id,
      verified: true
    }
  })

  // Ensure membership exists
  await prisma.companyMember.upsert({
    where: { userId_companyId: { userId: user.id, companyId: company.id } },
    update: {},
    create: {
      userId: user.id,
      companyId: company.id,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  })

  console.log('Test user created/updated:', email)
  console.log('Password:', password)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
