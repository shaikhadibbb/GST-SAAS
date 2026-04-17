import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'

export function usePartnerStatus() {
  return useQuery({
    queryKey: ['partner', 'status'],
    queryFn: async () => {
      const { data } = await api.get('/v1/partners/status')
      return data.data
    },
    retry: false // If it fails with 404, it means they are not a partner
  })
}

export function usePartnerApply() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { firmName: string; firmGstin?: string; firmWebsite?: string }) => {
      const { data } = await api.post('/v1/partners/apply', payload)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner'] })
    }
  })
}

export function usePartnerDashboard() {
  return useQuery({
    queryKey: ['partner', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/v1/partners/dashboard')
      return data.data
    }
  })
}

export function usePartnerClients(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['partner', 'clients', params],
    queryFn: async () => {
      const { data } = await api.get('/v1/partners/clients', { params })
      return data
    }
  })
}

export function usePartnerInviteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { email: string; companyName?: string; message?: string }) => {
      const { data } = await api.post('/v1/partners/clients/invite', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'clients'] })
    }
  })
}
