import { useState } from 'react'
import { Button, ErrorBanner, FormField, Input } from '@shared/ui'
import type { Case } from '@shared/types/domain'
import {
  useArchiveCase,
  useReassignCase,
  useReopenCase,
  useResolveCase,
  useStartReview,
} from '../application/useCases'

export interface LifecycleActionsProps {
  caseData: Case
}

export function LifecycleActions({ caseData }: LifecycleActionsProps) {
  const caseId = caseData.id
  const startReview = useStartReview(caseId)
  const resolve = useResolveCase(caseId)
  const archive = useArchiveCase(caseId)
  const reassign = useReassignCase(caseId)
  const reopen = useReopenCase(caseId)

  const [reason, setReason] = useState('')
  const [assigneeId, setAssigneeId] = useState('')

  const anyError = [startReview, resolve, archive, reassign, reopen].find((m) => m.isError)

  return (
    <div>
      <p>
        Status: <strong>{caseData.status}</strong>
        {caseData.assignedTo ? <span> · Assigned to: {String(caseData.assignedTo)}</span> : null}
      </p>

      <Button onClick={() => startReview.mutate()} disabled={startReview.isPending}>
        Start review
      </Button>

      <FormField label="Reason (for resolve/archive)" htmlFor="reason">
        <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      </FormField>
      <Button onClick={() => resolve.mutate(reason)} disabled={resolve.isPending || !reason}>
        Resolve
      </Button>
      <Button
        variant="secondary"
        onClick={() => archive.mutate(reason)}
        disabled={archive.isPending || !reason}
      >
        Archive
      </Button>

      <FormField label="Reassign to (user id)" htmlFor="assigneeId">
        <Input id="assigneeId" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} />
      </FormField>
      <Button
        variant="secondary"
        onClick={() => reassign.mutate(assigneeId)}
        disabled={reassign.isPending || !assigneeId}
      >
        Reassign
      </Button>

      <Button variant="secondary" onClick={() => reopen.mutate()} disabled={reopen.isPending}>
        Reopen
      </Button>

      {anyError ? <ErrorBanner message="Failed to update the case" /> : null}
    </div>
  )
}
