import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { ClientConfig, ConsentLog } from '@/types'
import { toast } from 'sonner'

// ── Task 2: Client Config (date tolerance) ────────────────────────────────────
export function useClientConfig() {
  return useQuery<ClientConfig>({
    queryKey: ['clientConfig'],
    queryFn: async () => {
      const res = await api.get('/admin/client-config')
      return res.data.data as ClientConfig
    },
    retry: 1,
  })
}

export function useUpdateClientConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dateToleranceDays: number) => {
      const res = await api.patch('/admin/client-config', { dateToleranceDays })
      return res.data
    },
    onSuccess: (_, days) => {
      qc.invalidateQueries({ queryKey: ['clientConfig'] })
      toast.success(`Date tolerance updated to ±${days} days`)
    },
    onError: () => toast.error('Failed to update configuration'),
  })
}

// ── Task 5: Consent Logs ──────────────────────────────────────────────────────
export function useMyConsents() {
  return useQuery<ConsentLog[]>({
    queryKey: ['myConsents'],
    queryFn: async () => {
      const res = await api.get('/users/me/consents')
      return res.data.data as ConsentLog[]
    },
  })
}

export function useGrantConsent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ purpose, granted }: { purpose: string; granted: boolean }) => {
      const res = await api.post('/users/me/consent', { purpose, granted })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myConsents'] })
      toast.success('Consent preference saved')
    },
    onError: () => toast.error('Failed to save consent'),
  })
}

// ── Task 5: Data Export ───────────────────────────────────────────────────────
export function useExportUserData() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.get('/users/me/export', { responseType: 'blob' })
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gstpro-data-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    },
    onSuccess: () => toast.success('Data export downloaded'),
    onError: () => toast.error('Export failed. Try again.'),
  })
}

// ── Task 5: Request Deletion ──────────────────────────────────────────────────
export function useRequestDeletion() {
  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const res = await api.post(`/users/${userId}/request-deletion`, { reason })
      return res.data
    },
    onSuccess: () => toast.success('Deletion scheduled. Hard delete in 30 days.'),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to request deletion'),
  })
}
