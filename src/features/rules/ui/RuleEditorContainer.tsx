import { useState } from 'react'
import { DecisionGraph, JdmConfigProvider } from '@gorules/jdm-editor'
import { Button, ErrorBanner, FormField, Input } from '@shared/ui'
import { JDM_CONTENT_TYPE, type JdmGraph } from '@shared/types/domain'
import { useCreateDraftRule } from '../application/useRules'
import { validateJdmOutput } from '../domain/validateJdmOutput'

const EMPTY_GRAPH: JdmGraph = { contentType: JDM_CONTENT_TYPE, nodes: [], edges: [] }

export interface RuleEditorContainerProps {
  initialGraph?: JdmGraph
  /** When provided, the submitted graph is prefilled from an existing rule, but always
   * submitted as a NEW draft rule — there is no update endpoint (spec risk-scoring-rules). */
  initialName?: string
  onCreated?: (ruleId: string) => void
}

export function RuleEditorContainer({ initialGraph, initialName, onCreated }: RuleEditorContainerProps) {
  const [graph, setGraph] = useState<JdmGraph>(initialGraph ?? EMPTY_GRAPH)
  const [name, setName] = useState(initialName ?? '')
  const [validationError, setValidationError] = useState<string | null>(null)
  const createDraft = useCreateDraftRule()

  function handleSubmit() {
    const result = validateJdmOutput(graph)
    if (!result.valid) {
      setValidationError(result.error ?? 'Invalid rule graph')
      return
    }
    setValidationError(null)
    createDraft.mutate(
      { name, conditions: graph },
      {
        onSuccess: (rule) => onCreated?.(rule.id),
      },
    )
  }

  return (
    <div>
      <FormField label="Rule name" htmlFor="rule-name">
        <Input id="rule-name" value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <JdmConfigProvider>
        <DecisionGraph
          value={graph as unknown as import('@gorules/jdm-editor').DecisionGraphType}
          onChange={(value) => setGraph(value as unknown as JdmGraph)}
        />
      </JdmConfigProvider>
      {validationError ? <ErrorBanner message={validationError} /> : null}
      {createDraft.isError ? <ErrorBanner message="Failed to save the rule draft" /> : null}
      <Button onClick={handleSubmit} disabled={createDraft.isPending}>
        Save as draft
      </Button>
    </div>
  )
}
