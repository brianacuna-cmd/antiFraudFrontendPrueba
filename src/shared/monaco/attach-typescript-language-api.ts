/**
 * Monaco 0.56 exports TypeScript helpers as `monaco.typescript`.
 * GoRules still reads `monaco.languages.typescript.javascriptDefaults` (0.52 API).
 */
export function attachTypescriptLanguageApi(monaco: {
  languages: { typescript?: unknown }
  typescript?: unknown
}): void {
  if (monaco.languages.typescript == null && monaco.typescript != null) {
    monaco.languages.typescript = monaco.typescript
  }
}
