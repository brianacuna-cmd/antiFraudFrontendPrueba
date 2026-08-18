import { Component, type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EditorChunkErrorBoundary } from './editor-chunk-error-boundary'

class Boom extends Component<{ message: string }> {
  render(): ReactNode {
    throw new Error(this.props.message)
  }
}

describe('EditorChunkErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a retry action instead of an empty screen when the lazy editor chunk fails', async () => {
    const onRetry = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <EditorChunkErrorBoundary onRetry={onRetry}>
        <Boom message="Failed to fetch dynamically imported module: /src/features/rules/ui/JdmEditor.tsx" />
      </EditorChunkErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/failed to load/i)
    await userEvent.click(screen.getByRole('button', { name: 'Reload editor' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
