import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Case, CaseFilters } from '@shared/types/domain'
import {
  addNote,
  archiveCase,
  getCaseDetail,
  getNotes,
  getTimeline,
  listCases,
  listEvidence,
  reassignCase,
  reopenCase,
  resolveCase,
  startReview,
  uploadEvidence,
  type CasesListResult,
} from '../infrastructure/casesApi'

// Differentiated sub-keys, per the Phase 4 lesson: `invalidateQueries`
// matches by key PREFIX by default in TanStack Query v5. A bare `['cases']`
// list key would also invalidate/refetch any mounted `['cases', id]`-style
// detail/timeline/notes query and can race a stale response over a fresh
// `setQueryData` write. Never collapse these back into a shared prefix
// without `exact: true`.
const casesListKey = (filters: CaseFilters) => ['cases', 'list', filters] as const
const caseDetailKey = (id: string) => ['cases', 'detail', id] as const
const caseTimelineKey = (id: string) => ['cases', 'timeline', id] as const
const caseNotesKey = (id: string) => ['cases', 'notes', id] as const
const caseEvidenceKey = (id: string) => ['cases', 'evidence', id] as const

export function useListCases(filters: CaseFilters) {
  return useQuery<CasesListResult, Error>({
    queryKey: casesListKey(filters),
    queryFn: () => listCases(filters),
  })
}

export function useCaseDetail(caseId: string | undefined) {
  return useQuery<Case, Error>({
    queryKey: caseId ? caseDetailKey(caseId) : ['cases', 'detail', 'unknown'],
    queryFn: () => getCaseDetail(caseId as string),
    enabled: Boolean(caseId),
  })
}

export function useTimeline(caseId: string | undefined) {
  return useQuery({
    queryKey: caseId ? caseTimelineKey(caseId) : ['cases', 'timeline', 'unknown'],
    queryFn: () => getTimeline(caseId as string),
    enabled: Boolean(caseId),
  })
}

export function useNotes(caseId: string | undefined) {
  return useQuery({
    queryKey: caseId ? caseNotesKey(caseId) : ['cases', 'notes', 'unknown'],
    queryFn: () => getNotes(caseId as string),
    enabled: Boolean(caseId),
  })
}

export function useAddNote(caseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => addNote(caseId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseNotesKey(caseId), exact: true })
    },
  })
}

export function useEvidence(caseId: string | undefined) {
  return useQuery({
    queryKey: caseId ? caseEvidenceKey(caseId) : ['cases', 'evidence', 'unknown'],
    queryFn: () => listEvidence(caseId as string),
    enabled: Boolean(caseId),
  })
}

export function useUploadEvidence(caseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, investigationId }: { file: File; investigationId?: string }) =>
      uploadEvidence(caseId, file, investigationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseEvidenceKey(caseId), exact: true })
    },
  })
}

function useLifecycleMutation(caseId: string, mutationFn: () => Promise<Case>) {
  const queryClient = useQueryClient()
  return useMutation<Case, Error, void>({
    mutationFn,
    onSuccess: (updatedCase) => {
      queryClient.setQueryData(caseDetailKey(caseId), updatedCase)
      queryClient.invalidateQueries({ queryKey: caseTimelineKey(caseId), exact: true })
    },
  })
}

export function useStartReview(caseId: string) {
  return useLifecycleMutation(caseId, () => startReview(caseId))
}

export function useResolveCase(caseId: string) {
  const queryClient = useQueryClient()
  return useMutation<Case, Error, string>({
    mutationFn: (reason) => resolveCase(caseId, reason),
    onSuccess: (updatedCase) => {
      queryClient.setQueryData(caseDetailKey(caseId), updatedCase)
      queryClient.invalidateQueries({ queryKey: caseTimelineKey(caseId), exact: true })
    },
  })
}

export function useArchiveCase(caseId: string) {
  const queryClient = useQueryClient()
  return useMutation<Case, Error, string>({
    mutationFn: (reason) => archiveCase(caseId, reason),
    onSuccess: (updatedCase) => {
      queryClient.setQueryData(caseDetailKey(caseId), updatedCase)
      queryClient.invalidateQueries({ queryKey: caseTimelineKey(caseId), exact: true })
    },
  })
}

export function useReassignCase(caseId: string) {
  const queryClient = useQueryClient()
  return useMutation<Case, Error, string>({
    mutationFn: (assigneeId) => reassignCase(caseId, assigneeId),
    onSuccess: (updatedCase) => {
      queryClient.setQueryData(caseDetailKey(caseId), updatedCase)
      queryClient.invalidateQueries({ queryKey: caseTimelineKey(caseId), exact: true })
    },
  })
}

export function useReopenCase(caseId: string) {
  return useLifecycleMutation(caseId, () => reopenCase(caseId))
}
