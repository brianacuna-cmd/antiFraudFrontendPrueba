import { describe, expect, it } from 'vitest'
import { isHexId24 } from './ids'

describe('isHexId24', () => {
  it('accepts exactly 24 hex chars', () => {
    expect(isHexId24('0123456789abcdef01234567')).toBe(true)
  })

  it('rejects shorter strings', () => {
    expect(isHexId24('0123456789abcdef')).toBe(false)
  })

  it('rejects longer strings', () => {
    expect(isHexId24('0123456789abcdef012345678')).toBe(false)
  })

  it('rejects non-hex characters', () => {
    expect(isHexId24('zzzzzzzzzzzzzzzzzzzzzzzz')).toBe(false)
  })

  it('rejects non-string values', () => {
    expect(isHexId24(12345)).toBe(false)
    expect(isHexId24(undefined)).toBe(false)
    expect(isHexId24(null)).toBe(false)
  })
})
