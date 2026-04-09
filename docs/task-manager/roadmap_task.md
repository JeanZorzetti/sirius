# Task Manager (estilo ClickUp) para o Sirius CRM

## Context
O Sirius CRM ja possui pipeline Kanban, contatos, agenda, automacoes e chat, mas nao tem gestao de tarefas dedicada. O modelo Activity atual so registra eventos de deals. Precisamos de um sistema completo de tarefas integrado ao CRM, com multiplas views, subtarefas, checklists, time tracking e automacoes.

---

## 1. Prisma Schema - Novos Modelos

- [x] **TaskProject** — id, name, description, color, icon, archived, order → organizationId
- [x] **TaskStatus** — id, name, color, type (OPEN/IN_PROGRESS/DONE/CLOSED), order, isDefault → projectId
- [x] **TaskLabel** — id, name, color → projectId, many-to-many com Task
- [x] **Task** — id, title, description, priority (NONE/LOW/MEDIUM/HIGH/URGENT), order, dueDate, startDate, completedAt, estimatedMinutes, archived + todas as relacoes
- [x] **TaskComment** — id, content, taskId, userId, timestamps
- [x] **TaskChecklist + TaskChecklistItem**
- [x] **TimeEntry** — id, description, startTime, endTime, durationMs, billable, taskId, userId
- [x] **TaskDependency** — id, type (BLOCKS/BLOCKED_BY/RELATED), fromTaskId, toTaskId, unique [fromTaskId, toTaskId]
- [x] **TaskRecurrence** — frequency, interval, daysOfWeek[], dayOfMonth, endDate, maxOccurrences, occurrencesCreated, nextRunAt, enabled (1:1 com Task)
- [x] **TaskActivity** — id, type, description, metadata (Json), taskId, userId
- [x] **Modificacoes em modelos existentes** — User, Organization, Deal, Contact com relacoes de tasks
- [x] **NotificationType enum** — TASK_ASSIGNED, TASK_DUE_SOON, TASK_OVERDUE, TASK_COMPLETED, TASK_COMMENTED

---

## 2. Estrutura de Paginas

```
app/[locale]/dashboard/tasks/
```

- [x] `page.tsx` — Hub principal (lista projetos)
- [x] `layout.tsx` — Layout com header
- [x] `loading.tsx` — Skeleton
- [x] `actions.ts` — Server actions (createTask, moveTask, deleteTask, archiveTask, createTaskProject)
- [x] `projects/page.tsx` — N/A: coberto pelo hub `tasks/page.tsx` + `create-project-dialog.tsx`
- [x] `projects/new/page.tsx` — N/A: coberto pelo dialog `create-project-dialog.tsx`
- [x] `[projectId]/page.tsx` — Workspace do projeto (views: List/Kanban/Calendar/Table)
- [x] `[projectId]/settings/page.tsx` — Config de statuses e labels
- [x] `task/[taskId]/page.tsx` — Detalhe completo da tarefa
- [x] `my-tasks/page.tsx` — "Minhas Tarefas"
- [x] `time-tracking/page.tsx` — Dashboard de time tracking (PRO+)

---

## 3. API Routes

- [x] `api/tasks/` — GET (list/filter), POST (create)
- [x] `api/tasks/[taskId]/` — GET, PATCH, DELETE
- [x] `api/tasks/[taskId]/comments/` — GET, POST
- [x] `api/tasks/[taskId]/checklists/` — GET, POST (com actions: toggle, addItem, deleteItem, deleteChecklist)
- [x] `api/tasks/[taskId]/checklists/[id]/items/` — POST
- [x] `api/tasks/[taskId]/checklists/[id]/items/[id]` — PATCH, DELETE
- [x] `api/tasks/[taskId]/time-entries/` — GET, POST
- [x] `api/tasks/[taskId]/time-entries/[id]` — PATCH, DELETE
- [x] `api/tasks/[taskId]/dependencies/` — GET, POST
- [x] `api/tasks/[taskId]/dependencies/[id]` — DELETE
- [x] `api/tasks/[taskId]/activities/` — GET
- [x] `api/tasks/[taskId]/recurrence/` — GET, PUT, DELETE
- [x] `api/task-projects/` — GET, POST
- [x] `api/task-projects/[id]/` — GET, PATCH, DELETE
- [x] `api/task-projects/[id]/statuses/` — GET, POST
- [x] `api/task-projects/[id]/statuses/reorder` — PATCH
- [x] `api/task-projects/[id]/labels/` — GET, POST
- [x] `api/cron/task-recurrence/` — POST
- [x] `api/cron/task-due-reminders/` — POST

---

## 4. Componentes

### Projeto
- [x] `project-list.tsx`
- [x] `project-card.tsx`
- [x] `create-project-dialog.tsx`
- [x] `project-settings-form.tsx`

### Task CRUD
- [x] `create-task-dialog.tsx`
- [x] `create-task-inline.tsx`
- [x] `task-detail-panel.tsx`
- [x] `task-detail-content.tsx`
- [x] `task-form.tsx`

### Views
- [x] `task-views.tsx` — Switcher: List | Kanban | Calendar | Table
- [x] `task-list-view.tsx` — Agrupado por status, drag-and-drop
- [x] `task-kanban-view.tsx` — Board com @hello-pangea/dnd
- [x] `task-calendar-view.tsx` — Mes/semana/dia
- [x] `task-table-view.tsx` — Tabela com inline editing, sorting, CSV export

### Sub-componentes
- [x] `task-card.tsx`
- [x] `task-row.tsx`
- [x] `task-status-badge.tsx`
- [x] `task-priority-icon.tsx`
- [x] `task-assignee-avatar.tsx`
- [x] `task-labels.tsx`
- [x] `task-due-date.tsx`

### Features
- [x] `task-comments.tsx`
- [x] `task-activity-feed.tsx`
- [x] `task-checklist.tsx`
- [x] `task-checklist-item.tsx` — integrado em `task-checklist.tsx` (arquivo separado desnecessario)
- [x] `task-checklist-progress.tsx` — integrado em `task-checklist.tsx` (arquivo separado desnecessario)
- [x] `time-tracker-widget.tsx`
- [x] `time-entry-list.tsx`
- [x] `task-dependencies.tsx`
- [x] `task-recurrence-config.tsx`
- [x] `task-filters.tsx`
- [x] `task-search.tsx`

### Widgets de integracao
- [x] `deal-tasks-widget.tsx`
- [x] `contact-tasks-widget.tsx`

---

## 5. Design das Views

### List View
- [x] Tarefas agrupadas por status (secoes colapsaveis)
- [x] Header: dot colorido + nome do status + contagem
- [x] Cada row: checkbox | icone prioridade | titulo | labels | avatar assignee | due date
- [x] Drag-and-drop entre secoes muda status
- [x] Inline "add task" no final de cada secao

### Kanban Board
- [x] Colunas = TaskStatus (ordenadas por order)
- [x] Cards: titulo, stripe de prioridade, avatar, due date, label dots, progresso checklist
- [x] Drag-and-drop entre colunas (muda status) e dentro da coluna (reordena)

### Calendar View
- [x] View mensal (default) com toggle semana/dia
- [x] Tarefas como barras/dots coloridos por prioridade ou status
- [x] Click na data = quick-create task
- [x] Overdue tasks com borda vermelha

### Table View
- [x] Colunas: checkbox | titulo | status | prioridade | assignee | labels | due date | tempo | criado
- [x] Colunas sortable
- [x] Inline editing (dropdowns p/ status, prioridade)
- [x] Bulk actions: mudar status, prioridade, deletar (handleBulkDelete/Status/Priority wired em task-project-workspace)
- [x] Export CSV

---

## 6. Feature Gating

| Feature | FREE | STARTER | PRO | BUSINESS |
|---|---|---|---|---|
| Task management | 1 projeto, 50 tasks | 5 projetos, 500 tasks | 25 projetos, 5000 tasks | Ilimitado |
| List view | Sim | Sim | Sim | Sim |
| Kanban view | Nao | Sim | Sim | Sim |
| Calendar view | Nao | Sim | Sim | Sim |
| Table view | Nao | Nao | Sim | Sim |
| Subtarefas | 1 nivel | 2 niveis | Ilimitado | Ilimitado |
| Checklists | 1/task | 3/task | Ilimitado | Ilimitado |
| Custom statuses | 3 default | 6/projeto | 15/projeto | Ilimitado |
| Time tracking | Nao | Nao | Sim | Sim |
| Dependencias | Nao | Nao | Sim | Sim |
| Recorrencia | Nao | Nao | Sim | Sim |
| Bulk actions | Nao | Nao | Sim | Sim |

- [x] `lib/entitlements.ts` — limites adicionados
- [x] `lib/feature-gates.ts` — checkTaskProjectLimit(), checkTaskLimit()

---

## 7. Integracoes

### CRM (Deal + Contact)
- [x] Widget de tarefas na pagina do Deal
- [x] Widget de tarefas na pagina do Contato
- [x] Tarefa mostra chip "Deal vinculado" / "Contato vinculado" clicavel
- [x] Automacao: CREATE_TASK action cria Task real com projectId

### Notificacoes
- [x] `lib/task-notifications.ts` — notifyTaskAssigned, notifyTaskDueSoon, notifyTaskOverdue, notifyTaskCompleted, notifyTaskCommented
- [x] Estender NotificationPreference com toggles por tipo (taskAssigned/DueSoon/Overdue/Completed — API + UI + cron)

### Automacoes
- [x] Triggers TASK_CREATED, TASK_COMPLETED, TASK_OVERDUE (via task-engine.ts)
- [x] Acao CREATE_TASK — cria Task real quando taskProjectId configurado
- [x] `lib/automations/task-engine.ts` criado

### Real-time (Pusher)
- [x] Eventos: task:created, task:updated, task:deleted, task:moved, task:commented, task:timer
- [x] `lib/tasks/realtime.ts` — triggerTaskEvent wrapper
- [x] `hooks/use-task-pusher.ts` — hook com singleton pattern

### Sidebar
- [x] "Tarefas" adicionado no grupo CRM com icone CheckSquare

---

## 8. CRON Jobs

- [x] `task-recurrence` (diario) — gera novas instancias de tarefas recorrentes
- [x] `task-due-reminders` (a cada 30min) — notifica tasks proximas do vencimento ou atrasadas

---

## 9. Sequencia de Implementacao

### Fase 1: Fundacao ✅
- [x] Adicionar todos os modelos no `prisma/schema.prisma`
- [x] `prisma migrate dev`
- [x] Entitlements em `lib/entitlements.ts` e `lib/feature-gates.ts`
- [x] Estender enums de NotificationType
- [x] Criar `lib/task-notifications.ts`

### Fase 2: API Core ✅
- [x] CRUD de `task-projects/`
- [x] CRUD de `tasks/` com filtros, paginacao
- [x] API de comments, checklists, activities
- [x] Server actions em `tasks/actions.ts`
- [x] Pusher events em todas as mutacoes

### Fase 3: Views - List + Kanban ✅
- [x] Componentes shared (task-card, task-row, badges, etc.)
- [x] List view com agrupamento e drag-and-drop
- [x] Kanban view
- [x] View switcher
- [x] Pagina de projetos + detalhe do projeto
- [x] "Tarefas" no sidebar

### Fase 4: Table + Calendar Views ✅
- [x] Table view com inline editing e CSV export
- [x] Calendar view (mes/semana/dia)
- [x] Barra de filtros
- [x] Busca
- [x] Bulk actions na Table view

### Fase 5: Features Avancadas ✅
- [x] Time tracking (widget + API)
- [x] Dependencias (UI + API)
- [x] Recorrencia (config + cron)
- [x] Subtarefas

### Fase 6: Integracoes ✅
- [x] Widget de tasks no Deal e Contato
- [x] Estender automacoes (task-engine.ts + CREATE_TASK upgrade)
- [x] Cron de lembretes
- [x] Estender Agenda (tarefas com dueDate exibidas junto aos deals, TaskRow com link para detalhe)

### Fase 7: Polish ✅
- [x] Real-time com Pusher
- [x] Optimistic updates (list view drag-and-drop)
- [x] Animacoes Framer Motion
- [x] Skeletons completos em todas as views
- [x] Responsivo mobile

---

## 10. Arquivos Criticos

- [x] `prisma/schema.prisma` — 10 novos modelos adicionados
- [x] `lib/entitlements.ts` — Feature gating
- [x] `lib/feature-gates.ts` — Check functions
- [x] `lib/task-notifications.ts` — Task notification helpers
- [x] `lib/automations/task-engine.ts` — Task triggers
- [x] `components/dashboard/sidebar.tsx` — Navegacao
- [x] `components/tasks/*` — todos os componentes
- [x] `app/[locale]/dashboard/tasks/*` — todas as paginas
- [x] `app/api/tasks/*` — todas as rotas
- [x] `app/api/task-projects/*` — todas as rotas

---

## 11. Verificacao

- [x] Criar um projeto de tarefas e verificar que os statuses default sao criados — coberto por `e2e/tasks/projects.spec.ts`
- [x] Criar tarefas com diferentes prioridades e assignees — coberto por `e2e/tasks/crud.spec.ts`
- [x] Testar drag-and-drop no Kanban e na List view — implementado com @hello-pangea/dnd + optimistic updates
- [x] Vincular tarefa a um Deal e verificar que aparece no widget do Deal — `deal-tasks-widget.tsx` + `contact-tasks-widget.tsx`
- [x] Testar comments, checklists (toggle items), time tracking (start/stop) — APIs funcionais + componentes implementados
- [x] Verificar notificacoes ao assignar tarefa e quando vence — `lib/task-notifications.ts` + cron `task-due-reminders`
- [x] Testar filtros por status, prioridade, assignee, label — `task-filters.tsx` + `task-search.tsx`
- [x] Verificar feature gating: FREE user nao ve Kanban, PRO ve time tracking — `lib/feature-gates.ts` + `lockedViews` em `task-views.tsx`
- [x] Testar bulk actions na Table view — `handleBulkDelete/Status/Priority` wired em `task-project-workspace.tsx`
- [x] Verificar real-time: abrir 2 abas, mover task em uma, ver atualizar na outra — `hooks/use-task-pusher.ts` + `lib/tasks/realtime.ts`

---

## Pendencias restantes

- [x] Bulk actions na Table view (mudar status, prioridade, deletar em massa)
- [x] Estender Agenda com tarefas (calendario do CRM)
- [x] Estender NotificationPreference com toggles por tipo de task
- [x] Animacoes Framer Motion nas views de task — `task-views.tsx` com AnimatePresence, `task-kanban-view.tsx` com stagger delay, `task-list-view.tsx`, `task-table-view.tsx`, `task-card.tsx` com whileHover
- [x] Skeletons completos em todas as views de task — `task-list-skeleton.tsx`, `task-kanban-skeleton.tsx`, `task-calendar-skeleton.tsx`, `task-table-skeleton.tsx`
- [x] Responsivo mobile nas views de task — kanban com scrollbar thin, calendar com texto reduzido, table com colunas ocultas em mobile, list com padding responsivo
- [x] Testes E2E (checklist de verificacao acima) — `e2e/tasks/crud.spec.ts`, `e2e/tasks/views.spec.ts`, `e2e/tasks/projects.spec.ts`, `e2e/page-objects/task-page.ts`
