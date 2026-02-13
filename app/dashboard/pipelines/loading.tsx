import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function PipelinesLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-[240px]" />
                    <Skeleton className="h-4 w-[320px]" />
                </div>
                <Skeleton className="h-10 w-[160px]" />
            </div>

            {/* Pipeline Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-6 w-[180px]" />
                                <Skeleton className="h-8 w-8 rounded" />
                            </div>
                            <Skeleton className="h-4 w-[120px]" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[1, 2, 3, 4].map((s) => (
                                <div key={s} className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-[140px]" />
                                    <Skeleton className="h-5 w-[40px] rounded-full" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
