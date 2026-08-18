import { DecisionGraph, JdmConfigProvider } from '@gorules/jdm-editor'
import { Button, ErrorBanner } from '@shared/ui'
import { useActivateRule, useRuleDetail } from '../application/useRules'

export interface RuleDetailScreenProps {
  ruleId: string
  onEdit?: (ruleId: string) => void
}

export function RuleDetailScreen({ ruleId, onEdit }: RuleDetailScreenProps) {
  const { data: rule, isLoading, isError } = useRuleDetail(ruleId)
  const activate = useActivateRule()

  if (isLoading) return <p>Loading…</p>
  if (isError || !rule) return <ErrorBanner message="Failed to load rule" />

  return (
    <div>
      <h2>{rule.name}</h2>
      <p>
        Status: <strong>{rule.status}</strong>
      </p>
      <JdmConfigProvider>
        <DecisionGraph
          value={rule.conditions as unknown as import('@gorules/jdm-editor').DecisionGraphType}
          disabled
        />
      </JdmConfigProvider>
      {rule.status === 'INACTIVE' ? (
        <Button onClick={() => activate.mutate(rule.id)} disabled={activate.isPending}>
          Activate
        </Button>
      ) : null}
      {/* No update endpoint exists — editing always creates a new draft rule. */}
      <Button variant="secondary" onClick={() => onEdit?.(rule.id)}>
        Edit (creates new draft)
      </Button>
      {activate.isError ? <ErrorBanner message="Failed to activate rule" /> : null}
    </div>
  )
}
