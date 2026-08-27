import { Link } from 'react-router-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 border-transparent shadow-sm',
  secondary: 'bg-white text-ink-700 hover:bg-ink-50 border-ink-300',
  ghost: 'bg-transparent text-ink-600 hover:bg-ink-100 border-transparent',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 border-transparent shadow-sm',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
}

const base =
  'inline-flex items-center justify-center rounded-md border font-medium transition-colors ' +
  'disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap'

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `${base} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

export function Button({ variant = 'primary', size = 'md', icon, className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </button>
  )
}

interface LinkButtonProps {
  to: string
  variant?: Variant
  size?: Size
  icon?: ReactNode
  className?: string
  children: ReactNode
}

export function LinkButton({ to, variant = 'secondary', size = 'md', icon, className = '', children }: LinkButtonProps) {
  return (
    <Link to={to} className={buttonClass(variant, size, className)}>
      {icon}
      {children}
    </Link>
  )
}
