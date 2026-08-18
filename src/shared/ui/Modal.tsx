import type { ReactNode } from 'react'

export interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null
  return (
    <div role="dialog" aria-label={title} className="af-modal">
      <div className="af-modal__header">
        <h2>{title}</h2>
        <button aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="af-modal__body">{children}</div>
    </div>
  )
}
