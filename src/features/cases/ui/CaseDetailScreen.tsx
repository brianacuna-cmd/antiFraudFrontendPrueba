import { Button, ErrorBanner, FormField, Input, Tabs } from '@shared/ui'
import { useState } from 'react'
import { useAddNote, useCaseDetail, useNotes, useTimeline } from '../application/useCases'
import { EvidenceTab } from './EvidenceTab'
import { LifecycleActions } from './LifecycleActions'

export interface CaseDetailScreenProps {
  caseId: string
}

function timelineType(event: { eventType?: string; type?: string }): string {
  return event.eventType ?? event.type ?? 'UNKNOWN'
}

function TimelineTab({ caseId }: { caseId: string }) {
  const { data, isLoading } = useTimeline(caseId)
  if (isLoading) return <p>Loading…</p>
  if (!data || data.items.length === 0) return <p>No timeline events yet.</p>
  return (
    <ul>
      {data.items.map((event) => {
        const type = timelineType(event)
        return (
          <li key={event.id}>
            {type} — {event.createdAt}
            {type === 'AGENT_BRIEFING' && event.newValue ? (
              <span className="af-timeline-brief">{event.newValue}</span>
            ) : null}
          </li>
        )
      })}
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

      <section className="af-agent-brief" aria-labelledby="agent-brief-heading">
        <h3 id="agent-brief-heading">Agent brief</h3>
        {caseData.agentBrief ? (
          <p className="af-agent-brief__body">{caseData.agentBrief}</p>
        ) : (
          <p>No agent brief yet. It appears here after the companion writes to this case.</p>
        )}
      </section>

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
