import { Suspense } from "react"
import { Activity } from "lucide-react"
import AccessLogsClient from "./access-logs-client"

export const dynamic = "force-dynamic"

export default function AdminAccessLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-red-500" />
            Registro de Acesso
          </h2>
          <p className="text-zinc-500 mt-1">
            Data de criação, último acesso, tempo médio de sessão e páginas mais utilizadas por organização.
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="text-zinc-500 text-sm">Carregando...</div>}>
        <AccessLogsClient />
      </Suspense>
    </div>
  )
}
