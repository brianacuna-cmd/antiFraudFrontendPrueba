import { describe, expect, it } from 'vitest'
import { isIdentityValid, validateIdentity } from './validateIdentity'

const VALID = '0123456789abcdef01234567'

describe('validateIdentity', () => {
  it('returns no errors for two valid hex24 ids', () => {
    expect(validateIdentity(VALID, VALID)).toEqual({})
    expect(isIdentityValid(VALID, VALID)).toBe(true)
  })

  it('flags an invalid userId', () => {
    const errors = validateIdentity('bad', VALID)
    expect(errors.userId).toBeTruthy()
    expect(errors.organizationId).toBeUndefined()
    expect(isIdentityValid('bad', VALID)).toBe(false)
  })

  it('flags an invalid organizationId', () => {
    const errors = validateIdentity(VALID, 'bad')
    expect(errors.organizationId).toBeTruthy()
    expect(errors.userId).toBeUndefined()
  })

  it('flags both when both invalid', () => {
    const errors = validateIdentity('', '')
    expect(errors.userId).toBeTruthy()
    expect(errors.organizationId).toBeTruthy()
  })
})
