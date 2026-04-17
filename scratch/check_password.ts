import bcrypt from 'bcryptjs'

const password = '@Adib456'
const hash = '$2a$12$b1297aIDC8RnG1yOlFBeTOZnw6n9362W/5QoIXpjtr4EX.mTEd49C'

async function main() {
  const match = await bcrypt.compare(password, hash)
  console.log('Password match:', match)
}

main().catch(console.error)
