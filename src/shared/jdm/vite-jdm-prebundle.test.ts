import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('vite GoRules prebundle', () => {
  it('includes @gorules/jdm-editor in optimizeDeps so the editor does not 504 on first load', () => {
    const src = readFileSync(path.join(process.cwd(), 'vite.config.ts'), 'utf8')
    expect(src).toContain("'@gorules/jdm-editor'")
    expect(src).toMatch(/optimizeDeps[\s\S]*include[\s\S]*@gorules\/jdm-editor/)
  })
})
