import { describe, expect, it } from 'vitest'
import { runZenFunction } from './run-zen-function'

describe('runZenFunction', () => {
  it('executes export const handler and returns its result', () => {
    const result = runZenFunction(
      'export const handler = (input) => ({ riskScore: input.amountCents > 0 ? 42 : 0 })',
      { amountCents: 10 },
    )
    expect(result).toEqual({ riskScore: 42 })
  })

  it('throws when the source does not define handler', () => {
    expect(() => runZenFunction('const x = 1', {})).toThrow(/handler/i)
  })
})
