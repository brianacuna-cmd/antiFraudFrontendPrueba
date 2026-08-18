import { describe, expect, it, vi } from 'vitest'
import {
  installResizeObserverErrorFilter,
  isResizeObserverLoopError,
} from './ignore-resize-observer-error'

describe('isResizeObserverLoopError', () => {
  it('matches the Vite overlay message from React Flow panels', () => {
    expect(
      isResizeObserverLoopError('ResizeObserver loop completed with undelivered notifications.'),
    ).toBe(true)
    expect(isResizeObserverLoopError('TypeError: boom')).toBe(false)
  })
})

describe('installResizeObserverErrorFilter', () => {
  it('stops ResizeObserver errors from reaching later listeners (Vite overlay)', () => {
    const later = vi.fn()
    window.addEventListener('error', later)
    const uninstall = installResizeObserverErrorFilter()
    const event = new ErrorEvent('error', {
      message: 'ResizeObserver loop completed with undelivered notifications.',
      cancelable: true,
    })
    window.dispatchEvent(event)
    expect(later).not.toHaveBeenCalled()
    uninstall()
    window.removeEventListener('error', later)
  })
})
