import { ThemeProvider } from "@/components/theme-provider"
import '@/app/globals.css' // app stylesheet on top of public.css (spec 007)

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      forcedTheme="light"
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    </ThemeProvider>
  )
}
