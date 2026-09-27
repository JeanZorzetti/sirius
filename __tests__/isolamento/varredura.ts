/**
 * Static isolation guard (spec 011, FR-003/FR-004).
 *
 * Every Prisma call that picks specific records (`id` or a `…Id` key other than `organizationId`) must be safe in one
 * of these ways, or it is reported with file and line:
 *  1. the `where` carries the organization (`organizationId`, or a relation filter that contains it);
 *  2. the id is already trusted: it was used in an earlier lookup that carried the organization or whose result was
 *     compared with the caller's organization (`x.organizationId !== user.organizationId`);
 *  3. the id came from the database, not from the request: it is read off a variable that holds a Prisma result
 *     (`org.id`, `post.id` in a loop over a query, `deal.contactId`);
 *  4. a `// isolamento: <reason>` comment within the 3 lines above the call, or `// isolamento-arquivo: <reason>` in
 *     the first lines of a file that crosses organizations by definition (the ROI Labs staff panel).
 * `create` calls are checked the same way for their foreign keys (`dealId`, `productId`, …).
 *
 * Limits: raw SQL (`$queryRaw`) is not examined; a helper that receives an id from its caller needs a justification.
 */
import ts from 'typescript'
import fs from 'fs'
import path from 'path'

export type Achado = { arquivo: string; linha: number; modelo: string; op: string; motivo: string }

const LEITURA = new Set(['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany'])
const OPS = new Set([...LEITURA, 'update', 'updateMany', 'delete', 'deleteMany', 'upsert', 'count', 'aggregate', 'groupBy', 'create', 'createMany'])
const CLIENTES = new Set(['prisma', 'tx', 'prismaWa', 'db'])
/** Not tenant data: global content, auth tokens, experiments */
const GLOBAIS = new Set(['passwordResetToken', 'entity', 'relationship', 'entityExtraction', 'contentEntity', 'conversationSession',
  'conversationMessage', 'experiment', 'experimentVariant', 'experimentEvent', 'gatewayInstance', 'webhookDeadLetter'])
/** Keys that end in Id but are not references to another tenant record */
const CHAVES_NEUTRAS = new Set(['organizationId', 'userId', 'createdById', 'creatorId', 'authorId', 'uploadedById', 'autorUserId',
  'requestId', 'messageId', 'leadgenId', 'pageId', 'formId', 'adId', 'adgroupId', 'campaignId', 'sessionId', 'omieId',
  'omieClienteId', 'createdByUserId', 'googleEventId', 'svixAppId', 'svixEndpointId', 'svixMessageId', 'providerPaymentId', 'wabaPhoneNumberId',
  'remoteJid', 'snowflakeId', 'stripeCustomerId', 'stripeSubscriptionId', 'mercadoPagoSubscriptionId', 'mercadoPagoCustomerId',
  'mercadoPagoPreferenceId', 'facebookPageId', 'wabaBusinessAccountId', 'instagramBusinessAccountId', 'googleAdsCustomerId',
  'facebookAdAccountId', 'referredUserId', 'referrerId', 'endpointId', 'externalId', 'reviewedBy'])
const ITERADORES = new Set(['map', 'forEach', 'filter', 'flatMap', 'find', 'some', 'every', 'findIndex'])
/** Loaders whose own query carries the organization (checked by this guard where they live): their result is trusted */
const CARREGADORES = new Set(['tarefaDoPedido', 'projetoDoPedido', 'carregarAcesso'])

const desembrulhar = (n: ts.Node | undefined): ts.Node | undefined => {
  while (n && (ts.isParenthesizedExpression(n) || ts.isAsExpression(n) || ts.isNonNullExpression(n) || ts.isAwaitExpression(n) || ts.isSatisfiesExpression(n))) {
    n = n.expression
  }
  return n
}
const nomeDe = (p: ts.ObjectLiteralElementLike) =>
  p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : undefined
const chaveDeId = (k?: string) => !!k && k !== 'organizationId' && (k === 'id' || /Id$/.test(k))
/** Carries the organization: the column, the relation, or a scope from lib/visibilidade (which always includes it) */
const temConta = (texto: string) => /organizationId|organization\s*:|orgId|\bescopo(Negocio|Pipeline|Tarefa|Projeto)\(/.test(texto)
const valorDe = (p: ts.ObjectLiteralElementLike) =>
  ts.isShorthandPropertyAssignment(p) ? p.name.text : ts.isPropertyAssignment(p) ? p.initializer.getText() : ''
/** `a.b?.c` → `a`; a bare identifier returns itself */
const raiz = (expr: string) => expr.replace(/^\(|\s/g, '').split(/[.?[(]/)[0]
const ehFuncao = (n: ts.Node): n is ts.FunctionLikeDeclaration =>
  ts.isFunctionDeclaration(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isMethodDeclaration(n)

type Chamada = { no: ts.CallExpression; modelo: string; op: string; arg?: ts.Node }

function chamadaPrisma(n: ts.Node): Chamada | undefined {
  if (!ts.isCallExpression(n)) return
  const alvo = desembrulhar(n.expression)
  if (!alvo || !ts.isPropertyAccessExpression(alvo) || !OPS.has(alvo.name.text)) return
  const acessoModelo = desembrulhar(alvo.expression)
  if (!acessoModelo || !ts.isPropertyAccessExpression(acessoModelo)) return
  const cliente = desembrulhar(acessoModelo.expression)
  if (!cliente || !ts.isIdentifier(cliente) || !CLIENTES.has(cliente.text) || GLOBAIS.has(acessoModelo.name.text)) return
  return { no: n, modelo: acessoModelo.name.text, op: alvo.name.text, arg: desembrulhar(n.arguments[0]) }
}

const propriedade = (obj: ts.Node | undefined, nome: string) =>
  obj && ts.isObjectLiteralExpression(obj) ? obj.properties.find((p) => nomeDe(p) === nome) : undefined

/** Id keys a where literal picks, with their value expressions */
function escolhas(w: ts.Node): { chave: string; valor: string }[] {
  const saida: { chave: string; valor: string }[] = []
  const andar = (n: ts.Node | undefined) => {
    n = desembrulhar(n)
    if (!n) return
    if (ts.isObjectLiteralExpression(n)) {
      for (const p of n.properties) {
        const k = nomeDe(p)
        // `assigneeId: { not: null }` filters; it does not pick a record (only `in`/`equals` do)
        const inicial = ts.isPropertyAssignment(p) ? desembrulhar(p.initializer) : undefined
        const filtroSemEscolha = !!inicial && ts.isObjectLiteralExpression(inicial) &&
          !inicial.properties.some((q) => ['in', 'equals'].includes(nomeDe(q) ?? ''))
        if (chaveDeId(k) && !filtroSemEscolha && (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p))) saida.push({ chave: k!, valor: valorDe(p) })
        if (ts.isPropertyAssignment(p) && k && ['AND', 'OR', 'NOT'].includes(k)) andar(p.initializer)
      }
    } else if (ts.isArrayLiteralExpression(n)) n.elements.forEach(andar)
  }
  andar(w)
  return saida
}

/** Names bound by a declaration or parameter (identifiers and destructuring) */
function nomesLigados(nome: ts.BindingName): string[] {
  if (ts.isIdentifier(nome)) return [nome.text]
  return nome.elements.flatMap((e) => (ts.isBindingElement(e) ? nomesLigados(e.name) : []))
}

function analisarArquivo(arquivo: string, codigo: string): Achado[] {
  // A whole file that crosses organizations by definition (the ROI Labs staff panel) says so once, at the top
  if (/^\s*\/\/ isolamento-arquivo: \S/m.test(codigo.split('\n').slice(0, 15).join('\n'))) return []
  const sf = ts.createSourceFile(arquivo, codigo, ts.ScriptTarget.Latest, true)
  const linhas = codigo.split('\n')
  const achados: Achado[] = []

  const analisarFuncao = (fn: ts.FunctionLikeDeclaration, herdadas: Set<string>, idsHerdados: Set<string> = new Set()) => {
    const corpo = fn.body
    if (!corpo) return
    const textoCorpo = corpo.getText()
    const confiaveis = new Set(herdadas) // variables whose content came from the database
    const idsConfiaveis = new Set<string>(idsHerdados) // id expressions proven to be in the caller's organization
    const chamadas: Chamada[] = []
    const funcoesInternas: ts.FunctionLikeDeclaration[] = []

    // Callback of `rows.map((row) => …)` over a database result: its parameters hold database data too
    const pai = fn.parent
    if (pai && ts.isCallExpression(pai) && pai.arguments[0] === fn) {
      const chamado = desembrulhar(pai.expression)
      if (chamado && ts.isPropertyAccessExpression(chamado) && ITERADORES.has(chamado.name.text) && confiaveis.has(raiz(chamado.expression.getText()))) {
        fn.parameters.slice(0, 1).forEach((p) => nomesLigados(p.name).forEach((n) => confiaveis.add(n)))
      }
    }

    const coletar = (n: ts.Node) => {
      if (n !== corpo && ehFuncao(n)) { funcoesInternas.push(n); return }
      const c = chamadaPrisma(n)
      if (c) chamadas.push(c)
      // `const x = await prisma…` / `x = await prisma…`: x holds database data
      if (ts.isVariableDeclaration(n) && n.initializer) {
        const ini = desembrulhar(n.initializer)
        const carregador = ini && ts.isCallExpression(ini) && ts.isIdentifier(ini.expression) && CARREGADORES.has(ini.expression.text)
        // `const [a, b] = await Promise.all([prisma…, prisma…])`
        const todasConsultas = !!ini && ts.isCallExpression(ini) && ini.expression.getText() === 'Promise.all' &&
          !!ini.arguments[0] && ts.isArrayLiteralExpression(ini.arguments[0]) &&
          ini.arguments[0].elements.every((e) => !!chamadaPrisma(desembrulhar(e)!))
        if (ini && (carregador || todasConsultas || chamadaPrisma(ini) || (ts.isCallExpression(ini) && /\$transaction/.test(ini.expression.getText())))) {
          nomesLigados(n.name).forEach((nome) => confiaveis.add(nome))
        } else if (ini && confiaveis.has(raiz(ini.getText())) && !ts.isObjectLiteralExpression(ini)) {
          nomesLigados(n.name).forEach((nome) => confiaveis.add(nome))
        }
      }
      if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isIdentifier(n.left)) {
        const dir = desembrulhar(n.right)
        if (dir && chamadaPrisma(dir)) confiaveis.add(n.left.text)
      }
      if (ts.isForOfStatement(n) && ts.isVariableDeclarationList(n.initializer) && confiaveis.has(raiz(n.expression.getText()))) {
        n.initializer.declarations.forEach((d) => nomesLigados(d.name).forEach((nome) => confiaveis.add(nome)))
      }
      ts.forEachChild(n, coletar)
    }
    // two passes so loop variables over results declared later in the walk are known
    coletar(corpo)
    chamadas.length = 0
    funcoesInternas.length = 0
    coletar(corpo)

    const idConfiavel = (modelo: string, valor: string): boolean => {
      const dentro = /^\{\s*(in|equals)\s*:\s*([\s\S]+?)\s*,?\s*\}$/.exec(valor) // { in: rows.map(r => r.id) }
      if (dentro) return idConfiavel(modelo, dentro[2])
      if (/^null\s*\?\?|\|\|\s*null$/.test(valor)) return idConfiavel(modelo, valor.replace(/^null\s*\?\?\s*|\s*\|\|\s*null$/g, ''))
      // the authenticated session is the caller themself
      if (/^session\??\.user\??\./.test(valor)) return true
      return idsConfiaveis.has(`${modelo}:${valor}`) || idsConfiaveis.has(`*:${valor}`) || confiaveis.has(valor) ||
        (/[.?[]/.test(valor) && confiaveis.has(raiz(valor))) || /^['"`]/.test(valor) || valor === 'undefined' || valor === 'null'
    }

    // Lookups that carry the organization, or whose result is compared with it, make their ids trusted
    for (const c of chamadas) {
      if (!LEITURA.has(c.op)) continue
      const onde = propriedade(c.arg, 'where')
      if (!onde || !ts.isPropertyAssignment(onde)) continue
      const w = desembrulhar(onde.initializer)
      if (!w || !ts.isObjectLiteralExpression(w)) continue
      const ids = escolhas(w)
      if (!ids.length) continue
      let seguro = temConta(w.getText())
      const decl = c.no.parent && ts.isAwaitExpression(c.no.parent) ? c.no.parent.parent : c.no.parent
      if (!seguro && decl && ts.isVariableDeclaration(decl) && ts.isIdentifier(decl.name)) {
        const v = decl.name.text
        const comparacao = new RegExp(
          `\\b${v}\\??\\.(\\w+\\??\\.)*organizationId\\s*[!=]==?\\s*[\\w.?]*(organizationId|orgId)\\b|` +
          `[\\w.?]*(organizationId|orgId)\\s*[!=]==?\\s*${v}\\??\\.(\\w+\\??\\.)*organizationId\\b`,
        )
        seguro = comparacao.test(textoCorpo)
      }
      if (seguro) {
        (c as Chamada & { segura?: boolean }).segura = true
        ids.forEach((i) => { idsConfiaveis.add(`${c.modelo}:${i.valor}`); idsConfiaveis.add(`*:${i.valor}`) })
      }
    }

    for (const c of chamadas) {
      if ((c as Chamada & { segura?: boolean }).segura) continue
      const linha = sf.getLineAndCharacterOfPosition(c.no.getStart()).line + 1
      if (/isolamento:/.test(linhas.slice(Math.max(0, linha - 4), linha).join('\n'))) continue
      const relatar = (motivo: string) => achados.push({ arquivo, linha, modelo: c.modelo, op: c.op, motivo })

      // Foreign keys written by create/update must point inside the organization too (linking a deal to another
      // organization's contact exposes that contact through the deal)
      const blocosDeDados = c.op === 'upsert' ? ['create', 'update'] : ['create', 'createMany', 'update', 'updateMany'].includes(c.op) ? ['data'] : []
      let chavesSuspeitas: string[] = []
      for (const bloco of blocosDeDados) {
        const dados = propriedade(c.arg, bloco)
        const d = dados && ts.isPropertyAssignment(dados) ? desembrulhar(dados.initializer) : undefined
        if (!d || !ts.isObjectLiteralExpression(d)) continue
        chavesSuspeitas = chavesSuspeitas.concat(d.properties.filter((p) => {
          const k = nomeDe(p)
          return chaveDeId(k) && !CHAVES_NEUTRAS.has(k!) && (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) && !idConfiavel(c.modelo, valorDe(p))
        }).map((p) => nomeDe(p)!))
      }
      if (chavesSuspeitas.length) {
        relatar(`chave estrangeira sem conferência: ${[...new Set(chavesSuspeitas)].join(', ')}`)
        continue
      }
      if (c.op === 'create' || c.op === 'createMany') continue

      const onde = propriedade(c.arg, 'where')
      if (!onde) continue
      let w: ts.Node | undefined
      if (ts.isPropertyAssignment(onde)) w = desembrulhar(onde.initializer)
      const nomeVariavel = ts.isShorthandPropertyAssignment(onde) ? onde.name.text : w && ts.isIdentifier(w) ? w.text : undefined
      if (nomeVariavel) {
        // `where` built in a variable: judge its declaration
        const decl = new RegExp(`(const|let|var)\\s+${nomeVariavel}\\b[^=]*=\\s*([\\s\\S]{0,600})`).exec(textoCorpo)
        if (decl && temConta(decl[2].split(/\n\s*\n/)[0])) continue
        relatar('where montado fora da chamada, sem conta visível')
        continue
      }
      // `where: escopoPipeline(acesso)`: a shared scope, which always carries the organization
      if (w && ts.isCallExpression(w) && /^escopo(Negocio|Pipeline|Tarefa|Projeto)$/.test(w.expression.getText())) continue
      if (!w || !ts.isObjectLiteralExpression(w)) {
        relatar('where não literal')
        continue
      }
      const ids = escolhas(w).filter((i) => !CHAVES_NEUTRAS.has(i.chave))
      // `{ ...baseWhere, … }`: judge the spread variable by its declaration
      const espalhadaComConta = w.properties.filter(ts.isSpreadAssignment).some((p) => {
        const decl = new RegExp(`(const|let|var)\\s+${p.expression.getText()}\\b[^=]*=\\s*([\\s\\S]{0,400})`).exec(textoCorpo)
        return !!decl && temConta(decl[2].split(/\n\s*\n/)[0])
      })
      if (!ids.length || temConta(w.getText()) || espalhadaComConta) continue
      if ((c.modelo === 'organization' || c.modelo === 'user') && ids.every((i) => /organizationId|orgId|session|userId|user\.id/.test(i.valor))) continue
      if (ids.every((i) => idConfiavel(c.modelo, i.valor))) continue
      // `{ id, taskId }` with a verified taskId: the conjunction pins the record under a verified parent (top level
      // only — a trusted key inside OR would not constrain anything)
      const noTopo = w.properties.filter((p) => chaveDeId(nomeDe(p)) && !CHAVES_NEUTRAS.has(nomeDe(p)!) && (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)))
      if (noTopo.some((p) => nomeDe(p) !== 'id' && idConfiavel(c.modelo, valorDe(p)))) continue
      relatar(`busca por ${ids.map((i) => i.chave).join(', ')} sem conta`)
    }

    // inner functions (callbacks, inline server actions) close over what this one already proved
    funcoesInternas.forEach((f) => analisarFuncao(f, confiaveis, idsConfiaveis))
  }

  const visitar = (n: ts.Node) => {
    if (ehFuncao(n)) { analisarFuncao(n, new Set()); return }
    ts.forEachChild(n, visitar)
  }
  visitar(sf)
  return achados
}

/** Checks a single source text (used by the fixtures). */
export function varrerCodigo(arquivo: string, codigo: string): Achado[] {
  return analisarArquivo(arquivo, codigo)
}

/** Walks the app's server code. */
export function varrer(raizProjeto: string, pastas = ['app', 'lib', 'components']): Achado[] {
  const arquivos: string[] = []
  const andar = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) { if (!['node_modules', '__tests__', '.next'].includes(e.name)) andar(p) }
      else if (/\.(ts|tsx)$/.test(e.name) && !/\.(test|spec)\./.test(e.name)) arquivos.push(p)
    }
  }
  pastas.forEach((d) => andar(path.join(raizProjeto, d)))
  return arquivos.flatMap((f) => {
    const codigo = fs.readFileSync(f, 'utf8')
    if (!/\b(prisma|prismaWa|tx|db)\./.test(codigo)) return []
    return analisarArquivo(path.relative(raizProjeto, f).replace(/\\/g, '/'), codigo.replace(/\r\n/g, '\n'))
  })
}
