import { describe, expect, it } from 'vitest'
import {
  buildCaseFiltersQuery,
  DEFAULT_PAGE_SIZE,
  MAX_EVIDENCE_FILE_BYTES,
  validateEvidenceFile,
} from './caseFilters'

describe('buildCaseFiltersQuery', () => {
  it('applies default pagination when not provided', () => {
    const query = buildCaseFiltersQuery({})
    expect(query.limit).toBe(DEFAULT_PAGE_SIZE)
    expect(query.offset).toBe(0)
  })

  it('drops empty/undefined filters', () => {
    const query = buildCaseFiltersQuery({ status: '', tags: [] })
    expect(query.status).toBeUndefined()
    expect(query.tags).toBeUndefined()
  })

  it('includes all provided filters', () => {
    const query = buildCaseFiltersQuery({
      status: 'OPEN',
      priority: 'HIGH',
      assignedTo: 'user-1',
      riskScoreMin: 10,
      riskScoreMax: 90,
      tags: ['fraud', 'urgent'],
      dueAfter: '2026-01-01',
      dueBefore: '2026-02-01',
      limit: 50,
      offset: 100,
    })
    expect(query).toEqual({
      status: 'OPEN',
      priority: 'HIGH',
      assignedTo: 'user-1',
      riskScoreMin: 10,
      riskScoreMax: 90,
      tags: ['fraud', 'urgent'],
      dueAfter: '2026-01-01',
      dueBefore: '2026-02-01',
      limit: 50,
      offset: 100,
    })
  })
})

describe('validateEvidenceFile', () => {
  it('accepts a file under the size cap', () => {
    const file = new File(['x'.repeat(100)], 'small.txt')
    expect(validateEvidenceFile(file)).toEqual({ valid: true })
  })

  it('rejects a file over the size cap', () => {
    const big = new Uint8Array(MAX_EVIDENCE_FILE_BYTES + 1)
    const file = new File([big], 'big.bin')
    const result = validateEvidenceFile(file)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/10MB/)
  })
})
