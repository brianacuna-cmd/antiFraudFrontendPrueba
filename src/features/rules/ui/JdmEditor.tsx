import { Component, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from 'react'
import {
  DecisionGraph,
  GraphSimulator,
  JdmConfigProvider,
  type DecisionGraphType,
  type Simulation,
} from '@gorules/jdm-editor'
import { evaluateExpression, evaluateUnaryExpression } from '@gorules/zen-engine-wasm'
import { initZenWasmOnce } from '@shared/jdm/init-zen-wasm'
import { SAMPLE_SIMULATION_CONTEXT } from '../domain/starter-graph'
import { toEditorGraph } from '../domain/ensure-node-positions'
import { runJdmSimulation } from '../domain/run-jdm-simulation'
import { runZenFunction } from '../domain/run-zen-function'
import { isRecoverableGraphError } from './is-recoverable-graph-error'
import type { JdmGraph } from '@shared/types/domain'

export interface JdmEditorProps {
  value: DecisionGraphType
  onChange?: (value: DecisionGraphType) => void
  disabled?: boolean
}

function usePrefersDark(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }, [])
}

class GraphErrorBoundary extends Component<
  { children: ReactNode; resetKey: number; onRetry: () => void },
  { failed: boolean; recoverKey: number }
> {
  state = { failed: false, recoverKey: 0 }

  static getDerivedStateFromError(error: Error): { failed: boolean } {
    return { failed: !isRecoverableGraphError(error) }
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    if (isRecoverableGraphError(error)) {
      this.setState((s) => ({ failed: false, recoverKey: s.recoverKey + 1 }))
    }
  }

  componentDidUpdate(prevProps: { resetKey: number }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false })
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <div>
          <p className="af-lede">The graph editor hit a rendering error.</p>
          <button type="button" className="af-button" onClick={this.props.onRetry}>
            Reload canvas
          </button>
        </div>
      )
    }
    return (
      <div className="af-jdm__canvas" key={`${this.props.resetKey}-${this.state.recoverKey}`}>
        {this.props.children}
      </div>
    )
  }
}

function SimulatorPanel({
  onSimulation,
}: {
  onSimulation: (simulation: Simulation | undefined) => void
}) {
  const [loading, setLoading] = useState(false)
  return (
    <GraphSimulator
      loading={loading}
      defaultRequest={SAMPLE_SIMULATION_CONTEXT}
      onClear={() => onSimulation(undefined)}
      onRun={async ({ graph, context }) => {
        // Must be async: GraphSimulator wraps onRun in the same try/catch as
        // JSON5 parse, so a sync throw is shown as "Invalid format".
        setLoading(true)
        try {
          await initZenWasmOnce()
          onSimulation(
            runJdmSimulation(graph, context, evaluateExpression, evaluateUnaryExpression, runZenFunction),
          )
        } catch (err) {
          onSimulation({
            error: {
              title: 'Simulation failed',
              message: err instanceof Error ? err.message : 'Unknown error',
              data: {},
            },
          })
        } finally {
          setLoading(false)
        }
      }}
    />
  )
}

function toDecisionGraph(graph: JdmGraph): DecisionGraphType {
  return { nodes: graph.nodes, edges: graph.edges } as unknown as DecisionGraphType
}

export function JdmEditor({ value, onChange, disabled = false }: JdmEditorProps) {
  const dark = usePrefersDark()
  const [simulation, setSimulation] = useState<Simulation | undefined>()
  const [canvasKey, setCanvasKey] = useState(0)
  const defaultGraph = useRef(toDecisionGraph(toEditorGraph(value as unknown as JdmGraph))).current
  const theme = useMemo(() => ({ mode: (dark ? 'dark' : 'light') as 'dark' | 'light' }), [dark])
  const panels = useMemo(
    () =>
      disabled
        ? undefined
        : [
            {
              id: 'simulator',
              title: 'Simulator',
              icon: <span aria-hidden="true">▶</span>,
              renderPanel: () => <SimulatorPanel onSimulation={setSimulation} />,
            },
          ],
    [disabled],
  )

  return (
    <div className="af-jdm">
      <GraphErrorBoundary resetKey={canvasKey} onRetry={() => setCanvasKey((k) => k + 1)}>
        <JdmConfigProvider theme={theme}>
          <DecisionGraph
            key={canvasKey}
            defaultValue={defaultGraph}
            onChange={
              onChange
                ? (next) => onChange(toDecisionGraph(toEditorGraph(next as unknown as JdmGraph)))
                : undefined
            }
            disabled={disabled}
            hideLeftToolbar={false}
            mode="dev"
            simulate={simulation}
            panels={panels}
          />
        </JdmConfigProvider>
      </GraphErrorBoundary>
    </div>
  )
}
