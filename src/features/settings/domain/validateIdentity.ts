import { isHexId24 } from '@shared/types/ids'

export interface IdentityValidationErrors {
  userId?: string
  organizationId?: string
}

export function validateIdentity(userId: string, organizationId: string): IdentityValidationErrors {
  const errors: IdentityValidationErrors = {}
  if (!isHexId24(userId)) {
    errors.userId = 'Must be a 24-character hex string'
  }
  if (!isHexId24(organizationId)) {
    errors.organizationId = 'Must be a 24-character hex string'
  }
  return errors
}

export function isIdentityValid(userId: string, organizationId: string): boolean {
  const errors = validateIdentity(userId, organizationId)
  return Object.keys(errors).length === 0
}
