import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Download, Printer } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { DetailCard } from '@/components/ui/DetailCard'
import { Button, LinkButton } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchInput } from '@/components/data/FilterBar'
import { ChartFrame } from '@/components/charts/ChartFrame'
import { BarChart } from '@/components/charts/BarChart'
import { ColumnChart } from '@/components/charts/ColumnChart'
import { StackedStrip } from '@/components/charts/StackedStrip'
import { usePortal } from '@/lib/usePortal'
import { formatCurrency, formatNumber } from '@/lib/format'
import { downloadCsv, toCsv } from '@/lib/csv'
import { PROTOTYPE_TODAY } from '@/data/dataset'
import { getReport } from '@/reports/registry'
import { useToast } from '@/state/ToastContext'
import { NotFoundRecord } from './NotFoundRecord'

/** Values that read as a state get a badge instead of plain text. */
const BADGE_COLUMNS = new Set(['status', 'band'])

export function ReportViewPage() {
  const { id } = useParams()
  const { data, isAdmin, path, session, settings } = usePortal()
  const { notify } = useToast()

  const [query, setQuery] = useState('')

  const report = getReport(id)
  const result = useMemo(
    () => (report ? report.run(data, { renewalWindowDays: settings.renewalWindowDays }) : null),
    [report, data, settings.renewalWindowDays],
  )

  if (!report || !result || (report.adminOnly && !isAdmin)) {
    return (
      <NotFoundRecord
        title="Report not found"
        description="No report exists with that identifier, or it is not available to your role."
        backTo={path('/reports')}
        backLabel="Back to reports"
      />
    )
  }

  const needle = query.trim().toLowerCase()
  const rows = needle
    ? result.rows.filter((row) => Object.values(row).join(' ').toLowerCase().includes(needle))
    : result.rows

  const exportCsv = () => {
    const stamp = PROTOTYPE_TODAY.toISOString().slice(0, 10)
    const scope = session.tenantName ? session.tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'platform'
    downloadCsv(`lynkbridge-${report.id}-${scope}-${stamp}.csv`, toCsv(result.columns, rows))
    notify({
      tone: 'success',
      title: 'Report exported',
      description: `${rows.length} ${rows.length === 1 ? 'row' : 'rows'} downloaded as CSV.`,
    })
  }

  return (
    <PageContainer
      title={report.name}
      description={report.description}
      breadcrumbs={[
        { label: isAdmin ? 'Admin' : 'Portal', to: path('/dashboard') },
        { label: 'Reports', to: path('/reports') },
        { label: report.name },
      ]}
      meta={
        <>
          <StatusBadge status={report.category} />
          <span className="text-xs text-ink-500">
            {session.tenantName ?? 'All customers'} · {formatNumber(result.rows.length)} rows
          </span>
        </>
      }
      actions={
        <>
          <Button variant="secondary" icon={<Printer className="size-4" />} onClick={() => window.print()}>
            Print
          </Button>
          <Button icon={<Download className="size-4" />} onClick={exportCsv}>
            Export CSV
          </Button>
        </>
      }
    >
      {result.chart ? (
        <ChartFrame title="Summary" description="The same figures as the table below, in shape.">
          {result.chart.kind === 'bar' ? (
            <BarChart
              rows={result.chart.rows}
              maxRows={10}
              formatValue={result.chart.money ? formatCurrency : formatNumber}
              ariaLabel={result.chart.ariaLabel}
            />
          ) : result.chart.kind === 'column' ? (
            <ColumnChart
              rows={result.chart.rows}
              valueLabel={result.chart.valueLabel}
              formatValue={result.chart.money ? formatCurrency : formatNumber}
              ariaLabel={result.chart.ariaLabel}
            />
          ) : (
            <StackedStrip
              slices={result.chart.slices}
              formatValue={result.chart.money ? formatCurrency : formatNumber}
              ariaLabel={result.chart.ariaLabel}
            />
          )}
        </ChartFrame>
      ) : null}

      <DetailCard
        title="Results"
        description={
          result.summary ? `${result.summary.label}: ${result.summary.value}` : `${result.rows.length} rows`
        }
        actions={
          <SearchInput value={query} onChange={setQuery} placeholder="Filter rows…" className="w-56" />
        }
        flush
      >
        {rows.length === 0 ? (
          <EmptyState
            title="No rows match that filter"
            description="Clear the filter to see the whole report."
            action={
              <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                Clear filter
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse">
              <thead className="border-y border-ink-200 bg-ink-50">
                <tr>
                  {result.columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={`cell-head ${column.align === 'right' ? 'text-right' : ''}`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {rows.map((row, index) => (
                  <tr key={index} className="bg-white">
                    {result.columns.map((column) => {
                      const value = row[column.key]
                      return (
                        <td
                          key={column.key}
                          className={`cell ${column.align === 'right' ? 'text-right tabular-nums' : ''}`}
                        >
                          {BADGE_COLUMNS.has(column.key) && typeof value === 'string' ? (
                            <StatusBadge status={value} />
                          ) : (
                            (value ?? '—')
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
              {result.summary ? (
                <tfoot className="border-t-2 border-ink-300 bg-ink-50">
                  <tr>
                    <td className="cell font-semibold text-ink-700" colSpan={result.columns.length - 1}>
                      {result.summary.label}
                    </td>
                    <td className="cell text-right font-semibold tabular-nums text-ink-900">
                      {result.summary.value}
                    </td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        )}
      </DetailCard>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[--radius-card] border border-dashed border-ink-300 bg-ink-50 px-4 py-3">
        <p className="text-xs leading-relaxed text-ink-500">
          Figures are fictional prototype data, calculated live from the records currently loaded. The CSV export is
          real — it is generated in your browser from the rows above and never leaves this tab. Scheduled delivery,
          saved report definitions and date-range filtering are not implemented.
        </p>
        <LinkButton to={path('/reports')} size="sm">
          All reports
        </LinkButton>
      </div>
    </PageContainer>
  )
}
