/**
 * Time-range control for a chart.
 *
 * Sits in the card header rather than beside the plot, so a dashboard of several
 * charts keeps one predictable place for its controls.
 */
export function RangeSelect({
  value,
  onChange,
  options,
  label = 'Range',
}: {
  value: number
  onChange: (value: number) => void
  options: Array<{ value: number; label: string }>
  label?: string
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-7 rounded-md border border-ink-300 bg-white px-2 text-xs text-ink-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
