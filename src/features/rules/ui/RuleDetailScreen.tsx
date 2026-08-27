import { Button, ErrorBanner } from '@shared/ui'
import { useActivateRule, useRuleDetail } from '../application/useRules'
import type { DecisionGraphType } from '@gorules/jdm-editor'
import { LazyJdmEditor } from './LazyJdmEditor'

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
    <div className="af-editor-chrome">
      <div className="af-editor-chrome__bar">
        <div>
          <h2>{rule.name}</h2>
          <p>
            Status: <strong>{rule.status}</strong>
          </p>
        </div>
        <div>
          {rule.status === 'INACTIVE' ? (
            <Button onClick={() => activate.mutate(rule.id)} disabled={activate.isPending}>
              Activate
            </Button>
          ) : null}
          {/* No update endpoint exists — editing always creates a new draft rule. */}
          <Button variant="secondary" onClick={() => onEdit?.(rule.id)}>
            Edit (creates new draft)
          </Button>
        </div>
      </div>
      <LazyJdmEditor value={rule.conditions as unknown as DecisionGraphType} disabled />
      {activate.isError ? <ErrorBanner message="Failed to activate rule" /> : null}
    </div>
  )
}
