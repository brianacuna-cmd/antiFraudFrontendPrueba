/**
 * Self-hosted Monaco bootstrap, following the official Monaco + Vite recipe.
 * Import this module exactly ONCE, before the app renders (see src/main.tsx).
 *
 * This wires `@monaco-editor/react`'s `loader` to reuse this self-hosted
 * Monaco instance instead of fetching it from a CDN, which is required for
 * `@gorules/jdm-editor`'s `DecisionGraph` to work offline / without version
 * drift.
 */
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/editor/editor.worker?worker'
import cssWorker from 'monaco-editor/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/language/html/html.worker?worker'
import jsonWorker from 'monaco-editor/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/language/typescript/ts.worker?worker'
import { loader } from '@monaco-editor/react'

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

// Tell @monaco-editor/react (used transitively by @gorules/jdm-editor) to
// reuse this self-hosted instance instead of loading from a CDN.
loader.config({ monaco })

export {}
