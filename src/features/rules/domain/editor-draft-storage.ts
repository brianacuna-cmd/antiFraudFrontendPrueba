import type { JdmGraph } from '@shared/types/domain'

export const EDITOR_DRAFT_PREFIX = 'af-rule-editor-draft:'

export interface EditorDraft {
  name: string
  graph: JdmGraph
}

export function editorDraftStorageKey(draftKey: string): string {
  return `${EDITOR_DRAFT_PREFIX}${draftKey}`
}

function readStore(): Storage | null {
  try {
    return sessionStorage
  } catch {
    return null
  }
}

function isDraft(value: unknown): value is EditorDraft {
  if (value === null || typeof value !== 'object') return false
  const rec = value as { name?: unknown; graph?: unknown }
  if (typeof rec.name !== 'string') return false
  const graph = rec.graph as JdmGraph | undefined
  return Boolean(graph && Array.isArray(graph.nodes) && Array.isArray(graph.edges))
}

export function loadEditorDraft(draftKey: string): EditorDraft | null {
  const store = readStore()
  if (!store) return null
  try {
    const raw = store.getItem(editorDraftStorageKey(draftKey))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isDraft(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveEditorDraft(draftKey: string, draft: EditorDraft): void {
  const store = readStore()
  if (!store) return
  try {
    store.setItem(editorDraftStorageKey(draftKey), JSON.stringify(draft))
  } catch {
    // Quota / private-mode: editing still works; reload will lose the draft.
  }
}

export function clearEditorDraft(draftKey: string): void {
  const store = readStore()
  if (!store) return
  try {
    store.removeItem(editorDraftStorageKey(draftKey))
  } catch {
    // ignore
  }
}
