import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function TeamLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-[100px]" />
                    <Skeleton className="h-4 w-[280px]" />
                </div>
                <Skeleton className="h-10 w-[140px]" />
            </div>

            {/* Active Members Table */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-[180px]" />
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <div className="border-b p-3 flex gap-6">
                            {['w-[160px]', 'w-[200px]', 'w-[100px]', 'w-[80px]'].map((w, i) => (
                                <Skeleton key={i} className={`h-4 ${w}`} />
                            ))}
                        </div>
                        {[1, 2, 3].map((row) => (
                            <div key={row} className="border-b p-3 flex gap-6 items-center">
                                <div className="flex items-center gap-2 w-[160px]">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-4 w-[100px]" />
                                </div>
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-5 w-[80px] rounded-full" />
                                <Skeleton className="h-8 w-8 rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
