# Roadmap — Responsividade Mobile Estado da Arte 2026

**Objetivo:** elevar o Sirius CRM do estado "responsivo passivo" (elementos que encolhem) para **experiência adaptativa, contextual e offline-first**, seguindo o padrão ouro de 2026.

**Filosofia orientadora:** o usuário móvel é um vendedor em campo segurando o celular com uma mão. Cada tela deve responder a essa restrição física, aproveitar os recursos nativos do aparelho e eliminar digitação sempre que possível.

---

## Baseline — Estado Atual (Auditoria)

### ✅ Já implementado
| Item | Local |
|---|---|
| Drawer lateral mobile (hamburger) | [mobile-nav.tsx](../components/dashboard/mobile-nav.tsx) |
| Layout com breakpoint `lg:` (sidebar desktop vs drawer mobile) | [dashboard/layout.tsx](../app/[locale]/dashboard/layout.tsx) |
| Dark mode via `next-themes` | [theme-provider.tsx](../components/theme-provider.tsx) |
| PWA manifest + service worker | [public/manifest.json](../public/manifest.json), [public/sw.js](../public/sw.js) |
| Shell nativo via Capacitor (Android/iOS) | [capacitor.config.ts](../capacitor.config.ts) |
| Push notifications (FCM/APNs + web fallback) | [lib/mobile/push.ts](../lib/mobile/push.ts) |
| Offline queue com Capacitor Preferences | [lib/mobile/offline.ts](../lib/mobile/offline.ts) |
| GPS check-in | [lib/mobile/checkin.ts](../lib/mobile/checkin.ts) |
| OCR de cartão de visita (Tesseract) | [lib/mobile/ocr.ts](../lib/mobile/ocr.ts) |
| Chat com toggle list↔conversation mobile | [chat-interface.tsx](../components/chat/chat-interface.tsx) |
| Kanban com colunas adaptáveis (w-[260px] sm:w-[300px]) | [kanban-board.tsx](../components/kanban-board.tsx) |

### ❌ Lacunas identificadas
- **Navegação:** só existe drawer (hamburger no topo). Sem **bottom navigation bar** — padrão obrigatório 2026 (thumb zone).
- **Tabelas:** `components/contacts/data-table.tsx` usa `overflow-x-auto` → scroll horizontal no mobile (anti-padrão).
- **Sem gestos:** nenhum swipe-to-action (no kanban, lista de contatos, conversas).
- **Sem voz→texto:** zero integração com Web Speech API ou Whisper.
- **Sem copiloto IA móvel:** AgiChatSidebar existe, mas não tem entrada rápida por voz / comandos naturais.
- **Modais/Dialogs:** `edit-deal-dialog.tsx` é um Dialog desktop — no mobile deveria ser **bottom sheet** fullscreen.
- **Notificações push não-acionáveis:** push existe, mas sem botões de ação (Ligar / WhatsApp) diretamente no aviso.
- **Mapa de leads por proximidade:** GPS existe pra check-in, mas não sugere leads próximos.
- **Performance mobile:** sem auditoria de LCP/FID móvel, componentes pesados carregados eagerly.
- **Thumb-friendly spacing:** botões/touch targets não seguem sistematicamente o mínimo de 44px iOS/48dp Android.
- **Haptic feedback:** Capacitor Haptics não é usado em ações críticas (drag, save, erro).
- **Formulários longos:** deal creation, contact create, register são longos demais em tela pequena.

---

## Arquitetura do Roadmap

**6 fases quinzenais** agrupadas em 3 frentes paralelas:

| Frente | Conteúdo |
|---|---|
| 🎨 **UX/Layout** | Bottom nav, cards expansíveis, bottom sheets, gestos, thumb zone |
| ⚡ **Performance & Offline** | PWA offline-first real, lazy loading, skeleton loaders |
| 🧠 **Cognitivo** | Voz→texto, copiloto mobile, push acionáveis, leads próximos |

---

## Fase 1 — Fundação Mobile (Dias 1–14)

**Meta:** toda tela principal atende thumb zone e não tem scroll horizontal.

### Sprint 1.1 — Bottom Navigation + Touch Targets
- Criar `components/dashboard/bottom-nav.tsx` com 5 itens principais (Pipeline, Contatos, Chat, Agenda, Mais).
- Item "Mais" abre bottom sheet com os itens secundários (atualmente em `mobile-nav.tsx`).
- Posicionamento `fixed bottom-0`, height 56px, safe-area-inset-bottom para iPhone notch.
- Visível apenas em `lg:hidden`, com active state destacado em `indigo-500`.
- Ajustar `dashboard/layout.tsx` para adicionar `pb-16` no `<main>` quando bottom nav ativo.
- Auditoria global: todos os botões e links de ação devem ter `min-h-[44px]` e `min-w-[44px]` em viewports `<lg`.

### Sprint 1.2 — Cards Expansíveis em Tabelas
- Criar `components/ui/responsive-table.tsx`: renderiza `<table>` em `md:` e **grid de cards** em `sm`.
- Cada card mostra: avatar/ícone, título, 1 campo secundário, badge de status. Tap expande inline mostrando campos restantes.
- Substituir `components/contacts/data-table.tsx` pela versão responsiva — manter colunas atuais em desktop, cards no mobile.
- Aplicar mesmo padrão em: `analytics` tabelas, `deals` lista, `prospecting` resultados.
- **Remover todos os `overflow-x-auto`** de tabelas em viewports mobile.

**✓ Entregável Fase 1:** 100% do dashboard navegável com o polegar, zero scroll horizontal em `< md`.

---

## Fase 2 — Dialogs, Gestos e Micro-interações (Dias 15–28)

**Meta:** modais viram bottom sheets nativos, gestos substituem menus.

### Sprint 2.1 — Bottom Sheets
- Criar `components/ui/responsive-dialog.tsx`: wrapper que renderiza `Dialog` em desktop e **`Sheet` (side="bottom")** em mobile via shadcn.
- Sheet mobile: altura dinâmica, drag handle no topo, `max-h-[90vh]` com scroll interno.
- Migrar dialogs críticos:
  - `components/deals/edit-deal-dialog.tsx` — bottom sheet fullscreen no mobile
  - `components/deals/create-deal-dialog.tsx` — idem
  - `components/contacts/import-contacts-dialog.tsx`
  - `components/chat/new-connection-dialog.tsx`
- Adicionar `env(safe-area-inset-bottom)` no padding final do sheet.

### Sprint 2.2 — Gestos no Kanban e Listas
- Instalar `@use-gesture/react` (não-Capacitor, funciona em PWA também).
- **Kanban mobile:** swipe horizontal em card move para stage anterior/próximo (fallback ao drag-and-drop que exige duas mãos).
- **Lista de contatos:** swipe direita → "Ligar" (abre `tel:`), swipe esquerda → "WhatsApp" (abre chat).
- **Lista de conversas:** swipe direita → marcar como lida, swipe esquerda → arquivar.
- Adicionar haptic feedback via `@capacitor/haptics` (Light Impact) em cada threshold de gesto.
- Fallback: long-press abre action menu tradicional para quem não descobrir o gesto.

### Sprint 2.3 — Micro-motion Premium
- Instalar `framer-motion` (se ainda não estiver).
- Aplicar `layout` animations ao kanban (card muda de coluna com animação suave).
- Skeleton loaders em todas as telas — substituir spinners atuais por componentes shape-matching.
- Transições de página via `AnimatePresence` no `<main>` do dashboard layout.
- Hover states em desktop, tap highlights em mobile (`active:scale-[0.98]`).

**✓ Entregável Fase 2:** modais nativos no mobile, 3 gestos principais, feedback tátil em ações críticas.

---

## Fase 3 — Performance & Offline-First Real (Dias 29–42)

**Meta:** LCP mobile < 2s, funciona 100% offline em ações críticas.

### Sprint 3.1 — Auditoria e Otimização
- Lighthouse mobile em 5 páginas-chave: `/dashboard`, `/dashboard/chat`, `/dashboard/contacts`, `/dashboard/analytics`, `/dashboard/agenda`.
- Meta: **todas com Performance ≥ 90 no mobile**.
- Identificar e lazy-load todos os componentes acima de 50KB (charts, editores, AGI sidebar).
- Converter imagens estáticas para `next/image` com `sizes` correto.
- Remover JS não-usado via `@next/bundle-analyzer`.
- Preload crítico: fonte principal, CSS above-the-fold.

### Sprint 3.2 — Offline-First Expandido
- Expandir `lib/mobile/offline.ts` para cobrir:
  - `UPDATE_CONTACT`, `DELETE_DEAL`, `CREATE_NOTE`, `SEND_MESSAGE` (chat), `CREATE_TASK`.
- Criar `lib/mobile/offline-cache.ts` com IndexedDB (via `idb`) para cachear:
  - Últimas 50 conversas do chat
  - Top 100 contatos do usuário
  - Deals do pipeline ativo
  - Produtos e pipelines (dados quase-estáticos)
- Service Worker: estratégia `NetworkFirst` para API, `CacheFirst` para assets, `StaleWhileRevalidate` para imagens.
- Indicador visual offline: banner amarelo sutil quando detectado + badge "pendente" em ações enfileiradas.
- Fila de sync com retry exponencial e toast de sucesso quando voltar online.

### Sprint 3.3 — Push Acionáveis
- Implementar `actions` no payload de push notifications (`lib/mobile/push.ts`).
- Templates acionáveis:
  - "Cliente X abriu sua proposta" → [📞 Ligar] [💬 WhatsApp]
  - "Deal parado há 3 dias" → [👀 Ver] [✅ Concluir]
  - "Nova mensagem no chat" → [💬 Responder] (inline reply onde suportado)
- Handler no `NativeInitializer` para routear cada action ID.

**✓ Entregável Fase 3:** Lighthouse ≥ 90 mobile, app funcional offline por até 1h, notificações com botões diretos.

---

## Fase 4 — Responsividade Cognitiva (Dias 43–56)

**Meta:** eliminar digitação manual em ações frequentes.

### Sprint 4.1 — Voz → Texto (Zero-Touch Data Entry)
- Criar `lib/mobile/voice.ts` usando `Web Speech API` (gratuita, on-device em Chrome/Safari) + fallback para Whisper API (Groq) quando precisão for crítica.
- Novo botão flutuante: **"🎙️ Ditar nota"** em deals, contatos e chat.
- Pipeline:
  1. Usuário pressiona e segura botão (push-to-talk)
  2. Transcrição em tempo real
  3. Ao soltar, envia texto transcrito para Groq com prompt estruturado: "extraia intenção, extraia entidades, formate como nota de CRM"
  4. Preenche automaticamente os campos relevantes
- Exemplo: `"Mude o cliente Marco da M2 para negociação e agende um retorno na sexta"` → atualiza stage + cria task.
- Criar endpoint `/api/ai/voice-command` que recebe transcript e retorna `{ action, params }`.

### Sprint 4.2 — Copiloto Mobile (AGI Chat Otimizado)
- Refatorar `AgiChatSidebar` para ter modo mobile: fullscreen bottom sheet com input na parte inferior (thumb zone).
- Atalhos rápidos pré-definidos visíveis acima do input:
  - "Minhas tarefas de hoje"
  - "Deals parados"
  - "Clientes próximos"
  - "Última conversa com [contato]"
- Input grande (h-12), botão de microfone ao lado do send.
- Respostas com cards acionáveis (ex: lista de deals com botão Ligar inline).

### Sprint 4.3 — Geolocalização Contextual
- Expandir `lib/mobile/checkin.ts` com função `getNearbyLeads(radius)`.
- Criar página `/dashboard/nearby`: mapa (Mapbox ou Google Maps) com pins dos contatos próximos do GPS atual.
- Botão "Traçar rota" em cada pin → abre Google Maps / Waze nativo via intent.
- Sugestão proativa: ao detectar GPS em movimento + horário comercial, notificação "Há 3 leads na sua região agora".
- Requer adicionar `latitude`/`longitude` opcionais no modelo `Contact` (migration).

**✓ Entregável Fase 4:** voz→ação funcional em deals, copiloto mobile fullscreen, mapa de leads próximos.

---

## Fase 5 — Omnicanal Mobile & Integração Hardware (Dias 57–70)

**Meta:** WhatsApp + chamadas + câmera integrados de forma invisível.

### Sprint 5.1 — WhatsApp One-Click
- Auditoria: todo lugar que mostra um telefone deve ter botão direto pro WhatsApp CRM interno (não wa.me).
- Em `edit-deal-dialog.tsx`, `contact-card`, `chat-interface`, `agenda`: botões padronizados `CallButton` e `WhatsAppButton`.
- Clicar no botão WhatsApp no mobile: navega direto pra `/dashboard/chat?phone=X` com conversa aberta.
- Se conversa não existir, cria automaticamente e abre.

### Sprint 5.2 — Câmera Nativa
- Já temos OCR de cartão de visita — melhorar UX:
  - Botão "Novo contato por cartão" mais visível na lista de contatos
  - Pré-visualização da leitura + correção manual antes de salvar
- Adicionar: "Tirar foto do produto" em deals (campo de mídia no Deal, upload para MinIO existente).
- Adicionar: "Foto do local" em check-ins (visits).
- Usar `@capacitor/camera` no app nativo + `input[capture]` no PWA.

### Sprint 5.3 — Telefonia Direta
- Cada contato: botão `tel:` nativo (já existe, mas tornar primário).
- Registro automático de ligação: ao abrir link `tel:`, criar uma Activity log no contato com timestamp.
- No mobile nativo: usar `@capacitor/communication` para detectar término da chamada e perguntar "Deseja anotar o que foi falado?" → abre o ditado por voz (sprint 4.1).

**✓ Entregável Fase 5:** zero cópia-e-cola de telefones, câmera integrada em 3 fluxos, registro automático de ligações.

---

## Fase 6 — Polimento, QA Mobile e Go-Live (Dias 71–84)

**Meta:** qualidade de produção em 3 devices reais (iPhone, Android mid-range, tablet).

### Sprint 6.1 — QA em Dispositivos Reais
- Lista de QA em cada device: login, cadastro (native + Google), criar deal, mover kanban, enviar mensagem, voz→deal, offline → online sync, push notification, check-in.
- Testes de performance: medir FPS durante drag no kanban, scroll em listas longas.
- Testes de acessibilidade: VoiceOver (iOS) e TalkBack (Android) funcionais.
- Corrigir bugs descobertos; priorizar regressões.

### Sprint 6.2 — Documentação e Onboarding Mobile
- Tour guiado mobile na primeira abertura: mostrar bottom nav, gestos, voz, copiloto.
- Atualizar [MOBILE_APP_SETUP.md](MOBILE_APP_SETUP.md) com novos recursos.
- Screenshots mobile atualizados em `docs/PWA_SCREENSHOTS.md`.
- Criar `docs/MOBILE_UX_PATTERNS.md` documentando decisões de design (thumb zone, gestos, bottom sheets) para futuros devs.

### Sprint 6.3 — Release
- Build Android (APK + AAB) via Capacitor → Play Store internal testing.
- Build iOS (IPA) via Xcode → TestFlight.
- Release notes destacando: voz, offline, bottom nav, gestos.
- Feature flag: permitir reverter pro layout antigo nos primeiros 7 dias caso dê bug crítico.
- Monitoramento: adicionar eventos PostHog em `voice_command_used`, `offline_action_queued`, `swipe_gesture_used` para medir adoção.

**✓ Entregável Fase 6:** app publicado nas stores, documentação completa, telemetria ativa.

---

## Princípios de Execução

1. **Mobile-first em cada PR.** Cada componente novo começa em 375×812 (iPhone SE) e só depois ganha breakpoints `md:` e `lg:`.
2. **Nunca `overflow-x-auto` em tabelas.** Sempre cards no mobile.
3. **Touch target mínimo 44×44 px.** Auditar no DevTools.
4. **Semantic colors only.** `bg-primary`, `text-muted-foreground`, nunca hex mágico.
5. **Sem loaders spinning.** Skeleton loaders que espelhem o shape do conteúdo.
6. **Haptic + micro-motion em ações destrutivas.** Deletar um deal dá um Impact Medium.
7. **Acessibilidade obrigatória.** `aria-label` em ícones, contraste AA mínimo, navegação por teclado funcional.

---

## KPIs de Sucesso

| Métrica | Meta |
|---|---|
| Lighthouse Performance (mobile) | ≥ 90 nas 5 telas-chave |
| Lighthouse Accessibility (mobile) | = 100 |
| LCP mobile | < 2.0s |
| FID mobile | < 100ms |
| CLS mobile | < 0.1 |
| % de deals criados sem digitação (voz/OCR) | ≥ 20% (após 30 dias de adoção) |
| % de ações executadas offline | ≥ 5% |
| Crash rate mobile | < 0.5% |
| Retention D7 mobile | +15% vs baseline |

---

## Dependências Técnicas a Adicionar

```json
{
  "@use-gesture/react": "^10",
  "@capacitor/haptics": "^6",
  "@capacitor/camera": "^6",
  "@capacitor/communication": "^1",
  "idb": "^8",
  "framer-motion": "^11"
}
```

---

## Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Gestos novos confundem usuários antigos | Tour guiado + fallback long-press + feature flag |
| Voz→ação falha em áreas barulhentas | Sempre mostrar transcript antes de commit; botão "editar" |
| Offline sync com conflito (mesmo deal editado em 2 devices) | Last-write-wins + log de conflito no admin |
| Bottom nav quebra layouts legados | Rollout gradual por página, testar com PostHog feature flag |
| Performance degrada com framer-motion | Usar `layout` animations apenas em containers pequenos (kanban cards) |

---

*Sirius CRM — Roadmap revisado em abril/2026*
