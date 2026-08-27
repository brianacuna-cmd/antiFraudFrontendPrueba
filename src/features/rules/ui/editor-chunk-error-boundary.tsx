import { Component, type ReactNode } from 'react'
import { ErrorBanner } from '@shared/ui'

export interface EditorChunkErrorBoundaryProps {
  children: ReactNode
  onRetry: () => void
}

/**
 * React.lazy caches a rejected import() forever. After a Vite restart the
 * JdmEditor chunk 404s once, the edit screen unmounts (no boundary), and
 * every later visit stays blank. Catch the failure and let the parent
 * create a new lazy() factory.
 */
export class EditorChunkErrorBoundary extends Component<
  EditorChunkErrorBoundaryProps,
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div>
          <ErrorBanner message="The graph editor failed to load." />
          <button
            type="button"
            className="af-button"
            onClick={() => {
              this.setState({ failed: false })
              this.props.onRetry()
            }}
          >
            Reload editor
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
