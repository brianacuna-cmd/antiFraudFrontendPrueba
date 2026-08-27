/**
 * Local-only evaluator for GoRules Function nodes (`export const handler = ...`).
 * Used by the in-browser Simulator; the backend still scores with Zen WASM.
 */
export function runZenFunction(source: string, input: unknown): unknown {
  const code = source.replace(/export\s+const\s+handler\s*=/, 'const handler =')
  const factory = new Function(`${code}\n; if (typeof handler !== 'function') throw new Error('Function node must export handler');\n return handler;`)
  const handler = factory() as (value: unknown) => unknown
  return handler(input)
}
