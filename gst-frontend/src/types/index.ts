export enum Role { ADMIN='ADMIN', COMPLIANCE_OFFICER='COMPLIANCE_OFFICER', CA='CA', ACCOUNTANT='ACCOUNTANT', VIEWER='VIEWER', CA_PARTNER='CA_PARTNER' }
export enum InvoiceStatus { 
  DRAFT='DRAFT', 
  GENERATED='GENERATED', 
  IRN_GENERATED='IRN_GENERATED', 
  GSTR1_FILED='GSTR1_FILED', 
  RECONCILED='RECONCILED', 
  CANCELLED='CANCELLED' 
}

export enum MemberRole { ADMIN='ADMIN', CA='CA', ACCOUNTANT='ACCOUNTANT', VIEWER='VIEWER', DATA_ENTRY='DATA_ENTRY' }
export interface Company { 
  id: string; name: string; gstin: string; pan?: string; stateCode?: string;
  subscriptionPlan?: 'BASIC' | 'PRO' | 'ENTERPRISE';
  status?: 'ACTIVE' | 'SUSPENDED';
  userRole?: MemberRole;
  members?: CompanyMember[];
}
export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  user?: { email: string };
  role: MemberRole;
  status: 'ACTIVE' | 'PENDING';
  joinedAt?: string;
}
export interface Invitation {
  id: string;
  email: string;
  role: MemberRole;
  token: string;
  accepted: boolean;
  expiresAt: string;
}
export interface Subscription { id: string; plan: string; status: string; currentPeriodEnd: string }
export interface User { 
  id: string; email: string; role: Role; companyId: string; company: Company;
  companies?: Company[];
  subscription?: Subscription | null;
  setupProgress?: {
    percentage: number;
    stepsCompleted: number;
    totalSteps: number;
    steps: Array<{ id: string; label: string; completed: boolean }>;
  };
}
export interface GSTINRegistration { 
  id: string; 
  gstin: string; 
  state: string; 
  companyId: string;
  syncStatus: 'IDLE' | 'SYNCING' | 'ERROR';
  syncError?: string;
  lastSyncAt?: string;
}
export interface OnboardingProgress {
  steps: Record<string, boolean>;
  completedCount: number;
  totalSteps: number;
  percentage: number;
  completedAt?: string;
  isCompleted: boolean;
}
export interface Invoice {
  id: string; invoiceNumber: string; invoiceDate: string; customerGSTIN?: string
  customerName: string; placeOfSupply: string; totalAmount: string; taxableValue: string
  cgst: string; sgst: string; igst: string; totalTax: string; irn?: string
  status: InvoiceStatus; gstinRegId: string; hsnCode?: string; pdfUrl?: string; createdAt: string; updatedAt: string
  deletedAt?: string | null
  gstinReg?: GSTINRegistration
}
export interface ConsentLog { id: string; userId: string; purpose: string; granted: boolean; ipAddress?: string; version: string; createdAt: string }
export interface ClientConfig { id: string; companyId: string; dateToleranceDays: number; updatedAt: string }
export interface GSTR2AEntry {
  id: string; gstin: string; invoiceNumber: string; invoiceDate: string
  taxableValue: string; igst: string; cgst: string; sgst: string
  matched: boolean; invoiceId?: string; supplierGSTIN?: string; companyId: string
}
export interface DashboardStats {
  period: { month: number; year: number }
  monthly: { invoiceCount: number; taxableValue: string; totalAmount: string; taxLiability: { cgst: string; sgst: string; igst: string; totalTax: string }; byStatus: Record<string,number> }
  yearly: { invoiceCount: number; totalAmount: string; totalTax: string }
  reconciliation: { total2AEntries: number; matched: number; unmatched: number; matchRate: string }
  gstinRegistrations: number
  filingStatus: { gstr1Due: string; gstr3bDue: string; period: string }
  trend: Array<{ month: string; tax: number; taxable: number }>
  health: { score: number; status: 'excellent'|'good'|'at-risk'|'critical'; reasons: string[]; color: 'green'|'amber'|'red' }
}
export interface PaginatedResponse<T> {
  success: boolean; data: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean }
}
