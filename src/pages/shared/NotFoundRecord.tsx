import { SearchX } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/ui/EmptyState'
import { LinkButton } from '@/components/ui/Button'

/**
 * Shown when a detail route resolves to no record.
 *
 * For a customer this is also what a record belonging to another tenant looks
 * like — the prototype does not distinguish "does not exist" from "not yours",
 * which is the behaviour a real implementation should keep.
 */
export function NotFoundRecord({
  title,
  description,
  backTo,
  backLabel,
}: {
  title: string
  description: string
  backTo: string
  backLabel: string
}) {
  return (
    <PageContainer title={title}>
      <div className="surface">
        <EmptyState
          icon={<SearchX className="size-5" />}
          title={title}
          description={description}
          action={
            <LinkButton to={backTo} variant="primary">
              {backLabel}
            </LinkButton>
          }
        />
      </div>
    </PageContainer>
  )
}
