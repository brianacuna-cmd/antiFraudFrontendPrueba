import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Button, ErrorBanner, FormField, Input } from '@shared/ui'
import { JDM_CONTENT_TYPE, type JdmGraph } from '@shared/types/domain'
import { useCreateDraftRule } from '../application/useRules'
import { STARTER_GRAPH } from '../domain/starter-graph'
import { toEditorGraph } from '../domain/ensure-node-positions'
import { parseImportedJdm } from '../domain/parse-imported-jdm'
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
  const [importError, setImportError] = useState<string | null>(null)
  const [canvasNonce, setCanvasNonce] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const createDraft = useCreateDraftRule()

  useEffect(() => {
    saveEditorDraft(draftKey, { name, graph })
  }, [draftKey, name, graph])

  async function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    const result = parseImportedJdm(text)
    if (!result.ok) {
      setImportError(result.error)
      return
    }
    setImportError(null)
    setValidationError(null)
    setGraph(result.graph)
    setCanvasNonce((n) => n + 1)
  }

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
        <div className="af-editor-chrome__actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="af-file-hidden"
            aria-label="Load JDM JSON"
            onChange={handleImportFile}
          />
          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Load JSON
          </Button>
          <Button onClick={handleSubmit} disabled={createDraft.isPending}>
            Save as draft
          </Button>
        </div>
      </div>
      <p className="af-lede">
        Drag nodes from the left palette (Expression, Decision table, Function, Switch). Double-click a
        node to open its editor. Use <strong>Load JSON</strong> for a GoRules JDM file (
        <code>contentType: application/vnd.gorules.decision</code>). The graph must emit an integer{' '}
        <code>riskScore</code>. Use Simulator to preview that expression against a sample event.
      </p>
      <LazyJdmEditor
        key={canvasNonce}
        value={graph as unknown as DecisionGraphType}
        onChange={(value) => setGraph(toJdmGraph(value))}
      />
      {importError ? <ErrorBanner message={importError} /> : null}
      {validationError ? <ErrorBanner message={validationError} /> : null}
      {createDraft.isError ? <ErrorBanner message="Failed to save the rule draft" /> : null}
    </div>
  )
}
