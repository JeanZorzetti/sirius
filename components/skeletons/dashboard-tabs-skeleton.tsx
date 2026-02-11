export function DashboardTabsSkeleton() {
  return (
    <div className="h-full flex flex-col">
      {/* Pipeline selector skeleton */}
      <div className="mb-4 flex gap-2">
        <div className="h-10 w-48 animate-pulse bg-muted rounded-lg" />
        <div className="h-10 w-32 animate-pulse bg-muted rounded-lg" />
      </div>

      {/* Kanban columns skeleton */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-3">
              {/* Column header */}
              <div className="h-12 animate-pulse bg-muted rounded-lg" />

              {/* Deal cards */}
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="h-32 animate-pulse bg-muted rounded-lg"
                    style={{ animationDelay: `${(i - 1) * 100 + j * 50}ms` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
