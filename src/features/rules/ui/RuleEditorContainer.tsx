import { useEffect, useState } from 'react'
import { Button, ErrorBanner, FormField, Input } from '@shared/ui'
import { JDM_CONTENT_TYPE, type JdmGraph } from '@shared/types/domain'
import { useCreateDraftRule } from '../application/useRules'
import { STARTER_GRAPH } from '../domain/starter-graph'
import { toEditorGraph } from '../domain/ensure-node-positions'
import { validateJdmOutput } from '../domain/validateJdmOutput'
import { clearEditorDraft, loadEditorDraft, saveEditorDraft } from '../domain/editor-draft-storage'
import type { DecisionGraphType } from '@gorules/jdm-editor'
import { LazyJdmEditor } from './LazyJdmEditor'

function toJdmGraph(value: DecisionGraphType): JdmGraph {
  return toEditorGraph({
    contentType: JDM_CONTENT_TYPE,
    nodes: (value.nodes ?? []) as JdmGraph['nodes'],
    edges: (value.edges ?? []) as JdmGraph['edges'],
  })
}

export interface RuleEditorContainerProps {
  initialGraph?: JdmGraph
  /** When provided, the submitted graph is prefilled from an existing rule, but always
   * submitted as a NEW draft rule — there is no update endpoint (spec risk-scoring-rules). */
  initialName?: string
  /** sessionStorage key so an imported graph survives reload. `new` vs `edit:{ruleId}`. */
  draftKey?: string
  onCreated?: (ruleId: string) => void
}

export function RuleEditorContainer({
  initialGraph,
  initialName,
  draftKey = 'new',
  onCreated,
}: RuleEditorContainerProps) {
  const [graph, setGraph] = useState<JdmGraph>(() => {
    const draft = loadEditorDraft(draftKey)
    return toEditorGraph(draft?.graph ?? initialGraph ?? STARTER_GRAPH)
  })
  const [name, setName] = useState(() => loadEditorDraft(draftKey)?.name ?? initialName ?? '')
  const [validationError, setValidationError] = useState<string | null>(null)
  const createDraft = useCreateDraftRule()

  useEffect(() => {
    saveEditorDraft(draftKey, { name, graph })
  }, [draftKey, name, graph])

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
        onSuccess: (rule) => {
          clearEditorDraft(draftKey)
          onCreated?.(rule.id)
        },
      },
    )
  }

  return (
    <div className="af-editor-chrome">
      <div className="af-editor-chrome__bar">
        <FormField label="Rule name" htmlFor="rule-name">
          <Input
            id="rule-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Wallet transfer risk v1"
          />
        </FormField>
        <Button onClick={handleSubmit} disabled={createDraft.isPending}>
          Save as draft
        </Button>
      </div>
      <p className="af-lede">
        Drag nodes from the left palette (Expression, Decision table, Function, Switch). Double-click a
        node to open its editor. The graph must emit an integer <code>riskScore</code>. Use Simulator to
        preview that expression against a sample event.
      </p>
      <LazyJdmEditor
        value={graph as unknown as DecisionGraphType}
        onChange={(value) => setGraph(toJdmGraph(value))}
      />
      {validationError ? <ErrorBanner message={validationError} /> : null}
      {createDraft.isError ? <ErrorBanner message="Failed to save the rule draft" /> : null}
    </div>
  )
}
