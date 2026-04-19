# Sirius CRM — Contexto para Claude

## Regras Gerais

- **Ação > Análise**: Não gaste tempo excessivo lendo e analisando arquivos. Quando a tarefa é clara, execute imediatamente. Se tiver dúvida, pergunte — não queime tokens explorando.
- **Debugging — sempre checar env vars primeiro**: Ao debugar erros de API, falhas de deploy ou problemas de conexão DB: 1) Ler todos os `.env` relevantes 2) Checar caracteres especiais (`$`, `#`), comentários no final de URLs, URLs erradas 3) Confirmar que env vars de produção batem com o que o código espera. Só depois ir para código.
- **Migrations formais**: Sempre use `prisma migrate` em vez de `db execute` manual. Alterações manuais causam bugs em produção quando campos ficam faltando.

## Projeto
CRM B2B SaaS em Next.js 15 App Router. Deploy: Vercel. DB: PostgreSQL via Prisma (host: `31.97.23.166:5499`).

## Stack
- **Framework**: Next.js 15, TypeScript, App Router (RSC-first)
- **DB**: Prisma ORM + PostgreSQL (use sempre `import { prisma } from '@/lib/prisma'` — nunca `new PrismaClient()`)
- **Auth**: `getSession()` de `@/lib/auth` → retorna `session.user.email`
- **UI**: Tailwind CSS + shadcn/ui
- **Email**: Resend
- **Testes**: Jest + Playwright (e2e)

## Padrões Críticos

### Next.js 15 — Params assíncronos
```ts
// CORRETO — params e searchParams são Promise no Next.js 15
export default async function Page({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { slug } = await params
  const { q } = await searchParams
}
```

### Auth em Server Components / Route Handlers
```ts
const session = await getSession()
if (!session?.user?.email) return <div>Não autorizado</div>
const user = await prisma.user.findUnique({ where: { email: session.user.email } })
```

### Filtros via URL params (padrão do projeto)
- Client component lê `useSearchParams()` e atualiza URL via `useRouter().push()`
- Server component lê `searchParams` e passa filtros para queries Prisma
- Client components que usam `useSearchParams` DEVEM ser envolvidos em `<Suspense>`

### TypeScript
- Roles de mensagem: cast explícito `as 'user' | 'assistant'`
- Decimais do Prisma: `Number(deal.value)` ou `{ equals: Number(v) } as any`

## Estrutura de Diretórios Chave
```
app/
  (marketing)/        # Landing pages públicas (sem auth)
  dashboard/          # App autenticado (kanban, analytics)
  api/                # Route handlers
components/
  dashboard/          # Componentes do kanban/pipeline
  analytics/          # Gráficos (Recharts)
  ui/                 # shadcn/ui base
lib/
  blog/               # Posts do blog (ver lib/blog/CLAUDE.md)
  prisma.ts           # Singleton Prisma
  auth.ts             # getSession()
  blog-types.ts       # Interface BlogPost
```

## Sub-guias (leia ao trabalhar nessas áreas)
- **Blog / SEO / GEO**: `lib/blog/CLAUDE.md`
- **Dashboard / Kanban**: `app/dashboard/CLAUDE.md` *(a criar)*
- **API Routes**: `app/api/CLAUDE.md` *(a criar)*
