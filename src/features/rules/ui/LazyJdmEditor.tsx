import { useState } from 'react'
import { EditorChunkErrorBoundary } from './editor-chunk-error-boundary'
import { JdmEditor, type JdmEditorProps } from './JdmEditor'

/** Eager import: a failed React.lazy() chunk is cached forever, and Vite 504s
 * the on-demand @gorules/jdm-editor prebundle so reload never recovers. */
export function LazyJdmEditor(props: JdmEditorProps) {
  const [generation, setGeneration] = useState(0)
  return (
    <EditorChunkErrorBoundary onRetry={() => setGeneration((g) => g + 1)}>
      <JdmEditor key={generation} {...props} />
    </EditorChunkErrorBoundary>
  )
}
