import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ProspectingLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-[260px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
                <Skeleton className="h-6 w-[120px] rounded-full" />
            </div>

            {/* Search Card */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-[180px]" />
                    <Skeleton className="h-4 w-[300px]" />
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-[120px]" />
                    </div>
                </CardContent>
            </Card>

            {/* Recent Jobs Card */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-[160px]" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-3 w-[140px]" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-5 w-[80px] rounded-full" />
                                <Skeleton className="h-4 w-[40px]" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
