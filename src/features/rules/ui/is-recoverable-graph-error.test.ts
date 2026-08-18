import { describe, expect, it } from 'vitest'
import { isRecoverableGraphError } from './is-recoverable-graph-error'

describe('isRecoverableGraphError', () => {
  it('treats React 19 removeChild (antd Text) as recoverable', () => {
    const err = new Error("Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.")
    err.name = 'NotFoundError'
    expect(isRecoverableGraphError(err)).toBe(true)
  })

  it('treats monaco javascriptDefaults TypeError as recoverable', () => {
    const err = new TypeError("Cannot read properties of undefined (reading 'javascriptDefaults')")
    expect(isRecoverableGraphError(err)).toBe(true)
  })

  it('does not swallow a real React Flow crash', () => {
    const err = new TypeError("Cannot read properties of undefined (reading 'x')")
    expect(isRecoverableGraphError(err)).toBe(false)
  })
})
