import { installResizeObserverErrorFilter } from '@shared/ui/ignore-resize-observer-error'
import '@shared/monaco/monaco-workers'
import { initZenWasmOnce } from '@shared/jdm/init-zen-wasm'
import '@gorules/jdm-editor/dist/style.css'
import '@gorules/jdm-editor'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

installResizeObserverErrorFilter()
await initZenWasmOnce()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
