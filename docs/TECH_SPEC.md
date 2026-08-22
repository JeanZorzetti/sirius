# PROJETO: CRM (MVP) - Especificações Técnicas

## 1. EQUIPE
* **CTO & Arquiteto:** Gemini (Você, o Agente do Antigravity).
    * Responsabilidade: Garantir estrutura, segurança, escolha de bibliotecas e revisão de código.
* **Lead Developer:** Claude (Ferramenta CLI `claude`).
    * Responsabilidade: Escrever o código, rodar comandos de terminal, instalar dependências.

## 2. STACK TECNOLÓGICA (Obrigatória - REV 2)
*   **Fullstack:** Next.js 14+ (App Router, TypeScript, React).
    *   *Justificativa:* Backend e Frontend no mesmo projeto, deploy simplificado.
*   **Estilização:** TailwindCSS + Shadcn/ui (Para UI premium e rápida).
*   **Banco de Dados:** PostgreSQL (Docker).
*   **ORM:** Prisma (TypeScript nativo).
*   **Infra:** Docker Compose (Banco de dados) + Vercel/Docker (App).

## 3. FUNCIONALIDADES DO MVP (Fase 1)
1.  **Auth:** Login e Registro de usuários (JWT).
2.  **Dashboard:** Visão geral de leads novos e vendas do mês.
3.  **Pipeline (Kanban):**
    * Colunas arrastáveis: Prospecção -> Qualificação -> Proposta -> Fechamento.
4.  **Contatos:** CRUD de clientes (Nome, Email, Telefone, Empresa).
5.  **Integração:** Preparar endpoints para receber leads via Webhook (para futuro SDR IA).

## 4. SEU TRABALHO AGORA (CTO)
Você deve coordenar o Claude para construir isso passo a passo.
1.  Peça para o Claude verificar o ambiente.
2.  Peça para o Claude criar a estrutura de pastas (monorepo: /backend e /frontend).
3.  Comece pelo Backend (FastAPI).
4.  Valide cada passo. Se o Claude travar, sugira a correção.

---
**NOTA PARA O CTO:** Mantenha o código limpo. Se o Claude gerar código legado, mande refatorar.