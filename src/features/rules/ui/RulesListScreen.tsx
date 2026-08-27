import { Button, EmptyState, ErrorBanner, Table } from '@shared/ui'
import type { Rule } from '@shared/types/domain'
import { useListRules } from '../application/useRules'

export interface RulesListScreenProps {
  onSelectRule?: (id: string) => void
  onCreate?: () => void
}

export function RulesListScreen({ onSelectRule, onCreate }: RulesListScreenProps) {
  const { data, isLoading, isError } = useListRules()

  if (isLoading) return <p>Loading…</p>
  if (isError) return <ErrorBanner message="Failed to load rules" />
  if (!data || data.items.length === 0) {
    return (
      <div>
        <EmptyState
          title="No rules yet"
          description="Create a rule draft to get started. New rules open with a Request → Score → Response template that already emits riskScore."
        />
        {onCreate ? (
          <Button onClick={onCreate}>New rule</Button>
        ) : null}
      </div>
    )
  }

  return (
    <Table<Rule>
      rowKey={(r) => r.id}
      rows={data.items}
      columns={[
        {
          key: 'name',
          header: 'Name',
          render: (r) => (
            <button onClick={() => onSelectRule?.(r.id)} aria-label={`View ${r.name}`}>
              {r.name}
            </button>
          ),
        },
        { key: 'status', header: 'Status', render: (r) => r.status },
      ]}
    />
  )
}
