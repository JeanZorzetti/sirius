# Agenda dos crons

O repositório não agenda nada. Um agendador externo (EasyPanel) chama cada rota abaixo com:

```
GET https://siriuscrm.com.br/api/cron/<rota>
Authorization: Bearer <CRON_SECRET>
```

Sem `CRON_SECRET` no ambiente, toda rota responde 401. Toda rota aceita GET. As que também aceitam
`?token=<CRON_SECRET>` servem para teste manual pelo navegador.

A coluna "Frequência" é a que o código declara no comentário da rota. A coluna "Chamada hoje?" só pode ser
preenchida olhando o agendador no painel. Até 28/09/2026, só `check-trial-expiry` tinha chamador confirmado.

| Rota | Frequência declarada | O que faz | Chamada hoje? |
|---|---|---|---|
| `check-trial-expiry` | diária | e-mail de fim de teste; conta vencida vira somente leitura | sim |
| `billing-pix` | diária, 9h | cobrança PIX (Mercado Pago legado) e rebaixamento 3 dias após o vencimento | ? |
| `deal-idle` | diária | automações "negócio parado há N dias" | ? |
| `follow-up-emails` | diária, 12:00 UTC | alerta de negócio parado ao dono (3/7/14 dias) | ? |
| `task-recurrence` | diária | cria a próxima tarefa de uma tarefa recorrente | ? |
| `sync-ads` | diária, 02:00 UTC | métricas de Google Ads e Facebook Ads | ? |
| `weekly-newsletter` | segunda, 12:00 UTC | resumo semanal para contas pagas | ? |
| `monthly-revenue` | dias 28–31, 00:00 | snapshot de MRR, ARR e churn | ? |
| `agaas-idle-deals` | a cada 2 h, horário comercial | agente de follow-up: propõe mensagem para negócio parado (só com API Oficial e janela de 24h aberta) | ? |
| `sync-google-calendar` | a cada 4 h | importa eventos do Google Calendar | ? |
| `calendar-reminders` | a cada hora | lembrete de evento nas próximas 24 h | ? |
| `task-due-reminders` | a cada 30 min | aviso de tarefa vencendo em 2 h e de tarefa atrasada | ? |
| `process-integration-retries` | a cada 5 min | reenvia integração que falhou | ? |
| `whatsapp-integradores` | a cada 5 min | confere o estado de cada conexão por integrador (spec 012) | ? |
| `instagram-poster` | sem frequência declarada | publica post agendado no Instagram | ? |

Rota nova em `app/api/cron/` entra nesta tabela no mesmo commit.
