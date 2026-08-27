/**
 * Self-hosted Monaco bootstrap, following the official GoRules + Vite recipe.
 * Import this module exactly ONCE, before the app renders (see src/main.tsx).
 *
 * Worker paths are the monaco-editor 0.52 ESM layout (`esm/vs/...`). Do not
 * switch to the 0.56 short paths — jdm-editor 1.52 still needs 0.52's
 * `languages.typescript.javascriptDefaults`.
 */
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import { loader } from '@monaco-editor/react'
import { attachTypescriptLanguageApi } from './attach-typescript-language-api'

declare global {
  interface Window {
    monaco: typeof monaco
  }
}

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    switch (label) {
      case 'json':
        return new jsonWorker()
      case 'css':
      case 'scss':
      case 'less':
        return new cssWorker()
      case 'html':
      case 'handlebars':
      case 'razor':
        return new htmlWorker()
      case 'typescript':
      case 'javascript':
        return new tsWorker()
      default:
        return new editorWorker()
    }
  },
}

// Expose the module instance globally so any lazy consumer resolves to
// this exact self-hosted Monaco.
self.monaco = monaco

// Monaco 0.56 moved javascriptDefaults off languages.typescript; GoRules still reads it there.
attachTypescriptLanguageApi(monaco)

// Tell @monaco-editor/react (used transitively by @gorules/jdm-editor) to
// reuse this self-hosted instance instead of loading from a CDN.
loader.config({ monaco })

export {}
