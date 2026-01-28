import { ThemeProvider } from "@/components/theme-provider"

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
