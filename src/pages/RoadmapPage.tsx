import { CheckCircle2, CircleHelp, Clock, FlaskConical } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard } from '@/components/ui/DetailCard'
import { Alert } from '@/components/ui/Alert'
import { ASSUMPTIONS, CONFIRMED, OPEN_QUESTIONS, ROADMAP, type RegisterItem } from '@/prototype/assumptions'

/**
 * The prototype's own status page.
 *
 * Four registers: what the client confirmed, what the build team assumed to make
 * screens work, what still needs answering, and what is deliberately deferred.
 * This is what stops the prototype from reading as a finished specification.
 */
export function RoadmapPage() {
  return (
    <PageContainer
      title="Roadmap & open questions"
      description="What this prototype is built on, what it invented, and what still needs deciding."
    >
      <Alert tone="warning" title="This prototype is a discovery artifact, not a specification">
        <p className="leading-relaxed">
          It exists to validate structure, navigation, workflows and data relationships before Phase 1 is scoped and
          estimated. Where the requirements were silent, the smallest behaviour that made a screen work was chosen —
          and recorded below rather than hidden.
        </p>
      </Alert>

      <div className="grid gap-5 xl:grid-cols-2">
        <Register
          title="Confirmed by the client"
          description="Established in the discussion. Safe to build against."
          icon={<CheckCircle2 className="size-4 text-ok-600" />}
          items={CONFIRMED}
          accent="border-l-ok-600"
        />

        <Register
          title="Prototype assumptions"
          description="Decided by the build team purely to make the prototype work. Not requirements."
          icon={<FlaskConical className="size-4 text-warn-600" />}
          items={ASSUMPTIONS}
          accent="border-l-warn-600"
        />

        <Register
          title="Open questions for discovery"
          description="Needs a client answer before Phase 1 can be scoped or estimated."
          icon={<CircleHelp className="size-4 text-danger-600" />}
          items={OPEN_QUESTIONS}
          accent="border-l-danger-600"
        />

        <Register
          title="Future roadmap"
          description="Explicitly deferred. Not implemented anywhere in this prototype."
          icon={<Clock className="size-4 text-ink-400" />}
          items={ROADMAP}
          accent="border-l-ink-300"
        />
      </div>

      <Alert tone="info" title="Not implemented — and intentionally so">
        <p className="leading-relaxed">
          There is no backend, database, real authentication, file storage, email, carrier integration, monitoring,
          billing or AI in this build. Tenant separation is a client-side filter over mock data for demonstration only
          and provides no security. All customer names, contacts, addresses and figures are fictional.
        </p>
      </Alert>
    </PageContainer>
  )
}

function Register({
  title,
  description,
  icon,
  items,
  accent,
}: {
  title: string
  description: string
  icon: React.ReactNode
  items: RegisterItem[]
  accent: string
}) {
  return (
    <DetailCard
      title={title}
      description={description}
      actions={
        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-600">{items.length}</span>
      }
    >
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.area} className={`border-l-2 pl-3 ${accent}`}>
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink-900">
              {icon}
              {item.area}
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-ink-600">{item.detail}</p>
          </li>
        ))}
      </ul>
    </DetailCard>
  )
}
