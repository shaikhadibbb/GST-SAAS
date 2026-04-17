-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN "hash" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "previousHash" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_hash_idx" ON "AuditLog"("hash");
