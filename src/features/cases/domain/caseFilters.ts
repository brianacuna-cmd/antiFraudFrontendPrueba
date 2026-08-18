import type { CaseFilters } from '@shared/types/domain'

/** Client-side default page size when the user hasn't picked one. */
export const DEFAULT_PAGE_SIZE = 20

/**
 * Builds a query-param object for `GET /cases` from a `CaseFilters`, dropping
 * empty/undefined values so we never send e.g. `status=` or `tags=`.
 */
export function buildCaseFiltersQuery(
  filters: CaseFilters,
): Record<string, string | number | string[] | undefined> {
  const query: Record<string, string | number | string[] | undefined> = {}
  if (filters.status) query.status = filters.status
  if (filters.priority) query.priority = filters.priority
  if (filters.assignedTo) query.assignedTo = filters.assignedTo
  if (filters.riskScoreMin !== undefined) query.riskScoreMin = filters.riskScoreMin
  if (filters.riskScoreMax !== undefined) query.riskScoreMax = filters.riskScoreMax
  if (filters.tags && filters.tags.length > 0) query.tags = filters.tags
  if (filters.dueAfter) query.dueAfter = filters.dueAfter
  if (filters.dueBefore) query.dueBefore = filters.dueBefore
  query.limit = filters.limit ?? DEFAULT_PAGE_SIZE
  query.offset = filters.offset ?? 0
  return query
}

// TODO(backend-contract): the spec does not document an evidence upload size
// or content-type limit. We enforce a conservative client-side default (per
// design's Open Questions) pending backend confirmation.
export const MAX_EVIDENCE_FILE_BYTES = 10 * 1024 * 1024 // 10MB

export interface EvidenceFileValidationResult {
  valid: boolean
  error?: string
}

export function validateEvidenceFile(file: File): EvidenceFileValidationResult {
  if (file.size > MAX_EVIDENCE_FILE_BYTES) {
    return { valid: false, error: `File exceeds the ${MAX_EVIDENCE_FILE_BYTES / (1024 * 1024)}MB limit` }
  }
  return { valid: true }
}
