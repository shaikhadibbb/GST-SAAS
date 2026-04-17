import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data } = await api.get('/v1/plans')
      return data.data
    }
  })
}

export function useCurrentSubscription() {
  return useQuery({
    queryKey: ['subscription', 'current'],
    queryFn: async () => {
      const { data } = await api.get('/v1/subscriptions/current')
      return data.data
    }
  })
}

export function useSubscriptionUsage() {
  return useQuery({
    queryKey: ['subscription', 'usage'],
    queryFn: async () => {
      const { data } = await api.get('/v1/subscriptions/usage')
      return data.data
    }
  })
}

export function useCreateSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { plan: string; billingCycle: 'MONTHLY' | 'ANNUAL' }) => {
      const { data } = await api.post('/v1/subscriptions/create', payload)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
    }
  })
}

export function useUpgradeSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { plan: string; billingCycle?: 'MONTHLY' | 'ANNUAL' }) => {
      const { data } = await api.post('/v1/subscriptions/upgrade', payload)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
    }
  })
}
