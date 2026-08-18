import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Rule } from '@shared/types/domain'
import {
  activateRule,
  createDraftRule,
  getRuleDetail,
  listRules,
  type CreateDraftRuleInput,
} from '../infrastructure/rulesApi'

// NOTE: `['rules', id]` (a prefix-match of `['rules']`) is intentionally
// avoided as the list key, because `invalidateQueries` matches by prefix by
// default — invalidating `['rules']` would also refetch any mounted
// `['rules', id]` detail query and race a stale GET over a fresh
// `setQueryData` write (observed in RuleDetailScreen's activate flow).
const RULES_LIST_KEY = ['rules', 'list'] as const
const ruleKey = (id: string) => ['rules', 'detail', id] as const

export function useListRules() {
  return useQuery<{ items: Rule[] }, Error>({
    queryKey: RULES_LIST_KEY,
    queryFn: listRules,
  })
}

export function useRuleDetail(id: string | undefined) {
  return useQuery<Rule, Error>({
    queryKey: id ? ruleKey(id) : ['rules', 'detail', 'unknown'],
    queryFn: () => getRuleDetail(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateDraftRule() {
  const queryClient = useQueryClient()
  return useMutation<Rule, Error, CreateDraftRuleInput>({
    mutationFn: createDraftRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_LIST_KEY })
    },
  })
}

export function useActivateRule() {
  const queryClient = useQueryClient()
  return useMutation<Rule, Error, string>({
    mutationFn: activateRule,
    onSuccess: (rule) => {
      queryClient.invalidateQueries({ queryKey: RULES_LIST_KEY })
      queryClient.setQueryData(ruleKey(rule.id), rule)
    },
  })
}
