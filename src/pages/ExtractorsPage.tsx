import { ExtractorsSection } from '@/components/ExtractorsSection'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { useDashboard } from '@/hooks/useDashboardContext'

export function ExtractorsPage() {
  const { data, loading } = useDashboard()

  if (loading && !data) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      <ExtractorsSection extractors={data?.extractors ?? []} />
    </div>
  )
}
