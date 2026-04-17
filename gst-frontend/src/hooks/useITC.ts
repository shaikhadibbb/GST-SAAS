import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import { toast } from 'sonner'

interface ITCReport {
  period: { month: number; year: number }
  summary: {
    totalITCAtRisk: string
    totalTaxableAtRisk: string
    unmatchedEntries: number
    riskySuppliersCount: number
    potentialSaving: string
  }
  riskySuppliers: Array<{
    gstin: string
    invoiceCount: number
    totalTaxableValue: number
    itcAtRisk: number
    invoices: Array<{ invoiceNumber: string; date: Date; taxable: number; tax: number }>
  }>
  unmatchedEntries: Array<{
    id: string
    supplierGSTIN: string
    invoiceNumber: string
    invoiceDate: Date
    taxableValue: string
    itcAtRisk: string
  }>
}

export function useITCReport(month?: number, year?: number) {
  return useQuery<ITCReport>({
    queryKey: ['itc-report', month, year],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (month) params.set('month', String(month))
      if (year) params.set('year', String(year))
      const res = await api.get(`/itc/protection-report?${params}`)
      return res.data.data
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
  })
}

export function useRemindVendor() {
  return useMutation({
    mutationFn: async (payload: {
      supplierGSTIN: string
      supplierEmail: string
      invoiceNumbers: string[]
      itcAtRisk: number
    }) => {
      const res = await api.post('/itc/remind-vendor', payload)
      return res.data
    },
    onSuccess: (_, vars) => {
      toast.success(`Reminder sent to vendor ${vars.supplierGSTIN}`)
    },
    onError: () => {
      toast.error('Failed to send vendor reminder')
    },
  })
}
