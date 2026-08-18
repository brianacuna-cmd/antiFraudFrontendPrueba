import { describe, expect, it } from 'vitest'

describe('test harness smoke', () => {
  it('runs green', () => {
    expect(1 + 1).toBe(2)
  })
})
