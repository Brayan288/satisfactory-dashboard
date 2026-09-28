import { PowerSection } from '@/components/PowerSection'
import { EfficiencyChart } from '@/components/EfficiencyChart'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { useDashboard } from '@/hooks/useDashboardContext'
import { useSettings } from '@/hooks/useSettings'

export function PowerPage() {
  const { data, history, loading } = useDashboard()
  const { settings } = useSettings()

  if (loading && !data) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      <PowerSection circuits={data?.power ?? []} history={history} chartHeight={settings.chartHeightCircuit} />
      <EfficiencyChart history={history} height={settings.chartHeightTrends} />
    </div>
  )
}
