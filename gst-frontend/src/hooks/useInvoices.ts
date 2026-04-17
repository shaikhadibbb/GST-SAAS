import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/services/api'
import { Invoice, PaginatedResponse } from '@/types'

interface Filters { page?: number; limit?: number; status?: string }

export function useInvoices(filters: Filters = {}) {
  const { page = 1, limit = 10, status } = filters
  return useQuery<PaginatedResponse<Invoice>>({
    queryKey: ['invoices', page, limit, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (status) params.set('status', status)
      const res = await api.get(`/invoices?${params}`)
      return res.data
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/invoices', payload)
      return res.data.data as Invoice
    },
    onSuccess: async (data) => {
      toast.success(`Invoice ${data.invoiceNumber} created successfully! 🎉`)
      await qc.invalidateQueries({ queryKey: ['invoices'] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
      await qc.refetchQueries({ queryKey: ['invoices'], type: 'all' })
    },
    onError: (err: any) => {
      toast.error(`Failed to create invoice: ${err?.response?.data?.message || err.message}`)
    },
  })
}

export function useDownloadInvoicePDF() {
  const [loading, setLoading] = useState(false)
  const download = async (invoiceId: string, invoiceNumber: string) => {
    setLoading(true)
    try {
      const res = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `Invoice_${invoiceNumber}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success(`PDF downloaded: Invoice_${invoiceNumber}.pdf`)
    } catch (err: any) {
      if (err?.response?.status === 429) toast.error('Too many PDF requests. Max 5 per minute.')
      else toast.error('Failed to generate PDF')
    } finally { setLoading(false) }
  }
  return { download, loading }
}

export function useArchiveInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await api.patch(`/invoices/${invoiceId}/archive`)
      return res.data.data as Invoice
    },
    onSuccess: async () => {
      toast.success('Invoice archived')
      await qc.invalidateQueries({ queryKey: ['invoices'] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to archive invoice')
    },
  })
}

export function useRestoreInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await api.patch(`/invoices/${invoiceId}/restore`)
      return res.data.data as Invoice
    },
    onSuccess: async () => {
      toast.success('Invoice restored')
      await qc.invalidateQueries({ queryKey: ['invoices'] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to restore invoice')
    },
  })
}
