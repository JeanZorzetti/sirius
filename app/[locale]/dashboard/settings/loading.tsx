import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function SettingsLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="space-y-1">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
            </div>

            {/* Settings Sections */}
            {[1, 2, 3].map((section) => (
                <Card key={section}>
                    <CardHeader>
                        <Skeleton className="h-6 w-[180px]" />
                        <Skeleton className="h-4 w-[260px]" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[1, 2, 3].map((field) => (
                            <div key={field} className="space-y-2">
                                <Skeleton className="h-4 w-[100px]" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                        <Skeleton className="h-10 w-[120px]" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
