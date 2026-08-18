import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  return <button className={['af-button', `af-button--${variant}`, className].filter(Boolean).join(' ')} {...rest} />
}
