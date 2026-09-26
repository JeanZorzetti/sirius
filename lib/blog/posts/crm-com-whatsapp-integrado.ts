import { BlogPost } from '../../blog-types'

const TH = 'padding: 0.75rem; text-align: left; border: 1px solid var(--border);'
const TD = 'padding: 0.75rem; border: 1px solid var(--border);'
const DETAILS = 'border: 1px solid var(--border); border-radius: 0.5rem; padding: 1rem; margin-bottom: 0.75rem;'
const SUMMARY = 'font-weight: 600; cursor: pointer; color: var(--foreground); list-style: revert;'
const ANSWER = 'margin: 0.75rem 0 0; color: var(--foreground);'
const LIST = 'line-height: 2; padding-left: 1.5rem; color: var(--foreground);'
const BOX = 'background: var(--muted); border-left: 4px solid var(--fio-forte); padding: 1.25rem 1.5rem; border-radius: 0.75rem; margin: 2rem 0;'

export const post: BlogPost = {
  slug: 'crm-com-whatsapp-integrado',
  title: 'CRM com WhatsApp Integrado em 2026: Como Centralizar Todas as Conversas Comerciais num Só Lugar',
  excerpt: 'Como integrar o WhatsApp ao CRM pela API oficial da Meta para centralizar conversas, organizar o follow-up e nunca mais perder histórico de cliente no celular pessoal. Revisado em setembro de 2026.',
  date: '2026-03-21',
  lastModified: '2026-09-26',
  category: 'Vendas',
  image: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=1200&h=630&fit=crop&auto=format&q=80',
  author: 'Equipe Sirius CRM',
  relatedSlugs: ['crm-automacao-vendas-guia-completo', 'poder-do-follow-up', 'crm-para-representante-comercial-2026'],
  content: `
      <p>
        O vendedor brasileiro vende pelo WhatsApp. O comprador B2B prefere resolver negócio no aplicativo de mensagens, e isso criou um caos silencioso nos times comerciais: conversas espalhadas em celulares pessoais, histórico que vai embora com o vendedor, follow-up que se perde entre outras 200 mensagens e gestor sem visibilidade do que foi prometido ao cliente.
      </p>

      <p>
        A solução não é proibir o WhatsApp, é integrá-lo ao CRM. Este artigo explica como a integração funciona, por que ela precisa passar pela API oficial da Meta e como conectar o WhatsApp ao Sirius CRM. Revisado em 26 de setembro de 2026.
      </p>

      <div class="not-prose" style="background: var(--primary); padding: 1.5rem; border-radius: 0.75rem; margin: 2rem 0;">
        <p style="margin: 0 0 0.75rem; font-weight: 700; font-size: 1.05rem; color: var(--primary-foreground);">⚡ Resposta rápida</p>
        <ul style="margin: 0; padding-left: 1.25rem; line-height: 2; color: #ffffff;">
          <li>CRM com WhatsApp junta as conversas comerciais num só lugar, com histórico por cliente</li>
          <li>A integração segura usa a API oficial do WhatsApp Business, da Meta; conexões por QR Code em APIs não oficiais arriscam o banimento do número</li>
          <li>O gestor enxerga as conversas sem pegar o celular de ninguém</li>
          <li>No Sirius CRM, o WhatsApp entra no plano Business (R$ 397/mês), pela API oficial</li>
        </ul>
      </div>

      <h2>Como funciona um CRM com WhatsApp integrado?</h2>

      <p>
        A integração não usa o aplicativo instalado no celular. Ela usa a <strong>API do WhatsApp Business</strong>, a porta oficial da Meta para sistemas externos. O número da empresa é registrado na API, e o CRM passa a enviar e receber as mensagens por ela.
      </p>

      <p>
        Na prática: o vendedor abre o CRM e vê a conversa ao lado do negócio. Quando escreve ali, a mensagem chega ao cliente no WhatsApp. Quando o cliente responde, a resposta volta para o CRM. Tudo fica no histórico do contato, com data, hora e status de leitura.
      </p>

      <div style="${BOX}">
        <p style="margin: 0; font-weight: 700; color: var(--foreground);">API oficial ou conexão por QR Code?</p>
        <p style="margin: 0.5rem 0 0; color: var(--foreground);">Ferramentas como Evolution API, Baileys e whatsmeow conectam o número lendo um QR Code, como o WhatsApp Web. Elas não são oficiais: a Meta pode banir o número, e com ele vai o histórico de conversas com os clientes. Por isso o Sirius descontinuou a conexão por QR Code e hoje conecta só pela API oficial. Explicamos a diferença em <a href="/blog/whatsapp-api-oficial-meta-crm">API oficial do WhatsApp no CRM</a>.</p>
      </div>

      <h3>O que a integração resolve na prática</h3>

      <ul style="${LIST}">
        <li><strong>Histórico perdido:</strong> toda conversa fica ligada ao contato no CRM, inclusive depois que o vendedor sai</li>
        <li><strong>Dependência do celular pessoal:</strong> o time atende pelo navegador</li>
        <li><strong>Follow-up esquecido:</strong> a automação cria a tarefa do próximo contato quando o negócio fica parado</li>
        <li><strong>Falta de visibilidade:</strong> o gestor vê as conversas de cada vendedor</li>
        <li><strong>Vários vendedores, um número:</strong> o mesmo número é atendido por mais de uma pessoa</li>
      </ul>

      <h2>Vale a pena integrar WhatsApp com CRM?</h2>

      <p>
        Sim, principalmente no Brasil. O argumento financeiro é direto: se o time vende pelo WhatsApp pessoal e o vendedor sai, a empresa perde o histórico de todos os clientes dele. Dependendo do ciclo de vendas, isso é perder meses de relacionamento.
      </p>

      <div style="${BOX}">
        <p style="margin: 0; font-weight: 700; color: var(--foreground);">Quando a integração rende mais</p>
        <p style="margin: 0.5rem 0 0; color: var(--foreground);">Quando o ciclo de venda tem 3 ou mais contatos antes do fechamento, 2 ou mais vendedores atendem os mesmos clientes e o ticket é alto o bastante para que cada cliente perdido pese no resultado.</p>
      </div>

      <h3>O risco de não integrar</h3>

      <p>
        Três riscos crescem com o tempo. Compliance: sem registro das conversas, não há como provar o que foi prometido ao cliente numa disputa. Perda silenciosa: o cliente que para de responder no WhatsApp pessoal do vendedor some sem o gestor perceber. Concentração: a inteligência comercial fica presa no celular de uma pessoa.
      </p>

      <h2>Qual CRM tem WhatsApp integrado no Brasil?</h2>

      <p>Planos conferidos em 26/09/2026 nas páginas oficiais:</p>

      <div style="overflow-x: auto; margin: 2rem 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="background: var(--muted);">
              <th style="${TH}">CRM</th>
              <th style="${TH}">WhatsApp</th>
              <th style="${TH}">Em qual plano</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="${TD}"><strong>RD Station CRM</strong></td>
              <td style="${TD}">Recursos de venda pelo WhatsApp</td>
              <td style="${TD}">Desde o Free (até 4 usuários)</td>
            </tr>
            <tr>
              <td style="${TD}"><strong>Agendor</strong></td>
              <td style="${TD}">Extensão do WhatsApp Web; WhatsApp Sync</td>
              <td style="${TD}">Extensão grátis em todos; Sync por R$ 49/número/mês</td>
            </tr>
            <tr>
              <td style="${TD}"><strong>Pipedrive</strong></td>
              <td style="${TD}">WhatsApp na caixa de mensagens</td>
              <td style="${TD}">Planos pagos (sem plano gratuito)</td>
            </tr>
            <tr>
              <td style="${TD}"><strong>HubSpot</strong></td>
              <td style="${TD}">Integração nativa</td>
              <td style="${TD}">Marketing Hub ou Service Hub Professional</td>
            </tr>
            <tr>
              <td style="${TD}"><strong>Sirius CRM</strong></td>
              <td style="${TD}">Chat pela API oficial da Meta, no histórico do cliente</td>
              <td style="${TD}">Business (R$ 397/mês, até 50 usuários)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>O WhatsApp no Sirius CRM: como funciona na prática</h2>

      <p>
        No plano Business, o Sirius conecta o número da empresa pela API oficial da Meta. As conversas aparecem no chat do CRM, ligadas ao contato e ao negócio.
      </p>

      <ul style="${LIST}">
        <li><strong>Conversa no histórico:</strong> cada mensagem fica salva e pesquisável no contato, mesmo depois que o vendedor sai</li>
        <li><strong>Ligação ao funil:</strong> a conversa se associa a um negócio com um clique</li>
        <li><strong>Modelos de mensagem:</strong> os modelos aprovados pela Meta ficam no CRM para iniciar conversas</li>
        <li><strong>Distribuição de leads:</strong> o round-robin do Business reparte os leads novos entre os vendedores</li>
      </ul>

      <h2>Como estruturar cadências de follow-up via WhatsApp</h2>

      <p>
        A maior vantagem de ter o WhatsApp no CRM não é só centralizar conversas: é não deixar o próximo contato cair no esquecimento. A <a href="/followup">automação de follow-up</a> cria a tarefa do próximo toque quando o negócio muda de etapa ou fica parado, e o vendedor envia a mensagem pelo CRM seguindo as <a href="/blog/whatsapp-vendas-b2b-estrategias">estratégias de vendas B2B pelo WhatsApp</a>.
      </p>

      <p>
        Uma regra da API oficial muda a cadência: fora da janela de 24 horas depois da última mensagem do cliente, a empresa só pode iniciar a conversa com um <strong>modelo de mensagem aprovado pela Meta</strong>. A Meta cobra pelos modelos conforme a tabela dela; responder o cliente dentro da janela não tem custo de mensagem.
      </p>

      <p>Exemplo de cadência para leads frios via WhatsApp:</p>

      <div style="overflow-x: auto; margin: 2rem 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="background: var(--muted);">
              <th style="${TH}">Etapa</th>
              <th style="${TH}">Momento</th>
              <th style="${TH}">Mensagem</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="${TD}">1ª abordagem</td>
              <td style="${TD}">Dia 0: lead cadastrado</td>
              <td style="${TD}">Modelo aprovado com apresentação e referência ao contexto do lead</td>
            </tr>
            <tr>
              <td style="${TD}">Follow-up 1</td>
              <td style="${TD}">Dia 2: sem resposta</td>
              <td style="${TD}">Conteúdo de valor: case, artigo, dado do setor</td>
            </tr>
            <tr>
              <td style="${TD}">Follow-up 2</td>
              <td style="${TD}">Dia 5: sem resposta</td>
              <td style="${TD}">Pergunta direta sobre a dor do segmento</td>
            </tr>
            <tr>
              <td style="${TD}">Follow-up 3</td>
              <td style="${TD}">Dia 10: sem resposta</td>
              <td style="${TD}">Fechamento: "Ainda faz sentido conversar?"</td>
            </tr>
            <tr>
              <td style="${TD}">Reativação</td>
              <td style="${TD}">Dia 30: lead frio</td>
              <td style="${TD}">Novidade do produto ou da empresa</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="${BOX}">
        <p style="margin: 0; font-weight: 700; color: var(--foreground);">⚠️ Boas práticas para não cair em spam</p>
        <ul style="margin: 0.5rem 0 0; padding-left: 1.25rem; color: var(--foreground);">
          <li>Nunca envie mensagem em massa sem consentimento: gera denúncia e derruba a qualidade do número</li>
          <li>Mantenha pelo menos 24 horas entre mensagens para o mesmo contato</li>
          <li>Personalize sempre; mensagem genérica gera bloqueio</li>
          <li>Ofereça saída clara: "Pode me avisar se não quiser mais receber mensagens"</li>
        </ul>
      </div>

      <h2>Passo a passo para conectar o WhatsApp ao Sirius CRM</h2>

      <p>A conexão pela API oficial pede uma conta na Meta com o número verificado. No Sirius:</p>

      <ol style="${LIST}">
        <li>Crie ou use uma conta do Meta Business Manager e cadastre o número no WhatsApp Business Platform</li>
        <li>No painel de desenvolvedores da Meta, anote o <strong>Phone Number ID</strong>, o <strong>ID da conta do WhatsApp Business</strong>, o <strong>App Secret</strong> e gere um <strong>token de acesso permanente</strong></li>
        <li>No Sirius (plano Business), abra <strong>Configurações → Integrações → WhatsApp Oficial</strong> e preencha esses dados, com um token de verificação do webhook que você mesmo cria</li>
        <li>Cadastre o webhook na Meta com o endereço e o token que o Sirius mostra</li>
        <li>Envie uma mensagem de teste de outro número para conferir o fluxo</li>
      </ol>

      <p>
        Se preferir não mexer no painel da Meta, a equipe do Sirius faz a implantação por R$ 297, contratada na mesma tela.
      </p>

      <div style="background: var(--muted); border: 1px solid var(--border); padding: 1.5rem; border-radius: 0.75rem; margin: 2rem 0; text-align: center;">
        <p style="font-weight: 700; color: var(--foreground); font-size: 1.1rem; margin: 0 0 0.75rem;">Centralize o WhatsApp do seu time no Sirius CRM</p>
        <p style="color: var(--foreground); margin: 0 0 1rem;">WhatsApp pela API oficial da Meta no plano Business, até 50 usuários.</p>
        <p><strong><a href="/pricing" style="color: var(--foreground); text-decoration: underline;">Ver planos →</a></strong></p>
      </div>

      <h2>Perguntas frequentes sobre CRM com WhatsApp</h2>

      <details style="${DETAILS}">
        <summary style="${SUMMARY}">Dá para usar um único número de WhatsApp para vários vendedores?</summary>
        <p style="${ANSWER}">Dá. Pela API oficial, o mesmo número é atendido por várias pessoas ao mesmo tempo pelo CRM, cada uma na sua conversa, e o gestor vê todas.</p>
      </details>

      <details style="${DETAILS}">
        <summary style="${SUMMARY}">O cliente percebe que está sendo atendido por um sistema?</summary>
        <p style="${ANSWER}">Não necessariamente. Para o cliente, a conversa acontece no mesmo WhatsApp de sempre. O que denuncia o sistema é mensagem automática genérica, por isso a personalização importa mesmo nos modelos.</p>
      </details>

      <details style="${DETAILS}">
        <summary style="${SUMMARY}">Qual a diferença entre o app WhatsApp Business e a API do WhatsApp Business?</summary>
        <p style="${ANSWER}">O app WhatsApp Business é gratuito, tem catálogo e respostas automáticas básicas, mas não se integra a sistemas externos. A API do WhatsApp Business é a porta oficial da Meta para integração com CRMs, com vários atendentes no mesmo número e modelos de mensagem aprovados. Ferramentas que conectam por QR Code, como Evolution API e Baileys, não são a API oficial e arriscam o banimento do número.</p>
      </details>

      <details style="${DETAILS} margin-bottom: 2rem;">
        <summary style="${SUMMARY}">O vendedor pode continuar respondendo pelo celular?</summary>
        <p style="${ANSWER}">O ideal é não. Resposta dada fora do CRM não entra no histórico do cliente, e o histórico é o motivo de integrar. Depois da integração, o atendimento comercial acontece pelo painel do CRM, que também abre no navegador do celular.</p>
      </details>

      <h2>Conclusão</h2>

      <p>
        Vender pelo WhatsApp sem CRM integrado é gerenciar o negócio em post-its: funciona por um tempo, não escala e um dia se perde tudo. A integração pela API oficial transforma o canal mais usado no Brasil num ativo comercial rastreável, sem o risco de perder o número. No Sirius, ela está no plano Business, com o histórico de cada conversa no contato e no negócio.
      </p>

      <hr style="margin: 3rem 0; border: none; border-top: 1px solid var(--border);" />
      <strong>Última atualização:</strong> 26 de setembro de 2026<br/>
      <strong>Autor:</strong> Equipe Sirius CRM<br/>
      <strong>Tempo de leitura:</strong> 9 minutos
    `,
  titleEn: 'CRM with Integrated WhatsApp in 2026: How to Centralize All Sales Conversations in One Place',
  excerptEn: 'How to integrate WhatsApp with your CRM through the official Meta API to centralize conversations, organize follow-up and never lose customer history on personal phones again. Reviewed in September 2026.',
  keywordsEn: ['crm with whatsapp', 'whatsapp crm integration', 'crm whatsapp 2026', 'whatsapp business crm', 'centralize whatsapp sales'],
  contentEn: `
      <p>
        Brazilian salespeople sell through WhatsApp. B2B buyers prefer to close business in the messaging app, and that created silent chaos in sales teams: conversations scattered across personal phones, history that leaves with the salesperson, follow-up lost among 200 other messages and managers with no visibility into what was promised to the customer.
      </p>

      <p>
        The fix is not banning WhatsApp, it is integrating it with the CRM. This article explains how the integration works, why it has to go through the official Meta API and how to connect WhatsApp to Sirius CRM. Reviewed on September 26, 2026.
      </p>

      <div class="not-prose" style="background: var(--primary); padding: 1.5rem; border-radius: 0.75rem; margin: 2rem 0;">
        <p style="margin: 0 0 0.75rem; font-weight: 700; font-size: 1.05rem; color: var(--primary-foreground);">⚡ Quick answer</p>
        <ul style="margin: 0; padding-left: 1.25rem; line-height: 2; color: #ffffff;">
          <li>A CRM with WhatsApp puts sales conversations in one place, with history per customer</li>
          <li>The safe integration uses Meta's official WhatsApp Business API; QR Code connections through unofficial APIs risk getting the number banned</li>
          <li>Managers see the conversations without picking up anyone's phone</li>
          <li>In Sirius CRM, WhatsApp comes with the Business plan (R$ 397/month), through the official API</li>
        </ul>
      </div>

      <h2>How does a CRM with WhatsApp integration work?</h2>

      <p>
        The integration does not use the app installed on the phone. It uses the <strong>WhatsApp Business API</strong>, Meta's official door for external systems. The company number is registered on the API, and the CRM sends and receives messages through it.
      </p>

      <p>
        In practice: the salesperson opens the CRM and sees the conversation next to the deal. Whatever they write there reaches the customer on WhatsApp. When the customer replies, the reply comes back to the CRM. Everything stays in the contact history, with date, time and read status.
      </p>

      <div style="${BOX}">
        <p style="margin: 0; font-weight: 700; color: var(--foreground);">Official API or QR Code connection?</p>
        <p style="margin: 0.5rem 0 0; color: var(--foreground);">Tools like Evolution API, Baileys and whatsmeow connect the number by scanning a QR Code, like WhatsApp Web. They are not official: Meta can ban the number, and the conversation history with customers goes with it. That is why Sirius discontinued QR Code connections and now connects only through the official API. We explain the difference in <a href="/en/blog/whatsapp-api-oficial-meta-crm">the official WhatsApp API in your CRM</a>.</p>
      </div>

      <h3>What the integration solves in practice</h3>

      <ul style="${LIST}">
        <li><strong>Lost history:</strong> every conversation is tied to the contact in the CRM, even after the salesperson leaves</li>
        <li><strong>Dependence on personal phones:</strong> the team works from the browser</li>
        <li><strong>Forgotten follow-up:</strong> automation creates the next-contact task when a deal stalls</li>
        <li><strong>No visibility:</strong> managers see each salesperson's conversations</li>
        <li><strong>Several salespeople, one number:</strong> the same number is handled by more than one person</li>
      </ul>

      <h2>Is it worth integrating WhatsApp with a CRM?</h2>

      <p>
        Yes, especially in Brazil. The financial case is direct: if the team sells from personal WhatsApp and a salesperson leaves, the company loses the history of all their customers. Depending on the sales cycle, that means losing months of relationship.
      </p>

      <div style="${BOX}">
        <p style="margin: 0; font-weight: 700; color: var(--foreground);">When the integration pays off most</p>
        <p style="margin: 0.5rem 0 0; color: var(--foreground);">When the sales cycle has 3 or more touchpoints before closing, 2 or more salespeople serve the same customers and the ticket is high enough that every lost customer hurts the result.</p>
      </div>

      <h3>The risk of not integrating</h3>

      <p>
        Three risks grow over time. Compliance: without a record of the conversations, there is no way to prove what was promised to the customer in a dispute. Silent loss: the customer who stops replying on the salesperson's personal WhatsApp disappears without the manager noticing. Concentration: sales intelligence gets stuck on one person's phone.
      </p>

      <h2>Which CRMs have WhatsApp integration in Brazil?</h2>

      <p>Plans checked on 09/26/2026 on the official pages:</p>

      <div style="overflow-x: auto; margin: 2rem 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="background: var(--muted);">
              <th style="${TH}">CRM</th>
              <th style="${TH}">WhatsApp</th>
              <th style="${TH}">On which plan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="${TD}"><strong>RD Station CRM</strong></td>
              <td style="${TD}">WhatsApp sales features</td>
              <td style="${TD}">From Free (up to 4 users)</td>
            </tr>
            <tr>
              <td style="${TD}"><strong>Agendor</strong></td>
              <td style="${TD}">WhatsApp Web extension; WhatsApp Sync</td>
              <td style="${TD}">Free extension on all plans; Sync at R$ 49/number/month</td>
            </tr>
            <tr>
              <td style="${TD}"><strong>Pipedrive</strong></td>
              <td style="${TD}">WhatsApp in the messaging inbox</td>
              <td style="${TD}">Paid plans (no free plan)</td>
            </tr>
            <tr>
              <td style="${TD}"><strong>HubSpot</strong></td>
              <td style="${TD}">Native integration</td>
              <td style="${TD}">Marketing Hub or Service Hub Professional</td>
            </tr>
            <tr>
              <td style="${TD}"><strong>Sirius CRM</strong></td>
              <td style="${TD}">Chat through the official Meta API, in the customer history</td>
              <td style="${TD}">Business (R$ 397/month, up to 50 users)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>WhatsApp in Sirius CRM: how it works in practice</h2>

      <p>
        On the Business plan, Sirius connects the company number through the official Meta API. Conversations show up in the CRM chat, tied to the contact and the deal.
      </p>

      <ul style="${LIST}">
        <li><strong>Conversation in the history:</strong> every message is saved and searchable on the contact, even after the salesperson leaves</li>
        <li><strong>Linked to the pipeline:</strong> a conversation is associated with a deal in one click</li>
        <li><strong>Message templates:</strong> Meta-approved templates live in the CRM to start conversations</li>
        <li><strong>Lead distribution:</strong> Business round-robin splits new leads among salespeople</li>
      </ul>

      <h2>How to structure WhatsApp follow-up cadences</h2>

      <p>
        The biggest advantage of WhatsApp in the CRM is not only centralizing conversations: it is keeping the next contact from being forgotten. Follow-up automation creates the next-touch task when a deal changes stage or stalls, and the salesperson sends the message from the CRM following <a href="/en/blog/whatsapp-vendas-b2b-estrategias">B2B WhatsApp sales strategies</a>.
      </p>

      <p>
        One rule of the official API shapes the cadence: outside the 24-hour window after the customer's last message, the company can only start a conversation with a <strong>Meta-approved message template</strong>. Meta charges for templates according to its price list; replying to the customer inside the window has no message cost.
      </p>

      <p>Sample cadence for cold leads via WhatsApp:</p>

      <div style="overflow-x: auto; margin: 2rem 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="background: var(--muted);">
              <th style="${TH}">Step</th>
              <th style="${TH}">Timing</th>
              <th style="${TH}">Message</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="${TD}">First touch</td>
              <td style="${TD}">Day 0: lead created</td>
              <td style="${TD}">Approved template with an introduction referencing the lead's context</td>
            </tr>
            <tr>
              <td style="${TD}">Follow-up 1</td>
              <td style="${TD}">Day 2: no reply</td>
              <td style="${TD}">Value content: case, article, industry data</td>
            </tr>
            <tr>
              <td style="${TD}">Follow-up 2</td>
              <td style="${TD}">Day 5: no reply</td>
              <td style="${TD}">Direct question about the segment's pain</td>
            </tr>
            <tr>
              <td style="${TD}">Follow-up 3</td>
              <td style="${TD}">Day 10: no reply</td>
              <td style="${TD}">Close-out: "Does it still make sense to talk?"</td>
            </tr>
            <tr>
              <td style="${TD}">Reactivation</td>
              <td style="${TD}">Day 30: cold lead</td>
              <td style="${TD}">Product or company news</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="${BOX}">
        <p style="margin: 0; font-weight: 700; color: var(--foreground);">⚠️ Good practices to stay out of spam</p>
        <ul style="margin: 0.5rem 0 0; padding-left: 1.25rem; color: var(--foreground);">
          <li>Never send bulk messages without consent: it triggers reports and drops the number's quality rating</li>
          <li>Keep at least 24 hours between messages to the same contact</li>
          <li>Always personalize; generic messages get blocked</li>
          <li>Offer a clear way out: "Let me know if you'd rather not receive messages"</li>
        </ul>
      </div>

      <h2>Step by step: connecting WhatsApp to Sirius CRM</h2>

      <p>The official API connection requires a Meta account with a verified number. In Sirius:</p>

      <ol style="${LIST}">
        <li>Create or use a Meta Business Manager account and register the number on the WhatsApp Business Platform</li>
        <li>In the Meta developer dashboard, note the <strong>Phone Number ID</strong>, the <strong>WhatsApp Business Account ID</strong>, the <strong>App Secret</strong> and generate a <strong>permanent access token</strong></li>
        <li>In Sirius (Business plan), open <strong>Settings → Integrations → Official WhatsApp</strong> and fill in those details, plus a webhook verify token you create yourself</li>
        <li>Register the webhook at Meta with the address and token Sirius shows</li>
        <li>Send a test message from another number to check the flow</li>
      </ol>

      <p>
        If you would rather not touch the Meta dashboard, the Sirius team does the setup for R$ 297, purchased on the same screen.
      </p>

      <div style="background: var(--muted); border: 1px solid var(--border); padding: 1.5rem; border-radius: 0.75rem; margin: 2rem 0; text-align: center;">
        <p style="font-weight: 700; color: var(--foreground); font-size: 1.1rem; margin: 0 0 0.75rem;">Centralize your team's WhatsApp in Sirius CRM</p>
        <p style="color: var(--foreground); margin: 0 0 1rem;">WhatsApp through the official Meta API on the Business plan, up to 50 users.</p>
        <p><strong><a href="/en/pricing" style="color: var(--foreground); text-decoration: underline;">See plans →</a></strong></p>
      </div>

      <h2>FAQ about CRM with WhatsApp</h2>

      <details style="${DETAILS}">
        <summary style="${SUMMARY}">Can a single WhatsApp number serve several salespeople?</summary>
        <p style="${ANSWER}">Yes. Through the official API, the same number is handled by several people at once in the CRM, each in their own conversation, and the manager sees all of them.</p>
      </details>

      <details style="${DETAILS}">
        <summary style="${SUMMARY}">Does the customer notice they are talking to a system?</summary>
        <p style="${ANSWER}">Not necessarily. For the customer, the conversation happens in the same WhatsApp as always. What gives the system away is generic automated messaging, so personalization matters even in templates.</p>
      </details>

      <details style="${DETAILS}">
        <summary style="${SUMMARY}">What is the difference between the WhatsApp Business app and the WhatsApp Business API?</summary>
        <p style="${ANSWER}">The WhatsApp Business app is free, with a catalog and basic auto-replies, but it does not integrate with external systems. The WhatsApp Business API is Meta's official door for CRM integration, with several agents on the same number and approved message templates. Tools that connect through a QR Code, such as Evolution API and Baileys, are not the official API and put the number at risk of a ban.</p>
      </details>

      <details style="${DETAILS} margin-bottom: 2rem;">
        <summary style="${SUMMARY}">Can the salesperson keep replying from their phone?</summary>
        <p style="${ANSWER}">Ideally not. A reply sent outside the CRM does not enter the customer history, and the history is the reason to integrate. After integration, sales conversations happen in the CRM panel, which also opens in the phone's browser.</p>
      </details>

      <h2>Conclusion</h2>

      <p>
        Selling through WhatsApp without an integrated CRM is running the business on sticky notes: it works for a while, it does not scale, and one day everything is lost. Integrating through the official API turns Brazil's most used channel into a traceable sales asset, without the risk of losing the number. In Sirius, it comes with the Business plan, with each conversation's history on the contact and the deal.
      </p>

      <hr style="margin: 3rem 0; border: none; border-top: 1px solid var(--border);" />
      <strong>Last updated:</strong> September 26, 2026<br/>
      <strong>Author:</strong> Sirius CRM Team<br/>
      <strong>Read time:</strong> 9 minutes
    `
}
