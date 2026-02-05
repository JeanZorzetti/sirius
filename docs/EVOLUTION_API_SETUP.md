# 🚀 Evolution API Setup - Easypanel (Hostinger VPS)

Guia completo para fazer deploy do Evolution API no Easypanel (Hostinger VPS).

---

## 📋 Pré-requisitos

- ✅ VPS Hostinger com Easypanel instalado
- ✅ Domínio ou subdomínio (ex: `api-whatsapp.roilabs.com.br`)
- ✅ Acesso SSH ao servidor (opcional, Easypanel tem interface web)

---

## 🎯 Visão Geral

O Evolution API é uma API REST que gerencia múltiplas instâncias do WhatsApp Web. Ele permite:
- ✅ Conectar múltiplos números de WhatsApp
- ✅ Enviar e receber mensagens programaticamente
- ✅ Webhooks para eventos em tempo real
- ✅ Armazenamento de mensagens e contatos no PostgreSQL

**Arquitetura:**
```
Sirius CRM (Next.js)
      ↓ API calls
Evolution API (Docker)
      ↓ WebSocket
WhatsApp Web
```

---

## 🚀 Deploy no Easypanel

### Passo 1: Preparar Variáveis de Ambiente

1. **Gerar senhas seguras:**
   ```bash
   # PostgreSQL password
   openssl rand -base64 32

   # Redis password
   openssl rand -base64 32

   # Evolution API Key
   openssl rand -base64 32
   ```

2. **Criar arquivo `.env`:**
   - Copiar `docker/evolution-api/.env.example` para `.env`
   - Preencher com os valores gerados

   ```env
   POSTGRES_USER=evolution
   POSTGRES_PASSWORD=xK8mP2vQ9wR5tY6uI3oP7aS1dF4gH0jL
   DATABASE_URL=postgresql://evolution:xK8mP2vQ9wR5tY6uI3oP7aS1dF4gH0jL@postgres:5432/evolution

   REDIS_PASSWORD=nM3vB7cX1zL9pK2wQ5tY8rE4uI6oP0aS
   REDIS_URL=redis://:nM3vB7cX1zL9pK2wQ5tY8rE4uI6oP0aS@redis:6379

   SERVER_URL=https://api-whatsapp.roilabs.com.br
   EVOLUTION_API_KEY=dF4gH0jLkM3nB7vC1xZ9pK2wQ5tY8rE6
   WEBHOOK_URL=https://app.roilabs.com.br/api/webhooks/evolution
   ```

---

### Passo 2: Deploy via Easypanel

#### Opção A: Via Interface Web (Recomendado)

1. **Acessar Easypanel:**
   - Fazer login em `https://seu-servidor.com:3000`

2. **Criar Novo Projeto:**
   - Clicar em "Create Project"
   - Nome: `evolution-api`
   - Tipo: `Docker Compose`

3. **Configurar Docker Compose:**
   - Copiar conteúdo de `docker/evolution-api/docker-compose.yml`
   - Colar no editor do Easypanel

4. **Adicionar Variáveis de Ambiente:**
   - Na aba "Environment Variables"
   - Adicionar cada variável do `.env`:
     ```
     POSTGRES_USER=evolution
     POSTGRES_PASSWORD=xK8mP2vQ9wR5tY6uI3oP7aS1dF4gH0jL
     DATABASE_URL=postgresql://evolution:xK8mP2vQ9wR5tY6uI3oP7aS1dF4gH0jL@postgres:5432/evolution
     ... (todas as outras)
     ```

5. **Configurar Domínio:**
   - Na aba "Domains"
   - Adicionar: `api-whatsapp.roilabs.com.br`
   - Apontar para porta `8080` do serviço `evolution-api`
   - Habilitar SSL automático (Let's Encrypt)

6. **Deploy:**
   - Clicar em "Deploy"
   - Aguardar build e inicialização (~2-3 minutos)

#### Opção B: Via CLI

```bash
# 1. Conectar via SSH
ssh root@seu-servidor.com

# 2. Criar diretório
mkdir -p /opt/evolution-api
cd /opt/evolution-api

# 3. Copiar arquivos
# (Upload via SCP ou git clone)
scp docker/evolution-api/docker-compose.yml root@servidor:/opt/evolution-api/
scp docker/evolution-api/.env root@servidor:/opt/evolution-api/

# 4. Iniciar
docker compose up -d

# 5. Verificar logs
docker compose logs -f evolution-api
```

---

### Passo 3: Configurar DNS

1. **Apontar subdomínio:**
   - Tipo: `A`
   - Nome: `api-whatsapp`
   - Valor: IP do servidor Hostinger
   - TTL: 300

2. **Aguardar propagação:**
   ```bash
   # Testar DNS
   nslookup api-whatsapp.roilabs.com.br
   ```

3. **Verificar SSL:**
   - Easypanel gera SSL automaticamente via Let's Encrypt
   - Pode demorar 1-2 minutos após deploy

---

### Passo 4: Testar Evolution API

#### 4.1 Health Check

```bash
curl https://api-whatsapp.roilabs.com.br/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "version": "2.2.1"
}
```

#### 4.2 Criar Primeira Instância

```bash
curl -X POST https://api-whatsapp.roilabs.com.br/instance/create \
  -H "apikey: dF4gH0jLkM3nB7vC1xZ9pK2wQ5tY8rE6" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "sirius-test",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

**Resposta esperada:**
```json
{
  "instance": {
    "instanceName": "sirius-test",
    "status": "created"
  },
  "hash": {
    "apikey": "..."
  },
  "webhook": {
    "url": "https://app.roilabs.com.br/api/webhooks/evolution",
    "events": ["messages.upsert", "connection.update", ...]
  }
}
```

#### 4.3 Obter QR Code

```bash
curl https://api-whatsapp.roilabs.com.br/instance/connect/sirius-test \
  -H "apikey: dF4gH0jLkM3nB7vC1xZ9pK2wQ5tY8rE6"
```

**Resposta:**
```json
{
  "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhE...",
  "code": "1@AbCdEfGhIjKlMnOpQrStUvWxYz..."
}
```

#### 4.4 Escanear QR Code

- Abrir WhatsApp no celular
- Ir em "Dispositivos conectados"
- Escanear o QR code retornado
- Aguardar conexão (~10 segundos)

#### 4.5 Verificar Status

```bash
curl https://api-whatsapp.roilabs.com.br/instance/connectionState/sirius-test \
  -H "apikey: dF4gH0jLkM3nB7vC1xZ9pK2wQ5tY8rE6"
```

**Resposta esperada (conectado):**
```json
{
  "instance": {
    "instanceName": "sirius-test",
    "status": "open"
  },
  "state": "open"
}
```

---

## 🔧 Configuração do Sirius CRM

### 1. Adicionar Variáveis de Ambiente

No Vercel (ou onde o Sirius CRM está hospedado):

```env
# Evolution API
EVOLUTION_API_URL=https://api-whatsapp.roilabs.com.br
EVOLUTION_API_KEY=dF4gH0jLkM3nB7vC1xZ9pK2wQ5tY8rE6
```

### 2. Criar Cliente da API

Arquivo já criado em: `lib/evolution-api-client.ts`

### 3. Criar Webhook Receiver

Arquivo a ser criado: `app/api/webhooks/evolution/route.ts`

---

## 📊 Monitoramento

### Logs em Tempo Real

**Via Easypanel:**
- Acessar projeto "evolution-api"
- Aba "Logs"
- Selecionar serviço: `evolution-api`

**Via CLI:**
```bash
docker compose logs -f evolution-api
docker compose logs -f postgres
docker compose logs -f redis
```

### Métricas

**Health Check Endpoint:**
```bash
# Adicionar ao monitoramento (UptimeRobot, etc)
https://api-whatsapp.roilabs.com.br/health
```

**Database Stats:**
```bash
# Conectar ao PostgreSQL
docker compose exec postgres psql -U evolution -d evolution

# Ver instâncias ativas
SELECT * FROM "Instance";

# Ver mensagens recentes
SELECT * FROM "Message" ORDER BY "messageTimestamp" DESC LIMIT 10;
```

---

## 🔒 Segurança

### Checklist de Segurança

- [x] **API Key forte:** 32+ caracteres aleatórios
- [x] **Senhas fortes:** PostgreSQL e Redis com senhas complexas
- [x] **SSL/TLS:** Let's Encrypt configurado via Easypanel
- [x] **Firewall:** Easypanel gerencia automaticamente
- [x] **Webhook autenticado:** Validar assinatura no CRM
- [ ] **Backup:** Configurar backup automático do PostgreSQL
- [ ] **Rate limiting:** Implementar no nginx (via Easypanel)

### Backup do Banco de Dados

```bash
# Backup manual
docker compose exec postgres pg_dump -U evolution evolution > backup-$(date +%Y%m%d).sql

# Restaurar backup
cat backup-20260205.sql | docker compose exec -T postgres psql -U evolution -d evolution
```

### Rotar API Key

```bash
# 1. Gerar nova key
openssl rand -base64 32

# 2. Atualizar .env
EVOLUTION_API_KEY=nova_key_aqui

# 3. Restart serviço
docker compose restart evolution-api

# 4. Atualizar no Vercel (Sirius CRM)
```

---

## 🐛 Troubleshooting

### Problema: Evolution API não inicia

**Diagnóstico:**
```bash
docker compose logs evolution-api
```

**Soluções comuns:**
- Verificar se PostgreSQL está rodando: `docker compose ps postgres`
- Verificar credenciais no `.env`
- Verificar se a porta 8080 está livre

---

### Problema: QR Code não aparece

**Diagnóstico:**
```bash
curl https://api-whatsapp.roilabs.com.br/instance/connectionState/instance-name \
  -H "apikey: sua-key"
```

**Soluções:**
- Verificar se instância foi criada corretamente
- Tentar deletar e recriar instância
- Verificar logs: `docker compose logs evolution-api`

---

### Problema: Mensagens não chegam no webhook

**Diagnóstico:**
```bash
# Ver eventos configurados
curl https://api-whatsapp.roilabs.com.br/webhook/find/instance-name \
  -H "apikey: sua-key"
```

**Soluções:**
- Verificar se `WEBHOOK_URL` está correto no `.env`
- Testar webhook manualmente: `curl -X POST webhook-url`
- Verificar logs do CRM: `vercel logs`
- Confirmar que endpoint `/api/webhooks/evolution` existe

---

### Problema: Conexão cai constantemente

**Causas comuns:**
1. WhatsApp detectou uso comercial (usar número business)
2. IP do servidor bloqueado (trocar de servidor)
3. Múltiplas instâncias com mesmo número

**Solução:**
- Usar WhatsApp Business API oficial (pago)
- Ou usar número dedicado apenas para o CRM
- Evitar enviar spam (rate limiting)

---

## 📈 Escalabilidade

### Múltiplas Instâncias

Evolution API suporta múltiplas instâncias de WhatsApp no mesmo servidor:

```typescript
// Criar instância para cada número
await createInstance({ instanceName: 'vendas-1' })
await createInstance({ instanceName: 'vendas-2' })
await createInstance({ instanceName: 'suporte-1' })
```

**Limites por VPS (Hostinger):**
- 2GB RAM: ~5-10 instâncias simultâneas
- 4GB RAM: ~20-30 instâncias simultâneas
- 8GB RAM: ~50+ instâncias simultâneas

### Cluster (Futuro)

Para >50 instâncias, considerar:
- Load balancer (nginx)
- Múltiplos servidores Evolution API
- PostgreSQL dedicado (não no mesmo servidor)
- Redis Cluster

---

## 📚 Referências

- [Evolution API Docs](https://doc.evolution-api.com/)
- [Evolution API GitHub](https://github.com/EvolutionAPI/evolution-api)
- [Easypanel Docs](https://easypanel.io/docs)
- [WhatsApp Web.js](https://github.com/pedroslopez/whatsapp-web.js)

---

## ✅ Checklist de Deploy

### Pré-Deploy
- [ ] VPS Hostinger com Easypanel instalado
- [ ] Domínio configurado (DNS apontando)
- [ ] Variáveis de ambiente geradas (senhas, API keys)
- [ ] Arquivo `.env` criado e preenchido

### Deploy
- [ ] Projeto criado no Easypanel
- [ ] Docker Compose configurado
- [ ] Variáveis de ambiente adicionadas
- [ ] Domínio configurado com SSL
- [ ] Serviço deployado e rodando

### Pós-Deploy
- [ ] Health check passando
- [ ] Primeira instância criada com sucesso
- [ ] QR Code gerado corretamente
- [ ] WhatsApp conectado
- [ ] Webhook recebendo eventos
- [ ] Sirius CRM integrado

### Produção
- [ ] Backup automático configurado
- [ ] Monitoramento ativo (UptimeRobot)
- [ ] Logs sendo coletados
- [ ] Documentação atualizada

---

**Última atualização:** 2026-02-05
**Versão Evolution API:** 2.2.1
**Status:** ✅ Pronto para deploy
