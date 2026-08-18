import { useState } from 'react'
import { Button, EmptyState, ErrorBanner, FormField, Input, Table } from '@shared/ui'
import type { Case, CaseFilters } from '@shared/types/domain'
import { DEFAULT_PAGE_SIZE } from '../domain/caseFilters'
import { useListCases } from '../application/useCases'

export interface CasesListScreenProps {
  onSelectCase?: (id: string) => void
}

export function CasesListScreen({ onSelectCase }: CasesListScreenProps) {
  const [filters, setFilters] = useState<CaseFilters>({ limit: DEFAULT_PAGE_SIZE, offset: 0 })
  const { data, isLoading, isError } = useListCases(filters)

  function updateFilter<K extends keyof CaseFilters>(key: K, value: CaseFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value, offset: 0 }))
  }

  return (
    <div>
      <form aria-label="Case filters" onSubmit={(e) => e.preventDefault()}>
        <FormField label="Status" htmlFor="status-filter">
          <Input
            id="status-filter"
            value={filters.status ?? ''}
            onChange={(e) => updateFilter('status', e.target.value || undefined)}
          />
        </FormField>
        <FormField label="Priority" htmlFor="priority-filter">
          <Input
            id="priority-filter"
            value={filters.priority ?? ''}
            onChange={(e) => updateFilter('priority', (e.target.value || undefined) as CaseFilters['priority'])}
          />
        </FormField>
        <FormField label="Assigned to" htmlFor="assignedTo-filter">
          <Input
            id="assignedTo-filter"
            value={filters.assignedTo ?? ''}
            onChange={(e) => updateFilter('assignedTo', e.target.value || undefined)}
          />
        </FormField>
      </form>

      {isLoading ? <p>Loading…</p> : null}
      {isError ? <ErrorBanner message="Failed to load cases" /> : null}

      {data && data.items.length === 0 ? (
        <EmptyState title="No cases match these filters" />
      ) : null}

      {data && data.items.length > 0 ? (
        <>
          <Table<Case>
            rowKey={(c) => c.id}
            rows={data.items}
            columns={[
              {
                key: 'id',
                header: 'Case',
                render: (c) => (
                  <button onClick={() => onSelectCase?.(c.id)} aria-label={`View case ${c.id}`}>
                    {c.id}
                  </button>
                ),
              },
              { key: 'status', header: 'Status', render: (c) => c.status },
              { key: 'priority', header: 'Priority', render: (c) => c.priority ?? '—' },
              { key: 'riskScore', header: 'Score', render: (c) => c.riskScore ?? '—' },
            ]}
          />
          <p data-testid="cases-total">Total: {data.total}</p>
          <Button
            variant="secondary"
            disabled={(filters.offset ?? 0) === 0}
            onClick={() =>
              setFilters((f) => ({ ...f, offset: Math.max(0, (f.offset ?? 0) - (f.limit ?? DEFAULT_PAGE_SIZE)) }))
            }
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            disabled={(filters.offset ?? 0) + (filters.limit ?? DEFAULT_PAGE_SIZE) >= data.total}
            onClick={() =>
              setFilters((f) => ({ ...f, offset: (f.offset ?? 0) + (f.limit ?? DEFAULT_PAGE_SIZE) }))
            }
          >
            Next
          </Button>
        </>
      ) : null}
    </div>
  )
}
