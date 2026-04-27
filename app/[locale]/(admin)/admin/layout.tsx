import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ShieldAlert, ArrowLeft, Activity, LifeBuoy } from "lucide-react"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getSession()
    if (!session || !session.user?.email) {
        redirect("/login")
    }

    // Double-check role in DB (Critical for security)
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    })

    // @ts-ignore - Prisma types might not update immediately in IDE
    if (!user || user.role !== "ADMIN") {
        redirect("/dashboard")
    }

    return (
        <div className="flex min-h-screen flex-col">
            {/* Admin Header */}
            <header className="sticky top-0 z-50 flex h-16 items-center border-b border-slate-200 bg-white px-6 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-red-600">
                    <ShieldAlert className="h-6 w-6" />
                    <span>SIRIUS ADMIN</span>
                </div>
                <nav className="ml-8 flex items-center gap-6">
                    <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        Overview
                    </Link>
                    <Link href="/admin/users" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        Users
                    </Link>
                    <Link href="/admin/organizations" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        Organizations
                    </Link>
                    <Link href="/admin/analytics" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        Analytics
                    </Link>
                    <Link href="/admin/pwa-metrics" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        PWA Metrics
                    </Link>
                    <Link href="/admin/seo" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        SEO
                    </Link>
                    <Link href="/admin/funnel" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        Funnel
                    </Link>
                    <Link href="/admin/knowledge-graph" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        Knowledge Graph
                    </Link>
                    <Link href="/admin/access-logs" className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        <Activity className="h-3.5 w-3.5" />
                        Acessos
                    </Link>
                    <Link href="/admin/support" className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                        <LifeBuoy className="h-3.5 w-3.5" />
                        Tickets
                    </Link>
                </nav>
                <div className="ml-auto">
                    <Link href="/dashboard" className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar ao App
                    </Link>
                </div>
            </header>

            {/* Admin Content */}
            <main className="flex-1 p-6">
                <div className="mx-auto w-full" style={{ maxWidth: '1600px' }}>
                    {children}
                </div>
            </main>
        </div>
    )
}
