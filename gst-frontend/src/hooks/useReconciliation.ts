import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/services/api'
import { GSTR2AEntry, GSTINRegistration } from '@/types'

export function useGstinRegs() {
  return useQuery<GSTINRegistration[]>({
    queryKey: ['gstin-regs'],
    queryFn: async () => {
      const res = await api.get('/auth/gstin-regs')
      return res.data.data
    },
    refetchInterval: (query) => {
      // Poll if any registration is syncing
      const regs = query.state.data
      const isSyncing = regs?.some(r => r.syncStatus === 'SYNCING')
      return isSyncing ? 5000 : false
    }
  })
}

export function useGSTR2AEntries(matched?: boolean) {
  return useQuery<GSTR2AEntry[]>({
    queryKey: ['gstr2a', matched],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' })
      if (matched !== undefined) params.set('matched', String(matched))
      const res = await api.get(`/gstr2a/entries?${params}`)
      return res.data.data
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  })
}

export function useUploadGSTR2A() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/gstr2a/upload', payload)
      return res.data
    },
    onSuccess: async (data) => {
      const count = data.data?.imported || 0
      if (count > 0) {
        toast.success(`GSTR-2A uploaded: ${count} entries imported ✅`)
      } else {
        toast.warning('File uploaded but no entries found. Check JSON format has b2b array.')
      }
      await qc.invalidateQueries({ queryKey: ['gstr2a'] })
      await qc.refetchQueries({ queryKey: ['gstr2a'], type: 'all' })
    },
    onError: (err: any) => {
      toast.error(`Upload failed: ${err?.response?.data?.message || err.message}`)
    },
  })
}

export function useRunReconciliation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/reconciliation/match', payload)
      return res.data.data
    },
    onSuccess: async (data) => {
      const matched = data?.summary?.matched || 0
      const unmatched = (data?.summary?.missingInBooks || 0) + (data?.summary?.missingIn2A || 0)
      toast.success(`Reconciliation done: ${matched} matched, ${unmatched} unmatched`)
      await qc.invalidateQueries({ queryKey: ['gstr2a'] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
      await qc.refetchQueries({ queryKey: ['gstr2a'], type: 'all' })
    },
    onError: (err: any) => {
      toast.error(`Reconciliation failed: ${err?.response?.data?.message || err.message}`)
    },
  })
}

export function useSyncGSTR2A() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { gstin: string; period: string }) => {
      const res = await api.post('/gstr2a/sync', payload)
      return res.data
    },
    onSuccess: () => {
      toast.success('Sync job queued successfully 🔄')
      qc.invalidateQueries({ queryKey: ['gstr2a'] })
      // auth/gstin-regs uses gstin-regs query key elsewhere or just auth?
      // Actually, I don't see a hook for gstin-regs, I'll just invalidate all for now
      qc.invalidateQueries()
    },
    onError: (err: any) => {
      toast.error(`Sync failed: ${err?.response?.data?.message || err.message}`)
    },
  })
}
