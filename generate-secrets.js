#!/usr/bin/env node
/**
 * GSTPro Secret Generator
 * Run: node generate-secrets.js
 * Copy the output to your .env file
 */
const { randomBytes } = require('crypto')

const jwtSecret = randomBytes(64).toString('hex')
const jwtRefreshSecret = randomBytes(64).toString('hex')

console.log('\n🔐 GSTPro — Generated Secrets\n')
console.log('Copy these to your .env file:\n')
console.log(`JWT_SECRET=${jwtSecret}`)
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`)
console.log('\n⚠️  Keep these secrets private. Never commit them to git.')
console.log('⚠️  Use different secrets for production and development.')
console.log('⚠️  Rotating secrets will invalidate all existing sessions.\n')
