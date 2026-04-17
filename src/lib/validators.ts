import { z } from 'zod';

export const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d[Z]{1}[A-Z\d]{1}$/;
export const PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
export const STATE_CODE_REGEX = /^\d{2}$/;

export const gstinSchema = z.string()
  .length(15, 'GSTIN must be exactly 15 characters')
  .regex(GSTIN_REGEX, 'Invalid GSTIN format');

export const panSchema = z.string()
  .length(10, 'PAN must be exactly 10 characters')
  .regex(PAN_REGEX, 'Invalid PAN format');

export const stateCodeSchema = z.string()
  .length(2, 'State code must be exactly 2 digits')
  .regex(STATE_CODE_REGEX, 'State code must be 2 numeric digits');

export const registerSchema = z.object({
  company: z.object({
    name: z.string().min(2).max(200).trim(),
    gstin: gstinSchema,
    pan: panSchema,
    stateCode: stateCodeSchema,
  }),
  user: z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[0-9]/, 'Password must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
    // CHANGED: Task 3 — added COMPLIANCE_OFFICER to allowed roles
    role: z.enum(['ADMIN', 'COMPLIANCE_OFFICER', 'CA', 'ACCOUNTANT', 'VIEWER']).optional().default('ADMIN'),
  }),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).max(50).trim(),
  invoiceDate: z.string().datetime({ message: 'Invalid date format, use ISO 8601' }),
  customerGSTIN: gstinSchema.optional().nullable(),
  customerName: z.string().min(1).max(200).trim(),
  placeOfSupply: stateCodeSchema,
  taxableValue: z.number().positive('Taxable value must be positive'),
  gstinRegId: z.string().uuid('Invalid GSTIN registration ID'),
  hsnCode: z.string().min(4).max(8).optional(),
});

export const invoiceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'GENERATED', 'IRN_GENERATED', 'CANCELLED']).optional(),
  gstinRegId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const gstr2aEntrySchema = z.object({
  gstin: gstinSchema.optional(),
  ctin: gstinSchema.optional(),
  inv: z.array(z.object({
    inum: z.string(),
    idt: z.string(),
    val: z.number(),
    pos: stateCodeSchema,
    rchrg: z.string().optional(),
    itms: z.array(z.object({
      num: z.number(),
      itm_det: z.object({
        txval: z.number(),
        igst: z.number().optional().default(0),
        cgst: z.number().optional().default(0),
        sgst: z.number().optional().default(0),
      }),
    })),
  })),
});

export const gstr2aUploadSchema = z.object({
  gstin: gstinSchema,
  fp: z.string().regex(/^\d{6}$/, 'fp must be MMYYYY format'),
  b2b: z.array(gstr2aEntrySchema).optional().default([]),
});

export const reconcileMatchSchema = z.object({
  gstinRegId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2017).max(2099),
  tolerance: z.number().min(0).max(100).default(1),
});

// ─── Auth schemas ─────────────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
})

export const resetPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
})

export const verifyEmailSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
})

export const resendOtpSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
})
