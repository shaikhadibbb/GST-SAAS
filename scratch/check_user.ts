import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'yashjio778@gmail.com'
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      company: true
    }
  })

  if (user) {
    console.log('User found:', JSON.stringify(user, null, 2))
  } else {
    console.log('User not found')
    
    // List all users to see what's in there
    const allUsers = await prisma.user.findMany({
      take: 5,
      select: { email: true }
    })
    console.log('Recent users:', allUsers)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
