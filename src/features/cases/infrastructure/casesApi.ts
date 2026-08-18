import { httpClient } from '@shared/http/httpClient'
import type { Case, CaseFilters, Evidence, Note, TimelineEvent } from '@shared/types/domain'
import { buildCaseFiltersQuery } from '../domain/caseFilters'

export interface CasesListResult {
  items: Case[]
  total: number
}

export function listCases(filters: CaseFilters): Promise<CasesListResult> {
  return httpClient.get<CasesListResult>('/cases', buildCaseFiltersQuery(filters))
}

export function getCaseDetail(caseId: string): Promise<Case> {
  return httpClient.get<Case>(`/cases/${caseId}`)
}

export function getTimeline(caseId: string): Promise<{ items: TimelineEvent[] }> {
  return httpClient.get<{ items: TimelineEvent[] }>(`/cases/${caseId}/timeline`)
}

export function getNotes(caseId: string): Promise<{ items: Note[] }> {
  return httpClient.get<{ items: Note[] }>(`/cases/${caseId}/notes`)
}

export function addNote(caseId: string, body: string): Promise<Note> {
  return httpClient.post<Note>(`/cases/${caseId}/notes`, { body })
}

// TODO(backend-contract): exact evidence list-item / metadata shape is not
// documented in the spec beyond `{ id, ... }`; `Evidence` is intentionally
// loose (optional fields) so this adapter tolerates whatever the backend
// actually returns.
export function listEvidence(caseId: string): Promise<{ items: Evidence[] }> {
  return httpClient.get<{ items: Evidence[] }>(`/cases/${caseId}/evidence`)
}

export function uploadEvidence(
  caseId: string,
  file: File,
  investigationId?: string,
): Promise<Evidence> {
  const formData = new FormData()
  formData.append('file', file)
  return httpClient.postForm<Evidence>(
    `/cases/${caseId}/evidence`,
    formData,
    investigationId ? { investigationId } : undefined,
  )
}

export function downloadEvidenceUrl(evidenceId: string): string {
  // Consumed directly as an <a href> — the browser attaches cookies/whatever
  // auth exists for a plain navigation; for trusted-header auth this only
  // works if the backend also accepts the header via query/session in a
  // real deployment. TODO(backend-contract): confirm how downloads
  // authenticate outside of fetch-with-headers (e.g. signed URL vs. header).
  return `/api/v1/evidence/${evidenceId}/download`
}

export function startReview(caseId: string): Promise<Case> {
  return httpClient.post<Case>(`/cases/${caseId}/start-review`)
}

export function resolveCase(caseId: string, reason: string): Promise<Case> {
  return httpClient.post<Case>(`/cases/${caseId}/resolve`, { reason })
}

export function archiveCase(caseId: string, reason: string): Promise<Case> {
  return httpClient.post<Case>(`/cases/${caseId}/archive`, { reason })
}

// TODO(backend-contract): reassign/reopen request body shapes are not
// documented in the spec (§2.4 explicitly defers them). We default to a
// minimal `{ assigneeId }` for reassign and `{}` for reopen; adjust once
// confirmed against the live API.
export function reassignCase(caseId: string, assigneeId: string): Promise<Case> {
  return httpClient.post<Case>(`/cases/${caseId}/reassign`, { assigneeId })
}

export function reopenCase(caseId: string): Promise<Case> {
  return httpClient.post<Case>(`/cases/${caseId}/reopen`, {})
}
