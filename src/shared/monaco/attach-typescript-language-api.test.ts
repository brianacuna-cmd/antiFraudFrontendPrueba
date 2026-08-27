import { describe, expect, it } from 'vitest'
import { attachTypescriptLanguageApi } from './attach-typescript-language-api'

describe('attachTypescriptLanguageApi', () => {
  it('puts monaco.typescript on languages.typescript so GoRules can read javascriptDefaults', () => {
    const javascriptDefaults = { setExtraLibs() {} }
    const monaco = { languages: {}, typescript: { javascriptDefaults } }
    attachTypescriptLanguageApi(monaco)
    expect(monaco.languages.typescript).toEqual({ javascriptDefaults })
  })

  it('does not overwrite an existing languages.typescript', () => {
    const existing = { javascriptDefaults: { keep: true } }
    const monaco = { languages: { typescript: existing }, typescript: { javascriptDefaults: {} } }
    attachTypescriptLanguageApi(monaco)
    expect(monaco.languages.typescript).toBe(existing)
  })
})
