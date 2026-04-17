import { PrismaClient, Role, MemberRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting data migration: User -> CompanyMember')
  
  const users = await prisma.user.findMany({
    where: { companyId: { not: null } }
  })

  console.log(`Found ${users.length} users to migrate.`)

  for (const user of users) {
    if (!user.companyId) continue

    // Map User.role to MemberRole
    let memberRole: MemberRole = MemberRole.VIEWER
    switch (user.role) {
      case Role.ADMIN:
      case Role.COMPLIANCE_OFFICER:
        memberRole = MemberRole.ADMIN
        break
      case Role.CA:
        memberRole = MemberRole.CA
        break
      case Role.ACCOUNTANT:
        memberRole = MemberRole.ACCOUNTANT
        break
      case Role.VIEWER:
        memberRole = MemberRole.VIEWER
        break
      case Role.CA_PARTNER:
        memberRole = MemberRole.ADMIN // CAs acting as partners get Admin in their own firm
        break
    }

    try {
      await prisma.companyMember.upsert({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId: user.companyId
          }
        },
        update: { role: memberRole },
        create: {
          userId: user.id,
          companyId: user.companyId,
          role: memberRole,
          status: 'ACTIVE'
        }
      })
      console.log(`✅ Migrated user ${user.email} to company ${user.companyId} as ${memberRole}`)
    } catch (err) {
      console.error(`❌ Failed to migrate user ${user.email}:`, err)
    }
  }

  console.log('🏁 Migration complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
