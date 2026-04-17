import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { DashboardStats } from '@/types'

export function useDashboard(month?: number, year?: number) {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard', month, year],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (month) params.set('month', String(month))
      if (year) params.set('year', String(year))
      const res = await api.get(`/dashboard/stats?${params}`)
      return res.data.data
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })
}
