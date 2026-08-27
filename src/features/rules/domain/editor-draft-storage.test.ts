import { beforeEach, describe, expect, it } from 'vitest'
import { JDM_CONTENT_TYPE, type JdmGraph } from '@shared/types/domain'
import {
  clearEditorDraft,
  editorDraftStorageKey,
  loadEditorDraft,
  saveEditorDraft,
} from './editor-draft-storage'

const GRAPH: JdmGraph = {
  contentType: JDM_CONTENT_TYPE,
  nodes: [{ id: 'request', type: 'inputNode', name: 'Request' }],
  edges: [],
}

describe('editor-draft-storage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('round-trips name and graph under a draft key', () => {
    saveEditorDraft('new', { name: 'Imported demo', graph: GRAPH })
    expect(loadEditorDraft('new')).toEqual({ name: 'Imported demo', graph: GRAPH })
    expect(sessionStorage.getItem(editorDraftStorageKey('new'))).toContain('Imported demo')
  })

  it('returns null for missing or corrupt payloads', () => {
    expect(loadEditorDraft('missing')).toBeNull()
    sessionStorage.setItem(editorDraftStorageKey('new'), '{not json')
    expect(loadEditorDraft('new')).toBeNull()
  })

  it('clears only the requested draft key', () => {
    saveEditorDraft('new', { name: 'A', graph: GRAPH })
    saveEditorDraft('edit:r1', { name: 'B', graph: GRAPH })
    clearEditorDraft('new')
    expect(loadEditorDraft('new')).toBeNull()
    expect(loadEditorDraft('edit:r1')?.name).toBe('B')
  })
})
