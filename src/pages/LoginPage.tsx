import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Cable, FileSignature, LifeBuoy, MapPin, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { TextInput } from '@/components/forms/Fields'
import { DEMO_ACCOUNTS, useSession } from '@/state/SessionContext'

const HIGHLIGHTS = [
  { icon: MapPin, label: 'Every location in one inventory' },
  { icon: Cable, label: 'Services, circuits and carriers linked end to end' },
  { icon: FileSignature, label: 'Contract dates, renewals and monthly cost' },
  { icon: LifeBuoy, label: 'Support tickets with full history' },
]

export function LoginPage() {
  const { session, signIn } = useSession()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (session) {
    return <Navigate to={session.role === 'LynkBridge Admin' ? '/admin/dashboard' : '/customer/dashboard'} replace />
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Enter an email address.')
      return
    }

    setSubmitting(true)

    // Brief delay purely so the sign-in transition reads as a real action.
    window.setTimeout(() => {
      const result = signIn(email)
      setSubmitting(false)

      if (!result.ok) {
        setError(result.error)
        return
      }

      navigate(result.session.role === 'LynkBridge Admin' ? '/admin/dashboard' : '/customer/dashboard')
    }, 350)
  }

  const useAccount = (accountEmail: string) => {
    setEmail(accountEmail)
    setPassword('demo-prototype')
    setError(null)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — hidden on small screens so the form gets the space */}
      <section className="relative hidden flex-col justify-between bg-ink-900 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-brand-500 font-bold">LB</span>
          <span className="text-lg font-semibold">LynkBridge</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Technology and connectivity management, centralised.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-300">
            One portal for every location, service, circuit, carrier, contract, document and support ticket across a
            multi-location business.
          </p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.label} className="flex items-center gap-3 text-sm text-ink-200">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-ink-800 text-brand-300">
                    <Icon className="size-4" />
                  </span>
                  {item.label}
                </li>
              )
            })}
          </ul>
        </div>

        <p className="text-xs text-ink-500">Prototype build for product discovery — not a production system.</p>
      </section>

      <section className="flex items-center justify-center bg-white px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="grid size-8 place-items-center rounded-md bg-brand-600 text-sm font-bold text-white">
              LB
            </span>
            <span className="font-semibold text-ink-900">LynkBridge</span>
          </div>

          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-ink-900 lg:mt-0">Sign in</h2>
          <p className="mt-1 text-sm text-ink-500">Access your connectivity portal.</p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <TextInput
              label="Email address"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
            />

            <TextInput
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Any value works in the prototype"
              hint="Not checked — this prototype simulates sign-in."
            />

            {error ? <Alert tone="error">{error}</Alert> : null}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
              {submitting ? null : <ArrowRight className="size-4" />}
            </Button>
          </form>

          <div className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Demo accounts</p>
            <div className="mt-2 space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  onClick={() => useAccount(account.email)}
                  className="flex w-full items-center gap-3 rounded-[--radius-card] border border-ink-200 px-3 py-2.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900">{account.label}</p>
                    <p className="truncate text-xs text-ink-500">{account.description}</p>
                  </div>
                  <code className="hidden shrink-0 rounded bg-ink-100 px-1.5 py-0.5 text-[11px] text-ink-600 sm:block">
                    {account.email}
                  </code>
                </button>
              ))}
            </div>
          </div>

          <Alert tone="warning" className="mt-6" title="Simulated authentication">
            <p className="leading-relaxed">
              No password is verified, no session token is issued and no server is contacted. Tenant separation shown
              in this prototype is a UI demonstration, not a security control.
            </p>
          </Alert>

          <p className="mt-4 flex items-start gap-1.5 text-xs text-ink-400">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
            All customer names, contacts, addresses and figures in this prototype are fictional.
          </p>
        </div>
      </section>
    </div>
  )
}
