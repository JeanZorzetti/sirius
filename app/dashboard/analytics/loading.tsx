import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AnalyticsLoading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            {/* Header */}
            <div className="space-y-1">
                <Skeleton className="h-8 w-[180px]" />
                <Skeleton className="h-4 w-[280px]" />
            </div>

            {/* 4 KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-4 rounded" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-7 w-[120px] mb-1" />
                            <Skeleton className="h-3 w-[80px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Chart Card */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-[200px]" />
                    <Skeleton className="h-4 w-[160px]" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[350px] w-full" />
                </CardContent>
            </Card>
        </div>
    )
}
