import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function NotificationsLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="space-y-1">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
            </div>

            {[1, 2, 3].map((section) => (
                <Card key={section}>
                    <CardHeader>
                        <Skeleton className="h-6 w-[160px]" />
                        <Skeleton className="h-4 w-[240px]" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-[180px]" />
                                    <Skeleton className="h-3 w-[240px]" />
                                </div>
                                <Skeleton className="h-6 w-10 rounded-full" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
