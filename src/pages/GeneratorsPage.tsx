import { GeneratorsSection } from '@/components/GeneratorsSection'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { useDashboard } from '@/hooks/useDashboardContext'

export function GeneratorsPage() {
  const { data, loading } = useDashboard()

  if (loading && !data) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      <GeneratorsSection generators={data?.generators ?? []} />
    </div>
  )
}
