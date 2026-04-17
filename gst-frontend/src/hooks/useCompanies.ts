import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { Company } from '@/types'

export function useCompanies() {
  const queryClient = useQueryClient()

  const list = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await api.get('/companies')
      return res.data.data as Company[]
    }
  })

  const details = (id: string) => useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const res = await api.get(`/companies/${id}`)
      return res.data.data as Company
    },
    enabled: !!id
  })

  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/companies', data)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    }
  })

  const invite = useMutation({
    mutationFn: async ({ id, email, role }: { id: string, email: string, role: string }) => {
      const res = await api.post(`/companies/${id}/invite`, { email, role })
      return res.data.data
    }
  })

  const removeMember = useMutation({
    mutationFn: async ({ id, userId }: { id: string, userId: string }) => {
      const res = await api.delete(`/companies/${id}/members/${userId}`)
      return res.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] })
    }
  })

  return { list, details, create, invite, removeMember }
}
