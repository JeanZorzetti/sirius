# Contrato — `scripts/audit-dead-code.js`

**Feature**: `002-remove-dead-code` | **Atende**: FR-004, FR-023, FR-024 | **História**: US0

O scanner é a interface pela qual esta feature é medida e pela qual a causa raiz deixa de se repetir. Ele tem dois consumidores com necessidades diferentes: **pessoa** (quer a lista) e **CI** (quer um código de saída).

## Estado atual (verificado 2026-08-22)

```
node scripts/audit-dead-code.js
```

Imprime duas seções (`ARQUIVOS SEM IMPORTADOR`, `ROTAS DE API SEM CHAMADOR`) e o total de linhas removíveis. **Sai sempre com código 0.** Allowlists implícitas: o `Set` `SKIP` (diretórios, inclui `public/`) e a regex `EXTERNAL` (webhooks, cron, auth, mcp, og, sitemap, robots, health, openapi). As três rotas com chamador externo confirmado não estão em nenhuma das duas — foram anotadas à mão no documento da auditoria.

## Contrato alvo

### Modo relatório (padrão, inalterado)

```
node scripts/audit-dead-code.js
```

| | |
|---|---|
| Saída | idêntica à atual, com uma linha a mais por item ignorado pela allowlist, marcada como tal |
| Código de saída | `0` sempre |

Compatibilidade é requisito: o comando sem flag continua sendo o que se roda antes e depois de cada PR (FR-004), e a comparação dos dois números precisa ser possível.

### Modo verificação (novo)

```
node scripts/audit-dead-code.js --check
```

| | |
|---|---|
| Saída | a mesma do modo relatório |
| Código de saída | `0` se não houver nenhum item fora da allowlist; `1` caso contrário |
| Mensagem em falha | lista dos itens que causaram a falha, seguida da instrução de apagar o código ou justificar a entrada na allowlist |

Sem argumento posicional. Sem outras flags. Ninguém pediu `--json`, `--fix` nem filtro por diretório.

## Allowlist — `scripts/dead-code-allowlist.json`

Formato em [data-model.md](../data-model.md#scriptsdead-code-allowlistjson-novo-us0).

- Toda entrada tem `path` e `reason`. Entrada sem `reason` faz o scanner falhar com erro de formato, nos dois modos — a razão é o ponto do arquivo.
- `files` nasce vazio e permanece vazio ao fim da US3.
- A regex `EXTERNAL` continua existindo para as classes inteiras (webhooks, cron, auth). A allowlist é para as **exceções nominais**, que são as que carregam história e por isso precisam de motivo escrito.

## Integração com a CI

Job novo em `.github/workflows/ci.yml`, sem `needs` (roda em paralelo com lint e typecheck; não depende de Prisma nem de build):

| Etapa | Comando |
|---|---|
| US0 → fim da US3 | `node scripts/audit-dead-code.js` (relatório; job não bloqueia) |
| A partir da US3 | `node scripts/audit-dead-code.js --check` (bloqueia o PR) |

O bloqueio é ligado **quando a lista chega a zero**, não antes: um gate que reprova por design durante quatro PRs ensina o time a ignorá-lo.

## Verificação do próprio gate (SC-006)

O gate só está provado quando falha de propósito. PR de teste, descartado depois:

1. Apagar uma página que seja a única consumidora de uma rota de API.
2. Abrir o PR.
3. Esperado: o job do scanner reprova, nomeando a rota que ficou sem chamador.

É a reprodução exata do commit `2d29773`. Se este teste não reprovar, a FR-023 não está entregue — independentemente de o job existir e estar verde.

## Limites conhecidos (não são bugs)

- Caminho de `import()` montado por template string não é resolvido. Nenhum caso no repositório hoje.
- Referência em Markdown não conta como chamador — decisão deliberada: documentação não executa código.
- Chamador fora do repositório (app Capacitor, service worker, cron externo) depende da allowlist. Antes de apagar rota, procurar no repositório do app móvel e em `public/`.
