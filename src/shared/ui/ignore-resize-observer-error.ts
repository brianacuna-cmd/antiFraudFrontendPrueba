/** React Flow + resizable simulator panels fire this; Vite's overlay then blocks clicks. */
export function isResizeObserverLoopError(message: unknown): boolean {
  return typeof message === 'string' && message.includes('ResizeObserver loop')
}

export function installResizeObserverErrorFilter(target: Window = window): () => void {
  const onError = (event: ErrorEvent) => {
    if (!isResizeObserverLoopError(event.message)) return
    event.stopImmediatePropagation()
    event.preventDefault()
  }
  target.addEventListener('error', onError, true)
  return () => target.removeEventListener('error', onError, true)
}
