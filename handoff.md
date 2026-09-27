# Handoff: degrau 4 do mapa GSC (posição) executado (2026-09-26)

## Estado em uma linha
As três alavancas do degrau "4 · Posição" do `hub.roilabs.com.br/gsc/mapa/sirius` foram executadas, publicadas e
marcadas como feitas (Jean, reler em 10/10/2026). O handoff anterior (crm-review, 25/09) continua valendo e está em
`git show 4105463d:handoff.md`.

## Feito nesta sessão
- **Links internos** (`91a1b759`): 15 links contextuais em 10 posts com tráfego, para as páginas dos termos
  monitorados. Crawl do hub no mesmo dia: energia-solar 1 → 7 links contextuais, representantes 2 → 9,
  `/followup` 0 → 6, estratégias de WhatsApp 3 → 6. Os dois posts EN em striking distance (agaas 7,4 e evolution api
  8,6) passaram a se linkar.
- **Cobertura** (`33bb2551`): `/followup` lidera com "Automação de Follow-up" (título de 510 px, com modificador) e
  ganhou a seção com os gatilhos e ações reais de `lib/automations`. Energia-solar ganhou 3 perguntas de FAQ (PT e EN)
  para "crm energia" e "crm para indústria energética", mais o campo opcional `lastModified` em `config/niche-data.ts`,
  que vira `dateModified` só quando o conteúdo foi revisado.
- **Frescor** (`05ae31c2`, `aa9f68f6`): 39 → 9 páginas vencidas.
  - Os 4 comparativos (vs Pipedrive, vs HubSpot, vs RD Station, alternativas ao Pipedrive) e o guia de CRM com
    WhatsApp foram reescritos com os planos que cada fornecedor publicava em 26/09/2026.
  - Outros 7 posts tiveram os fatos de plano corrigidos.
  - A central de ajuda tinha `2024-01-23` em vez de `2026-01-23`, a data do commit `6e25f669`. O artigo de planos
    descrevia o modelo antigo FREE/PRO.
  - `dateModified` só mudou onde o conteúdo mudou.
- **Tela** (`4105463d`): os botões do hero de `/followup` estouravam 22 px em 360 px; ganharam `flex-wrap`.

## Fatos de plano usados (fonte: `lib/entitlements.ts` e `/pricing`)
- **Gratuito**: 2 usuários, 250 contatos, 100 negócios não arquivados, 1 funil, sem automação, sem IA e sem WhatsApp.
- **Starter** R$ 67: 5 usuários, automação e IA.
- **Pro** R$ 147: 15 usuários.
- **Business** R$ 397: 50 usuários e WhatsApp.
- O teste é de 7 dias do Pro. O WhatsApp conecta só pela API oficial (WABA); a conexão por QR foi descontinuada.
- Não existe módulo de comissões.

## Decisão aberta (do dono)
- **Plano gratuito.** A `/pricing` diz "Grátis para sempre" com os limites acima. O código deixa a conta Free somente
  leitura quando o teste de 7 dias acaba (`isReadOnly` em `lib/entitlements.ts`, desde `43572487`), e a tela de
  cobrança mostra "Trial expirado — conta em modo somente leitura".
  - Os posts seguem a `/pricing`. O artigo de ajuda de planos documenta o comportamento do produto.
  - Decidir qual dos dois vale e alinhar o outro: `grep -rn "2 usuários, 250 contatos"` acha os textos.

## Próximos passos (em ordem)
1. **10/10/2026**: reler o degrau 4 no mapa. Cobertura e penetração no Top 3 dependem de o Google reindexar.
2. **Reescrever `lib/blog/posts/crm-gratuito-brasil-2026.ts`.** Ele elege o Sirius como "melhor gratuito" por ter
   WhatsApp e IA no plano Free, e diz que só o Sirius tem WhatsApp grátis. Nada disso vale hoje: RD Station Free tem
   WhatsApp para 4 usuários e o Agendor grátis aceita 3 usuários e 10 mil contatos.
3. **9 páginas ainda vencidas**: funil, automação, KPIs, prospecção, SPIN, BANT/MEDDIC, scraping, CRM simples e
   melhores práticas. São guias de método sem preço do Sirius. Revisá-las é atualizar estatística e exemplo, não
   trocar a data.
4. O crawl do hub só lê as páginas PT. Os links EN desta sessão não aparecem no mapa.

## Gotchas
- Os posts são HTML dentro de template literal TS. A cópia de trabalho está em CRLF e o repo em LF. Edição por
  substituição exata precisa respeitar o CRLF.
- Os preços de concorrentes vencem. Todos os comparativos dizem "conferido em 26/09/2026"; reconferir antes de mexer.
- O Pipedrive cobra por usuário em dólar e automação só a partir do Growth. O HubSpot Free atende 2 usuários e tem
  a IA Breeze. O Moskit agora se chama Ollow e cobra por conversas.
