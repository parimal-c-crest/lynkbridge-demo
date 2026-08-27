import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, CalendarClock, LifeBuoy, Network } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard } from '@/components/ui/DetailCard'
import { ProtoNote } from '@/components/ui/ProtoNote'
import { usePortal } from '@/lib/usePortal'
import { REPORT_CATEGORIES, reportsForRole, type ReportCategory } from '@/reports/registry'

const CATEGORY_ICON: Record<ReportCategory, typeof BarChart3> = {
  Cost: BarChart3,
  Contracts: CalendarClock,
  Inventory: Network,
  Support: LifeBuoy,
}

const CATEGORY_BLURB: Record<ReportCategory, string> = {
  Cost: 'Where monthly spend sits, and how it is distributed.',
  Contracts: 'Renewal timing and the cost at stake in each window.',
  Inventory: 'The estate as it stands — services, circuits and sites.',
  Support: 'Ticket volume and the current book of work.',
}

export function ReportsListPage() {
  const { isAdmin, path } = usePortal()
  const reports = reportsForRole(isAdmin)

  return (
    <PageContainer
      title="Reports"
      description="Run a report against your current records, review it on screen, then export it as CSV."
    >
      {REPORT_CATEGORIES.map((category) => {
        const inCategory = reports.filter((report) => report.category === category)
        if (!inCategory.length) return null

        const Icon = CATEGORY_ICON[category]

        return (
          <DetailCard key={category} title={category} description={CATEGORY_BLURB[category]}>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {inCategory.map((report) => (
                <li key={report.id}>
                  <Link
                    to={path(`/reports/${report.id}`)}
                    className="group flex h-full flex-col rounded-[--radius-card] border border-ink-200 p-3.5 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                  >
                    <span className="flex items-center gap-2">
                      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-ink-100 text-ink-500 group-hover:bg-brand-100 group-hover:text-brand-600">
                        <Icon className="size-4" />
                      </span>
                      <span className="text-sm font-medium text-ink-900">{report.name}</span>
                    </span>
                    <span className="mt-2 flex-1 text-xs leading-relaxed text-ink-500">{report.description}</span>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
                      Run report
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </DetailCard>
        )
      })}

      <ProtoNote label="The report catalogue is a proposal">
        Reporting was not part of the build specification. These reports were built from the data the prototype
        already holds, to show what the shape of a reporting module could be. Which reports are actually needed, how
        they should be filtered, whether they need scheduling or delivery by email, and what an export must contain
        are all open questions.
      </ProtoNote>
    </PageContainer>
  )
}
