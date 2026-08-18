import type { ReactNode } from 'react'

export interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string | null
  children: ReactNode
}

export function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div className="af-form-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? (
        <span role="alert" className="af-form-field__error">
          {error}
        </span>
      ) : null}
    </div>
  )
}
