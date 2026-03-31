import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function BillingLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-[280px]" />
                    <Skeleton className="h-4 w-[320px]" />
                </div>
                <Skeleton className="h-10 w-[160px]" />
            </div>

            {/* Current Plan Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-1">
                            <Skeleton className="h-6 w-[140px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-[180px] mb-4" />
                    <div className="grid gap-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Skeleton className="h-4 w-4 rounded-full" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Additional Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-[160px]" />
                            <Skeleton className="h-4 w-[240px]" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-[120px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
