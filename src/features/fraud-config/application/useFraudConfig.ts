import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NotFoundError } from '@shared/http/errors'
import type { FraudConfig } from '@shared/types/domain'
import { getFraudConfig, putFraudConfig } from '../infrastructure/fraudConfigApi'

const FRAUD_CONFIG_KEY = ['fraud-config'] as const

export function useLoadFraudConfig() {
  return useQuery<FraudConfig | null, Error>({
    queryKey: FRAUD_CONFIG_KEY,
    queryFn: async () => {
      try {
        return await getFraudConfig()
      } catch (err) {
        if (err instanceof NotFoundError) return null
        throw err
      }
    },
  })
}

export function useSaveFraudConfig() {
  const queryClient = useQueryClient()
  return useMutation<FraudConfig, Error, FraudConfig>({
    mutationFn: (config) => putFraudConfig(config),
    onSuccess: (data) => {
      queryClient.setQueryData(FRAUD_CONFIG_KEY, data)
    },
  })
}
