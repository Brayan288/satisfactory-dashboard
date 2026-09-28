export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Power skeleton */}
      <div>
        <div className="h-6 w-32 rounded bg-secondary mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3">
              <div className="h-4 w-16 rounded bg-secondary mb-2" />
              <div className="h-7 w-20 rounded bg-secondary" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <div className="h-4 w-24 rounded bg-secondary mb-3" />
              <div className="h-2 w-full rounded bg-secondary mb-3" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 rounded bg-secondary" />
                <div className="h-10 rounded bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="h-5 w-48 rounded bg-secondary mb-4" />
        <div className="h-44 rounded bg-secondary/50" />
      </div>

      {/* Production skeleton */}
      <div>
        <div className="h-6 w-40 rounded bg-secondary mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3 text-center">
              <div className="h-8 w-10 mx-auto rounded bg-secondary mb-1" />
              <div className="h-3 w-16 mx-auto rounded bg-secondary" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 w-full rounded bg-secondary" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
