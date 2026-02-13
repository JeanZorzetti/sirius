import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function WebhooksLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-[160px]" />
                    <Skeleton className="h-4 w-[280px]" />
                </div>
                <Skeleton className="h-10 w-[140px]" />
            </div>

            {[1, 2, 3].map((i) => (
                <Card key={i}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-[200px]" />
                            <Skeleton className="h-6 w-10 rounded-full" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-[200px]" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
