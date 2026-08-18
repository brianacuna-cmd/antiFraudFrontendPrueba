import { useState } from 'react'
import { Button, ErrorBanner, FormField, Input } from '@shared/ui'
import { downloadEvidenceUrl } from '../infrastructure/casesApi'
import { useEvidence, useUploadEvidence } from '../application/useCases'
import { validateEvidenceFile } from '../domain/caseFilters'

export interface EvidenceTabProps {
  caseId: string
}

export function EvidenceTab({ caseId }: EvidenceTabProps) {
  const { data, isLoading } = useEvidence(caseId)
  const upload = useUploadEvidence(caseId)
  const [investigationId, setInvestigationId] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setClientError(null)
    const form = e.currentTarget
    const fileInput = form.elements.namedItem('file') as HTMLInputElement
    const file = fileInput?.files?.[0]
    if (!file) {
      setClientError('Choose a file to upload')
      return
    }
    const validation = validateEvidenceFile(file)
    if (!validation.valid) {
      setClientError(validation.error ?? 'Invalid file')
      return
    }
    upload.mutate({ file, investigationId: investigationId || undefined })
  }

  return (
    <div>
      <form aria-label="Upload evidence" onSubmit={handleSubmit}>
        <FormField label="File" htmlFor="file">
          <input id="file" name="file" type="file" />
        </FormField>
        <FormField label="Investigation ID (optional)" htmlFor="investigationId">
          <Input
            id="investigationId"
            value={investigationId}
            onChange={(e) => setInvestigationId(e.target.value)}
          />
        </FormField>
        <Button type="submit" disabled={upload.isPending}>
          Upload
        </Button>
      </form>
      {clientError ? <ErrorBanner message={clientError} /> : null}
      {upload.isError ? <ErrorBanner message="Failed to upload evidence" /> : null}
      {upload.isSuccess ? <p role="status">Evidence uploaded</p> : null}

      {isLoading ? <p>Loading…</p> : null}
      {data && data.items.length > 0 ? (
        <ul>
          {data.items.map((ev) => (
            <li key={ev.id}>
              {ev.fileName ?? ev.id} —{' '}
              <a href={downloadEvidenceUrl(ev.id)}>Download</a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
