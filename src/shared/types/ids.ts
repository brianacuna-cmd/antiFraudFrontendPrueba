/** A 24-character hex string, e.g. a MongoDB ObjectId. */
export type HexId24 = string

const HEX_24_RE = /^[0-9a-fA-F]{24}$/

export function isHexId24(value: unknown): value is HexId24 {
  return typeof value === 'string' && HEX_24_RE.test(value)
}
