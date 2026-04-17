-- CreateIndex
CREATE INDEX "AuditLog_invoiceId_idx" ON "AuditLog"("invoiceId");

-- CreateIndex
CREATE INDEX "GSTR2AEntry_companyId_gstin_invoiceDate_idx" ON "GSTR2AEntry"("companyId", "gstin", "invoiceDate");

-- CreateIndex
CREATE INDEX "GSTR2AEntry_companyId_matched_idx" ON "GSTR2AEntry"("companyId", "matched");

-- CreateIndex
CREATE INDEX "Invoice_gstinRegId_invoiceNumber_idx" ON "Invoice"("gstinRegId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_gstinRegId_invoiceDate_status_idx" ON "Invoice"("gstinRegId", "invoiceDate", "status");

-- CreateIndex
CREATE INDEX "Invoice_gstinRegId_deletedAt_idx" ON "Invoice"("gstinRegId", "deletedAt");
