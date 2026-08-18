import { Button, ErrorBanner, FormField, Input, Tabs } from '@shared/ui'
import { useState } from 'react'
import { useAddNote, useCaseDetail, useNotes, useTimeline } from '../application/useCases'
import { EvidenceTab } from './EvidenceTab'
import { LifecycleActions } from './LifecycleActions'

export interface CaseDetailScreenProps {
  caseId: string
}

function TimelineTab({ caseId }: { caseId: string }) {
  const { data, isLoading } = useTimeline(caseId)
  if (isLoading) return <p>Loading…</p>
  if (!data || data.items.length === 0) return <p>No timeline events yet.</p>
  return (
    <ul>
      {data.items.map((event) => (
        <li key={event.id}>
          {event.type} — {event.createdAt}
        </li>
      ))}
    </ul>
  )
}

function NotesTab({ caseId }: { caseId: string }) {
  const { data, isLoading } = useNotes(caseId)
  const addNote = useAddNote(caseId)
  const [body, setBody] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    addNote.mutate(body, { onSuccess: () => setBody('') })
  }

  return (
    <div>
      <form aria-label="Add note" onSubmit={handleSubmit}>
        <FormField label="Note" htmlFor="note-body">
          <Input id="note-body" value={body} onChange={(e) => setBody(e.target.value)} />
        </FormField>
        <Button type="submit" disabled={addNote.isPending}>
          Add note
        </Button>
      </form>
      {addNote.isError ? <ErrorBanner message="Failed to add note" /> : null}
      {isLoading ? <p>Loading…</p> : null}
      {data && data.items.length > 0 ? (
        <ul>
          {data.items.map((note, i) => (
            <li key={note.id ?? i}>{note.body}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function CaseDetailScreen({ caseId }: CaseDetailScreenProps) {
  const { data: caseData, isLoading, isError } = useCaseDetail(caseId)

  if (isLoading) return <p>Loading…</p>
  if (isError || !caseData) return <ErrorBanner message="Failed to load case" />

  return (
    <div>
      <h2>Case {caseData.id}</h2>
      <dl>
        <dt>Score</dt>
        <dd>{caseData.riskScore ?? '—'}</dd>
        <dt>Priority</dt>
        <dd>{caseData.priority ?? '—'}</dd>
        <dt>SLA due</dt>
        <dd>{(caseData.slaDueAt as string | undefined) ?? '—'}</dd>
      </dl>

      <LifecycleActions caseData={caseData} />

      <Tabs
        tabs={[
          { id: 'timeline', label: 'Timeline', content: <TimelineTab caseId={caseId} /> },
          { id: 'notes', label: 'Notes', content: <NotesTab caseId={caseId} /> },
          { id: 'evidence', label: 'Evidence', content: <EvidenceTab caseId={caseId} /> },
        ]}
      />
    </div>
  )
}
