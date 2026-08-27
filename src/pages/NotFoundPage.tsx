import { Compass } from 'lucide-react'
import { LinkButton } from '@/components/ui/Button'
import { useSession } from '@/state/SessionContext'

/** Catch-all for any URL that matches no route. */
export function NotFoundPage() {
  const { session } = useSession()

  const home = session
    ? session.role === 'LynkBridge Admin'
      ? '/admin/dashboard'
      : '/customer/dashboard'
    : '/login'

  return (
    <div className="grid min-h-screen place-items-center bg-ink-100 px-6">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-white text-ink-400 ring-1 ring-ink-200">
          <Compass className="size-5" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-900">Page not found</h1>
        <p className="mt-2 text-sm text-ink-500">
          That address does not match any screen in this prototype.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <LinkButton to={home} variant="primary">
            {session ? 'Back to dashboard' : 'Go to sign in'}
          </LinkButton>
        </div>
      </div>
    </div>
  )
}
