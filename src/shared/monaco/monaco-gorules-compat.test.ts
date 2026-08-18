import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * @gorules/jdm-editor 1.52 calls `monaco.languages.typescript.javascriptDefaults`.
 * That API exists on monaco-editor 0.52 and was moved in 0.56, which crashes
 * the Function editor (Vite: reading 'javascriptDefaults').
 */
describe('monaco-editor GoRules compatibility', () => {
  it('stays on the 0.52 line that still exposes languages.typescript.javascriptDefaults', () => {
    const pkgPath = path.join(process.cwd(), 'node_modules', 'monaco-editor', 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string }
    expect(pkg.version.startsWith('0.52.')).toBe(true)
  })
})
