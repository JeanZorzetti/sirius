# 📅 Integração Google Calendar - Guia de Configuração

## Visão Geral

Este guia irá ajudá-lo a configurar a integração do Google Calendar para o seu sistema CRM. A integração permite criação automática de eventos quando negócios são fechados, lembretes de follow-up e sincronização bidirecional de eventos do calendário.

## Pré-requisitos

- Conta Google Cloud
- Acesso administrativo ao seu CRM
- Capacidade de definir variáveis de ambiente na sua plataforma de hospedagem

## Passo 1: Criar Projeto no Google Cloud

1. Acesse o [Console do Google Cloud](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o ID do projeto para uso posterior

## Passo 2: Habilitar a API do Google Calendar

1. No Console Cloud, navegue até **APIs e Serviços** → **Biblioteca**
2. Pesquise por "Google Calendar API"
3. Clique nela e pressione **ATIVAR**
4. Aguarde a API ser habilitada (pode levar um minuto)

## Passo 3: Criar Credenciais OAuth 2.0

1. Vá para **APIs e Serviços** → **Credenciais**
2. Clique em **+ CRIAR CREDENCIAIS** → **ID do cliente OAuth**
3. Se solicitado, configure primeiro a tela de consentimento OAuth:
   - Selecione tipo de usuário **Externo** (ou Interno se usar Google Workspace)
   - Preencha os campos obrigatórios:
     - Nome do app: "Nome do seu CRM"
     - E-mail de suporte ao usuário: seu-email@dominio.com
     - E-mail de contato do desenvolvedor: seu-email@dominio.com
   - Adicione escopos:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Adicione usuários de teste (seus endereços de e-mail que testarão a integração)
   - Salvar e continuar
4. De volta à página Credenciais, clique em **+ CRIAR CREDENCIAIS** → **ID do cliente OAuth** novamente
5. Selecione **Aplicativo da Web**
6. Configure:
   - **Nome:** "Integração CRM Google Calendar"
   - **URIs de redirecionamento autorizados:** Adicione sua URL de callback:
     - Produção: `https://seu-dominio.com/api/integrations/google-calendar/callback`
     - Desenvolvimento local: `http://localhost:3000/api/integrations/google-calendar/callback`
7. Clique em **CRIAR**
8. Copie o **ID do cliente** e o **Código secreto do cliente** mostrados no popup

## Passo 4: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente ao seu arquivo `.env`:

```bash
# OAuth Google Calendar
GOOGLE_CALENDAR_CLIENT_ID="SEU_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_CALENDAR_CLIENT_SECRET="SEU_CLIENT_SECRET"
GOOGLE_CALENDAR_REDIRECT_URI="https://seu-dominio.com/api/integrations/google-calendar/callback"

# Chave de Criptografia de Integração (se ainda não estiver definida)
INTEGRATION_ENCRYPTION_KEY="gere-com-openssl-rand-hex-32"
```

**Gerar chave de criptografia:**
```bash
openssl rand -hex 32
```

## Passo 5: Fazer Deploy em Produção

1. Adicione as variáveis de ambiente à sua plataforma de hospedagem (Vercel, Railway, etc.)
2. Faça o redeploy da sua aplicação
3. Verifique se todas as variáveis estão configuradas corretamente

## Passo 6: Testar a Integração

1. Faça login no seu CRM como usuário administrador
2. Navegue até **Configurações** → **Integrações** → **Google Calendar**
3. Clique em **"Conectar com Google"**
4. Você será redirecionado para a tela de consentimento do Google
5. Conceda acesso ao seu Google Calendar
6. Você deve ser redirecionado de volta para a página de configurações com uma mensagem de sucesso
7. Seu e-mail conectado deve ser exibido

## Passo 7: Configurar Cron Job (Opcional mas Recomendado)

Configure um cron job para sincronizar eventos a cada 4 horas:

**Para Vercel (usando Vercel Cron):**

Adicione ao `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-google-calendar",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

**Para outras plataformas:**

Use um serviço como [cron-job.org](https://cron-job.org) ou [EasyCron](https://www.easycron.com):

- URL: `https://seu-dominio.com/api/cron/sync-google-calendar`
- Agendamento: A cada 4 horas (`0 */4 * * *`)
- Método: GET
- Cabeçalhos:
  - `Authorization: Bearer SEU_CRON_SECRET`

Certifique-se de definir `CRON_SECRET` nas suas variáveis de ambiente.

## Funcionalidades

Uma vez configurada, a integração fornece:

### ✅ Criação Automática de Eventos
- Quando um negócio é marcado como "Ganho", um evento no calendário é criado automaticamente para o próximo dia útil
- O evento inclui detalhes do negócio, informações do cliente e lembretes

### ✅ Lembretes de Follow-up
- Crie lembretes de calendário para negócios específicos
- Datas de lembrete personalizáveis e notas
- Notificações por e-mail e popup

### ✅ Sincronização Bidirecional
- Eventos criados no Google Calendar são sincronizados para o CRM
- Visualize todos os seus eventos em um só lugar
- Vincule eventos do calendário aos negócios manualmente

### ✅ Gerenciamento de Eventos
- Crie, atualize e exclua eventos do CRM
- Todas as alterações sincronizam com o Google Calendar
- Rastreie o status dos eventos (confirmado, pendente, cancelado)

## Solução de Problemas

### Erro: "access_denied"
**Causa:** Usuário negou acesso durante o fluxo OAuth
**Solução:** Tente conectar novamente e conceda as permissões necessárias

### Erro: "connection_failed"
**Causa:** Credenciais inválidas ou API não habilitada
**Soluções:**
- Verifique `GOOGLE_CALENDAR_CLIENT_ID` e `GOOGLE_CALENDAR_CLIENT_SECRET`
- Certifique-se de que a API do Google Calendar está habilitada no Console Cloud
- Verifique se o URI de redirecionamento corresponde exatamente

### Erro: "No refresh token received"
**Causa:** Google não retornou um refresh token
**Soluções:**
- Desconecte e reconecte (fluxo OAuth força tela de consentimento)
- Verifique se está usando a mesma conta Google
- Revogue o acesso nas configurações da Conta Google e tente novamente

### Eventos não sincronizando
**Causa:** Cron job não configurado ou falhando
**Soluções:**
- Verifique os logs do cron job na sua plataforma de hospedagem
- Verifique se `CRON_SECRET` está definido corretamente
- Teste manualmente: `curl -H "Authorization: Bearer SEU_CRON_SECRET" https://seu-dominio.com/api/cron/sync-google-calendar`

## Melhores Práticas de Segurança

1. **Mantenha os segredos seguros**
   - Nunca faça commit de arquivos `.env` no git
   - Use variáveis de ambiente em produção
   - Rotacione credenciais periodicamente

2. **Armazenamento de Tokens OAuth**
   - Refresh tokens são criptografados usando AES-256-GCM
   - Armazenados no banco de dados com criptografia em repouso
   - Nunca expostos em respostas da API

3. **Controle de Acesso**
   - Apenas proprietários da organização podem conectar/desconectar
   - Cada organização tem acesso isolado ao calendário
   - Usuários só podem ver eventos da sua organização

## Endpoints da API

Para referência, aqui estão os endpoints da integração:

- **Início OAuth:** `GET /api/integrations/google-calendar/auth`
- **Callback OAuth:** `GET /api/integrations/google-calendar/callback`
- **Desconectar:** `POST /api/integrations/google-calendar/settings`
- **Cron de Sincronização:** `GET /api/cron/sync-google-calendar`

## Suporte

Para problemas ou perguntas:

1. Verifique os logs na sua plataforma de hospedagem
2. Revise os logs de auditoria do Console do Google Cloud
3. Verifique a tabela IntegrationLog no banco de dados para atividade
4. Entre em contato com o suporte com detalhes do erro

## Changelog

### Versão 1.0.0 (2026-01-09)
- Integração inicial do Google Calendar
- Autenticação OAuth 2.0
- Criação automática de eventos para negócios ganhos
- Criação de lembretes de follow-up
- Sincronização bidirecional de eventos
- Cron job para sincronização automática
