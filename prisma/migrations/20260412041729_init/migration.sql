-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CA', 'ACCOUNTANT', 'VIEWER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'GENERATED', 'IRN_GENERATED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ACCOUNTANT',
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "pan" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GSTINRegistration" (
    "id" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GSTINRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "customerGSTIN" TEXT,
    "customerName" TEXT NOT NULL,
    "placeOfSupply" TEXT NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "taxableValue" DECIMAL(15,2) NOT NULL,
    "cgst" DECIMAL(15,2) NOT NULL,
    "sgst" DECIMAL(15,2) NOT NULL,
    "igst" DECIMAL(15,2) NOT NULL,
    "totalTax" DECIMAL(15,2) NOT NULL,
    "irn" TEXT,
    "qrCode" TEXT,
    "ackNo" TEXT,
    "ackDate" TIMESTAMP(3),
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "gstinRegId" TEXT NOT NULL,
    "hsnCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GSTR2AEntry" (
    "id" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "taxableValue" DECIMAL(15,2) NOT NULL,
    "igst" DECIMAL(15,2) NOT NULL,
    "cgst" DECIMAL(15,2) NOT NULL,
    "sgst" DECIMAL(15,2) NOT NULL,
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "invoiceId" TEXT,
    "supplierGSTIN" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GSTR2AEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_gstin_key" ON "Company"("gstin");

-- CreateIndex
CREATE INDEX "GSTINRegistration_companyId_idx" ON "GSTINRegistration"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "GSTINRegistration_gstin_companyId_key" ON "GSTINRegistration"("gstin", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_irn_key" ON "Invoice"("irn");

-- CreateIndex
CREATE INDEX "Invoice_gstinRegId_idx" ON "Invoice"("gstinRegId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_invoiceDate_idx" ON "Invoice"("invoiceDate");

-- CreateIndex
CREATE INDEX "GSTR2AEntry_gstin_idx" ON "GSTR2AEntry"("gstin");

-- CreateIndex
CREATE INDEX "GSTR2AEntry_companyId_idx" ON "GSTR2AEntry"("companyId");

-- CreateIndex
CREATE INDEX "GSTR2AEntry_matched_idx" ON "GSTR2AEntry"("matched");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GSTINRegistration" ADD CONSTRAINT "GSTINRegistration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_gstinRegId_fkey" FOREIGN KEY ("gstinRegId") REFERENCES "GSTINRegistration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
