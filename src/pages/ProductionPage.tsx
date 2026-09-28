import { ProductionSection } from '@/components/ProductionSection'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { useDashboard } from '@/hooks/useDashboardContext'

export function ProductionPage() {
  const { data, loading } = useDashboard()

  if (loading && !data) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      <ProductionSection factories={data?.factory ?? []} />
    </div>
  )
}
