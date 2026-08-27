import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'

type Tone = 'info' | 'success' | 'warning' | 'error'

const TONE: Record<Tone, { wrap: string; icon: ReactNode }> = {
  info: { wrap: 'bg-info-50 border-info-200 text-info-700', icon: <Info className="size-4" /> },
  success: { wrap: 'bg-ok-50 border-ok-200 text-ok-700', icon: <CheckCircle2 className="size-4" /> },
  warning: { wrap: 'bg-warn-50 border-warn-200 text-warn-700', icon: <AlertTriangle className="size-4" /> },
  error: { wrap: 'bg-danger-50 border-danger-200 text-danger-700', icon: <XCircle className="size-4" /> },
}

interface AlertProps {
  tone?: Tone
  title?: string
  children?: ReactNode
  actions?: ReactNode
  className?: string
}

export function Alert({ tone = 'info', title, children, actions, className = '' }: AlertProps) {
  const config = TONE[tone]

  return (
    <div className={`flex gap-3 rounded-[--radius-card] border px-4 py-3 ${config.wrap} ${className}`} role="status">
      <span className="mt-0.5 shrink-0">{config.icon}</span>
      <div className="min-w-0 flex-1 text-sm">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={title ? 'mt-0.5' : ''}>{children}</div> : null}
        {actions ? <div className="mt-2 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
