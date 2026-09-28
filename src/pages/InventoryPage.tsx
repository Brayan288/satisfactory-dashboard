import { InventorySection } from '@/components/InventorySection'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { useDashboard } from '@/hooks/useDashboardContext'

export function InventoryPage() {
  const { data, loading } = useDashboard()

  if (loading && !data) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      <InventorySection storage={data?.storage ?? []} />
    </div>
  )
}
