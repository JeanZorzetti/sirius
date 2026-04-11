import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonCardList, SkeletonTable } from '@/components/ui/skeleton-card-list'

export default function ContactsLoading() {
    return (
        <div className="flex-1 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex w-full items-center space-x-2 sm:w-auto">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-28" />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-full max-w-sm" />
            </div>

            <SkeletonTable rows={8} columns={6} />
            <SkeletonCardList count={6} />
        </div>
    )
}
