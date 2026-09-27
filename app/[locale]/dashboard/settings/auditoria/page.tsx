import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { carregarAcesso } from '@/lib/visibilidade'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Auditoria | Sirius CRM' }

const ACOES: Record<string, string> = {
  EXPORTACAO: 'Exportou',
  ENTRAR_COMO: 'Suporte entrou como',
}
const ALVOS: Record<string, string> = { contatos: 'contatos', negocios: 'negócios' }
const quando = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })
const linhas = (n: number) => `${n.toLocaleString('pt-BR')} ${n === 1 ? 'linha' : 'linhas'}`

/** Audit log of the organization (spec 011): exports and ROI Labs staff entering as a user. Owner only. */
export default async function AuditoriaPage() {
  const session = await getSession()
  if (!session?.user?.email) redirect('/login')
  const acesso = await carregarAcesso({ email: session.user.email })
  if (!acesso) redirect('/login')

  const cabecalho = (
    <div className="space-y-1">
      <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Configurações
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">Auditoria</h1>
    </div>
  )

  if (acesso.orgRole !== 'OWNER') {
    return (
      <div className="space-y-4 p-4 md:p-6">
        {cabecalho}
        <p className="text-sm text-muted-foreground">Só o dono da conta vê o registro de auditoria.</p>
      </div>
    )
  }

  const registros = await prisma.auditLog.findMany({
    where: { organizationId: acesso.organizationId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return (
    <div className="space-y-4 p-4 md:p-6">
      {cabecalho}
      <p className="text-sm text-muted-foreground">
        Quem exportou a base da conta e quando a equipe do Sirius entrou para dar suporte. Mostra os 200 registros mais
        recentes.
      </p>

      {registros.length === 0 ? (
        <p className="rounded-md border p-4 text-sm text-muted-foreground">
          Nenhum registro ainda. Exportações e acessos do suporte aparecem aqui assim que acontecerem.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[36rem] text-sm">
            <caption className="sr-only">Registro de auditoria da conta, do mais recente para o mais antigo</caption>
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Quando</th>
                <th scope="col" className="px-3 py-2 font-medium">Quem</th>
                <th scope="col" className="px-3 py-2 font-medium">O quê</th>
                <th scope="col" className="px-3 py-2 font-medium">Origem</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{quando.format(r.createdAt)}</td>
                  <td className="px-3 py-2">
                    {r.autorEmail}
                    {r.autorTipo === 'EQUIPE' && <span className="text-muted-foreground"> (equipe Sirius)</span>}
                  </td>
                  <td className="px-3 py-2">
                    {ACOES[r.acao] ?? r.acao}{' '}
                    {r.acao === 'EXPORTACAO'
                      ? `${ALVOS[r.alvo] ?? r.alvo} em ${(r.formato ?? '').toUpperCase()}${r.linhas !== null ? ` · ${linhas(r.linhas)}` : ''}`
                      : r.alvo}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">{r.ip ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
