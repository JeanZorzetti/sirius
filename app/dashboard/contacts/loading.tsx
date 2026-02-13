import { Skeleton } from "@/components/ui/skeleton"

export default function ContactsLoading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-[160px]" />
                    <Skeleton className="h-4 w-[260px]" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-[100px]" />
                    <Skeleton className="h-10 w-[120px]" />
                    <Skeleton className="h-10 w-[140px]" />
                </div>
            </div>

            {/* Search/Filter Bar */}
            <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-[300px]" />
                <Skeleton className="h-10 w-[100px]" />
            </div>

            {/* Table */}
            <div className="rounded-md border">
                {/* Table Header */}
                <div className="border-b p-4 flex gap-8">
                    {['w-[200px]', 'w-[180px]', 'w-[160px]', 'w-[120px]', 'w-[100px]'].map((w, i) => (
                        <Skeleton key={i} className={`h-4 ${w}`} />
                    ))}
                </div>
                {/* Table Rows */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                    <div key={row} className="border-b p-4 flex gap-8">
                        {['w-[200px]', 'w-[180px]', 'w-[160px]', 'w-[120px]', 'w-[100px]'].map((w, i) => (
                            <Skeleton key={i} className={`h-4 ${w}`} />
                        ))}
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-[120px]" />
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                </div>
            </div>
        </div>
    )
}
