import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useToast, type ToastTone } from '@/state/ToastContext'

const ICON: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const ACCENT: Record<ToastTone, string> = {
  success: 'text-ok-600',
  error: 'text-danger-600',
  info: 'text-info-600',
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (!toasts.length) return null

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => {
        const Icon = ICON[toast.tone]
        return (
          <div
            key={toast.id}
            className="flex items-start gap-3 rounded-[--radius-card] border border-ink-200 bg-white p-3 shadow-lg"
          >
            <Icon className={`mt-0.5 size-4 shrink-0 ${ACCENT[toast.tone]}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink-900">{toast.title}</p>
              {toast.description ? <p className="mt-0.5 text-xs text-ink-500">{toast.description}</p> : null}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="rounded p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
