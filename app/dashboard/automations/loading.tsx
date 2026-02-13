import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AutomationsLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-[260px]" />
                    <Skeleton className="h-4 w-[340px]" />
                </div>
                <Skeleton className="h-10 w-[160px]" />
            </div>

            {/* Automation Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-[180px]" />
                                <Skeleton className="h-6 w-10 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-[140px]" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-5 w-[100px] rounded-full" />
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-[80px]" />
                                <Skeleton className="h-4 w-[60px]" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Skeleton className="h-8 w-8 rounded" />
                                <Skeleton className="h-8 w-8 rounded" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
