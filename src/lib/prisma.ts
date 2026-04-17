import { PrismaClient } from '@prisma/client'

// Main App Client - Optimized for low latency, high concurrency web requests
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'connection_limit=20'
    }
  }
})

// Sync Client - Optimized for high-throughput background jobs (GSTN Sync, BullMQ)
// Suggestion: Point this to a PgBouncer pool in transaction mode
export const syncPrisma = new PrismaClient({
  datasources: {
    db: {
      url: (process.env.SYNC_DATABASE_URL || process.env.DATABASE_URL) + 
           ((process.env.SYNC_DATABASE_URL || process.env.DATABASE_URL)?.includes('?') ? '&' : '?') + 
           'connection_limit=50'
    }
  }
})

// Read Replica Client - If configured, for analytics and heavy dashboard queries
export const readPrisma = new PrismaClient({
  datasources: {
    db: {
      url: (process.env.READ_REPLICA_URL || process.env.DATABASE_URL) + 
           ((process.env.READ_REPLICA_URL || process.env.DATABASE_URL)?.includes('?') ? '&' : '?') + 
           'connection_limit=30'
    }
  }
})

export default prisma
