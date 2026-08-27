import { useId } from 'react'
import { Paperclip, Upload } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

/**
 * Form primitives.
 *
 * Validation here is prototype-level only: required fields and obviously
 * malformed input. No business rules are enforced, because none are confirmed.
 */

const controlClass =
  'w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 ' +
  'focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none disabled:bg-ink-50'

const errorClass = 'border-danger-600 focus:border-danger-600 focus:ring-danger-100'

interface FieldShellProps {
  label: string
  htmlFor: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
}

function FieldShell({ label, htmlFor, required, hint, error, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-700">
        {label}
        {required ? <span className="ml-0.5 text-danger-600">*</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p className="mt-1 text-xs text-danger-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

export function TextInput({ label, hint, error, required, className = '', ...rest }: TextInputProps) {
  const id = useId()
  return (
    <FieldShell label={label} htmlFor={id} required={required} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        className={`${controlClass} ${error ? errorClass : ''} ${className}`}
        {...rest}
      />
    </FieldShell>
  )
}

/**
 * Date control.
 *
 * Uses the native date input rather than a custom picker: no extra dependency,
 * accessible by default, and correct on mobile.
 */
export function DatePicker({ label, hint, error, required, className = '', ...rest }: TextInputProps) {
  const id = useId()
  return (
    <FieldShell label={label} htmlFor={id} required={required} hint={hint} error={error}>
      <input
        id={id}
        type="date"
        aria-invalid={Boolean(error)}
        className={`${controlClass} ${error ? errorClass : ''} ${className}`}
        {...rest}
      />
    </FieldShell>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
}

export function Textarea({ label, hint, error, required, className = '', ...rest }: TextareaProps) {
  const id = useId()
  return (
    <FieldShell label={label} htmlFor={id} required={required} hint={hint} error={error}>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        className={`${controlClass} min-h-28 resize-y ${error ? errorClass : ''} ${className}`}
        {...rest}
      />
    </FieldShell>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  error?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  required,
  className = '',
  ...rest
}: SelectProps) {
  const id = useId()
  return (
    <FieldShell label={label} htmlFor={id} required={required} hint={hint} error={error}>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        className={`${controlClass} ${error ? errorClass : ''} ${className}`}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

interface FileUploadProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  accept?: string
  value: string | null
  onChange: (fileName: string | null) => void
}

/**
 * File control.
 *
 * The chosen file's NAME is captured and nothing else — the file is never read
 * or uploaded. Real storage is explicitly out of scope for this prototype.
 */
export function FileUpload({ label, hint, error, required, accept, value, onChange }: FileUploadProps) {
  const id = useId()

  return (
    <FieldShell label={label} htmlFor={id} required={required} hint={hint} error={error}>
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={id}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-ink-300 bg-white px-3.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
        >
          <Upload className="size-4" />
          Choose file
        </label>
        <input
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => onChange(event.target.files?.[0]?.name ?? null)}
        />
        {value ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-600">
            <Paperclip className="size-3.5 text-ink-400" />
            {value}
            <button
              type="button"
              onClick={() => onChange(null)}
              className="ml-1 text-xs text-brand-600 hover:underline"
            >
              Remove
            </button>
          </span>
        ) : (
          <span className="text-sm text-ink-400">No file selected</span>
        )}
      </div>
    </FieldShell>
  )
}
