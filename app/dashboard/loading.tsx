import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6 overflow-hidden max-h-screen">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                </div>
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-[120px]" />
                </div>
            </div>

            {/* Kanban Board Skeleton Grid */}
            <div className="flex h-full gap-6 overflow-hidden pt-4">
                {[1, 2, 3, 4].map((col) => (
                    <div key={col} className="w-[320px] flex-none flex flex-col h-full space-y-4">
                        {/* Column Header */}
                        <div className="flex items-center justify-between px-1">
                            <Skeleton className="h-4 w-24 bg-zinc-800" />
                            <Skeleton className="h-5 w-8 rounded-full bg-zinc-900" />
                        </div>

                        {/* Column Bar */}
                        <Skeleton className="h-1 w-full rounded-full bg-zinc-900" />

                        {/* Card Skeletons (Ghost Cards) */}
                        <div className="flex-1 rounded-2xl bg-white/[0.02] p-3 border border-white/5 space-y-3">
                            {[1, 2, 3].map((card) => (
                                <div key={card} className="h-32 rounded-xl bg-zinc-900/50 border border-white/5 p-4 space-y-3 relative overflow-hidden">
                                    {/* Simple shimmer effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ transform: 'skewX(-20deg) translateX(-150%)' }} />

                                    <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                                    <Skeleton className="h-3 w-1/2 bg-zinc-800" />

                                    <div className="pt-4 flex justify-between items-center">
                                        <Skeleton className="h-4 w-20 bg-zinc-800" />
                                        <Skeleton className="h-6 w-6 rounded-full bg-zinc-800" />
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
