import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { OnboardingProgress } from '@/types'

export function useOnboarding() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['onboarding-progress'],
    queryFn: async () => {
      const res = await api.get('/onboarding/progress')
      return res.data.data as OnboardingProgress
    },
    refetchInterval: 10000, // Auto-detect updates every 10s
  })

  const completeStep = useMutation({
    mutationFn: async (stepId: string) => {
      const res = await api.post('/onboarding/complete-step', { stepId })
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] })
    }
  })

  return { ...query, completeStep }
}
