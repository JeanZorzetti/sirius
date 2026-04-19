Implemente APENAS o sprint/feature especificado: $ARGUMENTS

## Regras de execução

1. **Escopo fixo**: implemente somente o que foi pedido. Não avance para o próximo sprint automaticamente.
2. **Leia o spec primeiro**: antes de qualquer código, ler a seção correspondente do roadmap em `docs/` ou o arquivo indicado.
3. **Execute, não analise**: após ler o spec, implemente diretamente. Não explore o codebase além do necessário para a feature.

## Checklist de qualidade antes de commitar

- [ ] Params assíncronos corretos: `await params` nos route handlers (Next.js 15)
- [ ] Auth: usa `session.user.email` via `getSession()`, não hardcode
- [ ] Prisma: `import { prisma } from '@/lib/prisma'` (não `new PrismaClient()`)
- [ ] Client components com `useSearchParams()` envolvidos em `<Suspense>`
- [ ] TypeScript: sem erros (`npm run build` ou `tsc --noEmit`)
- [ ] Migrations: se adicionou campos no schema, rodar `npx prisma migrate dev`

## Ao finalizar

1. Rodar `npm run build` e corrigir qualquer erro
2. Fazer commit com mensagem descritiva: `feat: [nome do sprint/feature]`
3. Reportar o que foi implementado e o que ficou de fora (se houver)
4. **Parar aqui** — não iniciar o próximo sprint sem instrução explícita
