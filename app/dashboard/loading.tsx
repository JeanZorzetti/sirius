import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            {/* Header with title and button skeleton */}
            <div className="flex items-center justify-between space-y-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Kanban Board skeleton */}
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {/* 4 columns for pipeline stages */}
                {[1, 2, 3, 4].map((columnIndex) => (
                    <div key={columnIndex} className="w-[300px] flex-none flex flex-col gap-4">
                        {/* Column header skeleton */}
                        <div className="flex justify-between items-center rounded-md border bg-muted/40 p-3 shadow-sm">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-5 w-8 rounded-full" />
                        </div>

                        {/* Cards container */}
                        <div className="flex flex-col gap-2 min-h-[150px] p-1 rounded-md bg-muted/10 border border-dashed border-transparent">
                            {/* 3 card skeletons per column */}
                            {[1, 2, 3].map((cardIndex) => (
                                <div
                                    key={cardIndex}
                                    className="rounded-lg border bg-card text-card-foreground shadow-sm"
                                >
                                    <div className="p-4 pb-2">
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                    <div className="p-4 pt-0">
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
