/**
 * GoRules JDM editor uses @gorules/zen-engine-wasm for expression linting,
 * autocomplete, and type hints. The library tries to init WASM on its own,
 * but Vite must be given an explicit asset URL or the .wasm file 404s and
 * the editor feels "dead" (no completions, no validation).
 *
 * Official recipe: https://docs.gorules.io/developers/jdm/jdm-editor
 */
import initZenWasm from '@gorules/zen-engine-wasm'
import wasmUrl from '@gorules/zen-engine-wasm/dist/zen_engine_wasm_bg.wasm?url'

let loaded = false

export async function initZenWasmOnce(): Promise<void> {
  if (loaded) return
  await initZenWasm({ module_or_path: wasmUrl })
  loaded = true
}
