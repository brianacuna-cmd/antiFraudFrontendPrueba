/** GoRules/antd/React Flow throw these during React 19 unmount. They are not a dead canvas. */
export function isRecoverableGraphError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  if (error.name === 'NotFoundError') return true
  return /removeChild|javascriptDefaults/.test(error.message)
}
