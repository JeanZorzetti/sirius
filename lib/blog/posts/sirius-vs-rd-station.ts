import { BlogPost } from '../../blog-types'

const TH = 'padding: 0.75rem 1rem; text-align: center; border: 1px solid var(--fio-forte);'
const TD = 'padding: 0.75rem 1rem; border: 1px solid var(--border);'
const TDC = `${TD} text-align: center;`
const TDL = `${TD} font-weight: 600;`
const DETAILS = 'border: 1px solid var(--border); border-radius: 0.5rem; padding: 1rem; margin-bottom: 0.75rem;'
const SUMMARY = 'font-weight: 600; cursor: pointer; color: var(--foreground); list-style: revert;'
const ANSWER = 'margin: 0.75rem 0 0; color: var(--foreground);'
const LIST = 'line-height: 2; padding-left: 1.5rem; color: var(--foreground);'

export const post: BlogPost = {
  slug: 'sirius-vs-rd-station',
  title: 'Sirius CRM vs RD Station CRM 2026: Comparativo Completo para PMEs Brasileiras',
  seoTitle: 'Sirius CRM vs RD Station CRM: Comparativo 2026',
  excerpt: 'Sirius CRM ou RD Station CRM? Comparativo revisado em setembro de 2026: preço por conta contra preço por usuário, plano gratuito, IA, WhatsApp, automação e integração com marketing.',
  date: '2026-03-21',
  lastModified: '2026-09-26',
  category: 'Comparativos',
  image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop&auto=format&q=80',
  author: 'Equipe Sirius CRM',
  relatedSlugs: ['melhor-crm-2026-comparativo', 'como-escolher-crm-b2b-2026', 'crm-automacao-vendas-guia-completo'],
  content: `
      <p>
        RD Station CRM e Sirius CRM são dois CRMs brasileiros, cobrados em reais, para PMEs. O RD Station nasceu do ecossistema de marketing e se integra de forma nativa ao RD Station Marketing. O Sirius nasceu do processo de vendas ativas: prospecção, visita e retorno de cliente. A diferença que mais pesa no bolso, porém, é outra: <strong>o RD Station cobra por usuário, e o Sirius cobra por conta</strong>.
      </p>

      <p>
        Comparativo revisado em 26 de setembro de 2026 com os planos publicados pelos dois fornecedores nessa data.
      </p>

      <div class="not-prose" style="background: var(--primary); padding: 1.5rem; border-radius: 0.75rem; margin: 2rem 0;">
        <p style="margin: 0 0 0.75rem; font-weight: 700; font-size: 1.05rem; color: var(--primary-foreground);">⚡ Resposta rápida</p>
        <ul style="margin: 0; padding-left: 1.25rem; line-height: 2; color: #ffffff;">
          <li><strong style="color: var(--primary-foreground);">RD Station CRM</strong>: plano Free para até 4 usuários, com recursos de venda pelo WhatsApp. Pagos por usuário: Básico R$ 73/usuário/mês, Pro R$ 131/usuário/mês (mínimo de 4). Integração nativa com o RD Station Marketing.</li>
          <li><strong style="color: var(--primary-foreground);">Sirius CRM</strong>: plano Gratuito para até 2 usuários, sem IA, sem automação e sem WhatsApp. Pagos por conta: Starter R$ 67/mês (até 5 usuários), Pro R$ 147/mês (até 15), Business R$ 397/mês (até 50). WhatsApp no CRM em todo plano pago: pelo integrador que você já usa a partir do Starter e também pela API oficial no Business.</li>
          <li>Para um time de 5 vendedores: Sirius Starter R$ 67/mês no total; RD Station Básico 5 × R$ 73 = R$ 365/mês.</li>
        </ul>
      </div>

      <h2>Sirius CRM ou RD Station CRM: qual é o foco de cada um?</h2>

      <p>
        O RD Station CRM foi criado como complemento do RD Station Marketing: sua força está em receber os leads que o marketing qualificou e levá-los pelo funil. É um CRM orientado a inbound. O Sirius foi construído para vendas ativas: prospecção de empresas pelo Google Maps, visita em campo com modo offline, retorno de cliente e qualificação por IA.
      </p>

      <div style="overflow-x: auto; margin: 2rem 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="background: var(--primary); color: #ffffff;">
              <th style="${TH} text-align: left;">Critério</th>
              <th style="${TH}">Sirius CRM</th>
              <th style="${TH}">RD Station CRM</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: var(--muted);">
              <td style="${TDL}">Plano gratuito</td>
              <td style="${TDC}">2 usuários, 250 contatos, 100 negócios ativos</td>
              <td style="${TDC}">4 usuários, 5 campos personalizados, 3 modelos de e-mail</td>
            </tr>
            <tr>
              <td style="${TDL}">Modelo de cobrança</td>
              <td style="${TDC}">Por conta: R$ 67, R$ 147 ou R$ 397/mês</td>
              <td style="${TDC}">Por usuário: R$ 73 (Básico) ou R$ 131 (Pro) por mês</td>
            </tr>
            <tr style="background: var(--muted);">
              <td style="${TDL}">WhatsApp</td>
              <td style="${TDC}">Plano Business: API oficial da Meta, conversas no histórico</td>
              <td style="${TDC}">Recursos de venda pelo WhatsApp desde o Free; salvar áudios a partir do Pro</td>
            </tr>
            <tr>
              <td style="${TDL}">Inteligência artificial</td>
              <td style="${TDC}">A partir do Starter: qualificação BANT/MEDDIC e agente Sofia</td>
              <td style="${TDC}">A partir do Básico: Copiloto de IA; sugestão de tarefas no Pro</td>
            </tr>
            <tr style="background: var(--muted);">
              <td style="${TDL}">Automações</td>
              <td style="${TDC}">A partir do Starter</td>
              <td style="${TDC}">Modelos de automação a partir do Básico</td>
            </tr>
            <tr>
              <td style="${TDL}">Prospecção de empresas</td>
              <td style="${TDC}">Créditos mensais de busca no Google Maps a partir do Starter</td>
              <td style="${TDC}">Pelo RD Station Marketing (inbound)</td>
            </tr>
            <tr style="background: var(--muted);">
              <td style="${TDL}">Modo offline no celular</td>
              <td style="${TDC}">✗ Só consulta das telas já abertas</td>
              <td style="${TDC}">App para celular em todos os planos</td>
            </tr>
            <tr>
              <td style="${TDL}">Marketing automation</td>
              <td style="${TDC}">✗ Não tem</td>
              <td style="${TDC}">✓ Pelo RD Station Marketing, integrado de forma nativa</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size: 0.8rem; color: var(--foreground); margin-top: 0.5rem;">Planos conferidos em 26/09/2026 nas páginas oficiais. RD Station: preços da cobrança mensal; no anual, Básico R$ 65,70 e Pro R$ 117,90 por usuário. Sirius: cobrança mensal; no anual há 20% de desconto.</p>
      </div>

      <h2>RD Station CRM tem WhatsApp integrado em 2026?</h2>

      <p>
        Tem. O RD Station CRM oferece recursos de venda pelo WhatsApp em todos os planos, inclusive o Free, e a partir do Pro salva os áudios das conversas. No Sirius, o WhatsApp entra a partir do Starter (R$ 67/mês), pelo integrador que você já contrata (Z-API, uazapi ou Evolution API), e no Business (R$ 397/mês) também pela API oficial da Meta; cada mensagem fica no histórico do cliente. Se o seu time precisa de WhatsApp no CRM sem pagar nada, o RD Station Free atende e o Sirius Gratuito não.
      </p>

      <h2>O RD Station CRM tem IA?</h2>

      <p>
        Tem, a partir do Básico: o Copiloto de IA e insights de relatórios, com sugestão de tarefas no Pro e priorização inteligente no Advanced. O Sirius também tem IA a partir do primeiro plano pago, o Starter, com outro foco: qualificar o lead pelos frameworks BANT e MEDDIC, sugerir o próximo passo e deixar o agente Sofia executar ações no funil, com cota mensal de 200 ações no Starter e 1.000 no Pro. Nenhum dos dois tem IA no plano gratuito.
      </p>

      <h2>Quanto custa cada um para um time de verdade?</h2>

      <div style="overflow-x: auto; margin: 2rem 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="background: var(--primary); color: #ffffff;">
              <th style="${TH} text-align: left;">Time</th>
              <th style="${TH}">Sirius CRM</th>
              <th style="${TH}">RD Station CRM Básico</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: var(--muted);">
              <td style="${TDL}">5 vendedores</td>
              <td style="${TDC} font-weight: 700;">R$ 67/mês (Starter)</td>
              <td style="${TDC}">R$ 365/mês</td>
            </tr>
            <tr>
              <td style="${TDL}">10 vendedores</td>
              <td style="${TDC} font-weight: 700;">R$ 147/mês (Pro)</td>
              <td style="${TDC}">R$ 730/mês</td>
            </tr>
            <tr style="background: var(--muted);">
              <td style="${TDL}">20 vendedores</td>
              <td style="${TDC} font-weight: 700;">R$ 397/mês (Business)</td>
              <td style="${TDC}">R$ 1.460/mês</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size: 0.8rem; color: var(--foreground); margin-top: 0.5rem;">Cobrança mensal dos dois. O plano Básico do RD Station não é o equivalente de todos os planos do Sirius; compare também os recursos da tabela anterior.</p>
      </div>

      <h2>Prós e contras</h2>

      <h3>Sirius CRM: pontos fortes</h3>
      <ul style="${LIST}">
        <li>Mensalidade por conta: 5 a 50 usuários sem multiplicar o preço</li>
        <li>IA de qualificação BANT/MEDDIC e agente Sofia a partir do Starter</li>
        <li>Prospecção de empresas pelo Google Maps com créditos mensais</li>
        <li>WhatsApp no CRM a partir do Starter, pelo seu integrador; API oficial da Meta no Business</li>
      </ul>

      <h3>Sirius CRM: pontos fracos</h3>
      <ul style="${LIST}">
        <li>Plano gratuito para só 2 usuários, sem IA, sem automação e sem WhatsApp</li>
        <li>WhatsApp no CRM só nos planos pagos; a API oficial, só no Business</li>
        <li>Sem marketing automation e sem integração nativa com o RD Station Marketing</li>
        <li>Comunidade menor que a do ecossistema RD Station</li>
      </ul>

      <h3>RD Station CRM: pontos fortes</h3>
      <ul style="${LIST}">
        <li>Plano Free para até 4 usuários, com recursos de WhatsApp</li>
        <li>Integração nativa com o RD Station Marketing: funil de marketing e vendas no mesmo ecossistema</li>
        <li>Copiloto de IA e modelos de automação desde o Básico</li>
        <li>Base grande de usuários PME no Brasil</li>
      </ul>

      <h3>RD Station CRM: pontos fracos</h3>
      <ul style="${LIST}">
        <li>Preço por usuário: o custo cresce linearmente com o time</li>
        <li>Plano Pro com mínimo de 4 usuários</li>
        <li>Plano Free com poucos campos personalizados e modelos de e-mail</li>
        <li>Foco em inbound: prospecção ativa depende de outras ferramentas</li>
      </ul>

      <h2>Quando usar o RD Station CRM?</h2>

      <p>O RD Station CRM faz sentido se:</p>
      <ul style="${LIST}">
        <li>Você já usa ou vai usar o RD Station Marketing</li>
        <li>Seus leads vêm de inbound: blog, SEO, landing pages</li>
        <li>Seu time tem até 4 pessoas e precisa de WhatsApp no CRM sem pagar</li>
        <li>Você quer marketing e vendas na mesma plataforma</li>
      </ul>

      <h2>Quando usar o Sirius CRM?</h2>

      <p>O Sirius CRM faz sentido se:</p>
      <ul style="${LIST}">
        <li>Seu time tem 5 ou mais vendedores e o preço por usuário pesa</li>
        <li>Você prospecta empresas ativamente, por Google Maps e visita</li>
        <li>Seus vendedores trabalham em campo, com sinal instável</li>
        <li>Você quer IA que qualifica o lead por BANT e MEDDIC</li>
        <li>Você quer um CRM só de vendas, sem a camada de marketing</li>
      </ul>

      <div style="background: var(--muted); border-left: 4px solid var(--fio-forte); padding: 1.5rem; border-radius: 0.75rem; margin: 2rem 0;">
        <p style="margin: 0; font-weight: 700; color: var(--foreground);">Dá para usar os dois?</p>
        <p style="margin: 0.5rem 0 0; color: var(--foreground);">Dá. Algumas empresas atraem e nutrem leads com o RD Station Marketing e passam os leads quentes para o Sirius, onde o time comercial prospecta, visita e acompanha. A ligação entre os dois é feita por webhook, n8n ou Zapier, disponíveis a partir do Pro do Sirius.</p>
      </div>

      <h2>Perguntas frequentes: Sirius CRM vs RD Station CRM</h2>

      <details style="${DETAILS}">
        <summary style="${SUMMARY}">RD Station CRM é gratuito em 2026?</summary>
        <p style="${ANSWER}">Tem um plano Free para até 4 usuários, com recursos de WhatsApp, 5 campos personalizados, 3 modelos de e-mail e 200 envios ou recebimentos de e-mail por mês. Automações e IA exigem os planos pagos. O Sirius Gratuito atende até 2 usuários, sem IA, sem automação e sem WhatsApp.</p>
      </details>

      <details style="${DETAILS}">
        <summary style="${SUMMARY}">Sirius CRM integra com RD Station Marketing?</summary>
        <p style="${ANSWER}">Não de forma nativa. Dá para conectar pelos webhooks e pela API do Sirius (plano Pro) ou por n8n e Zapier, levando os leads qualificados do RD Marketing para o Sirius. Se a integração nativa entre marketing e CRM é essencial, o combo RD Station Marketing e RD Station CRM é mais direto.</p>
      </details>

      <details style="${DETAILS}">
        <summary style="${SUMMARY}">Qual é melhor para uma equipe de vendas de 5 pessoas?</summary>
        <p style="${ANSWER}">Pelo preço, o Sirius: R$ 67/mês no Starter para os 5, com automação e IA, contra R$ 365/mês no Básico do RD Station. Se esse time vive de leads do RD Station Marketing, ou precisa de WhatsApp no CRM sem pagar nada, o RD Station pode compensar a diferença.</p>
      </details>

      <details style="${DETAILS} margin-bottom: 2rem;">
        <summary style="${SUMMARY}">Qual CRM tem melhor app para vendedores externos?</summary>
        <p style="${ANSWER}">Os dois têm app para celular. O do Sirius funciona offline: você registra visitas e atualiza negócios sem internet, e os dados sincronizam quando o sinal volta. É o que pesa para quem visita cliente em indústria, zona rural ou armazém.</p>
      </details>

      <div style="background: var(--muted); border: 1px solid var(--border); padding: 1.5rem; border-radius: 0.75rem; margin: 2rem 0; text-align: center;">
        <p style="font-weight: 700; color: var(--foreground); font-size: 1.1rem; margin: 0 0 0.75rem;">Teste o Sirius CRM</p>
        <p style="color: var(--foreground); margin: 0 0 1rem;">14 dias do Pro grátis, sem cartão de crédito.</p>
        <p><strong><a href="/register" style="color: var(--foreground); text-decoration: underline;">Criar conta grátis →</a></strong></p>
      </div>

      <hr style="margin: 3rem 0; border: none; border-top: 1px solid var(--border);" />
      <strong>Última atualização:</strong> 26 de setembro de 2026<br/>
      <strong>Autor:</strong> Equipe Sirius CRM<br/>
      <strong>Tempo de leitura:</strong> 7 minutos
    `,
  titleEn: 'Sirius CRM vs RD Station CRM 2026: Full Comparison for Brazilian SMBs',
  excerptEn: 'Sirius CRM or RD Station CRM? Reviewed in September 2026: per-account against per-user pricing, free plan, AI, WhatsApp, automation and marketing integration.',
  keywordsEn: ['sirius crm vs rd station', 'rd station crm alternative', 'best crm brazil smb', 'crm with whatsapp brazil', 'rd station crm review 2026'],
  contentEn: `
      <p>
        RD Station CRM and Sirius CRM are two Brazilian CRMs, billed in reais, for SMBs. RD Station was born in the marketing ecosystem and integrates natively with RD Station Marketing. Sirius was born in active selling: prospecting, field visits and customer follow-up. The difference that weighs most on the budget, though, is another one: <strong>RD Station charges per user, and Sirius charges per account</strong>.
      </p>

      <p>
        This comparison was reviewed on September 26, 2026 against the plans both vendors published on that date.
      </p>

      <div class="not-prose" style="background: var(--primary); padding: 1.5rem; border-radius: 0.75rem; margin: 2rem 0;">
        <p style="margin: 0 0 0.75rem; font-weight: 700; font-size: 1.05rem; color: var(--primary-foreground);">⚡ Quick answer</p>
        <ul style="margin: 0; padding-left: 1.25rem; line-height: 2; color: #ffffff;">
          <li><strong style="color: var(--primary-foreground);">RD Station CRM</strong>: Free plan for up to 4 users, with WhatsApp sales features. Paid plans per user: Basic R$ 73/user/month, Pro R$ 131/user/month (minimum of 4). Native integration with RD Station Marketing.</li>
          <li><strong style="color: var(--primary-foreground);">Sirius CRM</strong>: Free plan for up to 2 users, with no AI, no automation and no WhatsApp. Paid plans per account: Starter R$ 67/month (up to 5 users), Pro R$ 147/month (up to 15), Business R$ 397/month (up to 50). WhatsApp in the CRM on every paid plan: through the integrator you already use from Starter, and also through the official API on Business.</li>
          <li>For a team of 5: Sirius Starter R$ 67/month in total; RD Station Basic 5 × R$ 73 = R$ 365/month.</li>
        </ul>
      </div>

      <h2>Sirius CRM or RD Station CRM: what does each one focus on?</h2>

      <p>
        RD Station CRM was built as a companion to RD Station Marketing: its strength is taking the leads marketing qualified and moving them through the pipeline. It is an inbound CRM. Sirius was built for active selling: company prospecting through Google Maps, field visits with offline mode, customer follow-up and AI qualification.
      </p>

      <div style="overflow-x: auto; margin: 2rem 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="background: var(--primary); color: #ffffff;">
              <th style="${TH} text-align: left;">Criterion</th>
              <th style="${TH}">Sirius CRM</th>
              <th style="${TH}">RD Station CRM</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: var(--muted);">
              <td style="${TDL}">Free plan</td>
              <td style="${TDC}">2 users, 250 contacts, 100 active deals</td>
              <td style="${TDC}">4 users, 5 custom fields, 3 email templates</td>
            </tr>
            <tr>
              <td style="${TDL}">Billing model</td>
              <td style="${TDC}">Per account: R$ 67, R$ 147 or R$ 397/month</td>
              <td style="${TDC}">Per user: R$ 73 (Basic) or R$ 131 (Pro) per month</td>
            </tr>
            <tr style="background: var(--muted);">
              <td style="${TDL}">WhatsApp</td>
              <td style="${TDC}">Business plan: official Meta API, conversations in the history</td>
              <td style="${TDC}">WhatsApp sales features from Free; saves audio messages from Pro</td>
            </tr>
            <tr>
              <td style="${TDL}">Artificial intelligence</td>
              <td style="${TDC}">From Starter: BANT/MEDDIC qualification and the Sofia agent</td>
              <td style="${TDC}">From Basic: AI Copilot; task suggestions on Pro</td>
            </tr>
            <tr style="background: var(--muted);">
              <td style="${TDL}">Automations</td>
              <td style="${TDC}">From Starter</td>
              <td style="${TDC}">Automation templates from Basic</td>
            </tr>
            <tr>
              <td style="${TDL}">Company prospecting</td>
              <td style="${TDC}">Monthly Google Maps search credits from Starter</td>
              <td style="${TDC}">Through RD Station Marketing (inbound)</td>
            </tr>
            <tr style="background: var(--muted);">
              <td style="${TDL}">Offline mode on mobile</td>
              <td style="${TDC}">✗ Only viewing screens already opened</td>
              <td style="${TDC}">Mobile app on every plan</td>
            </tr>
            <tr>
              <td style="${TDL}">Marketing automation</td>
              <td style="${TDC}">✗ None</td>
              <td style="${TDC}">✓ Through RD Station Marketing, natively integrated</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size: 0.8rem; color: var(--foreground); margin-top: 0.5rem;">Plans checked on 09/26/2026 on the official pages. RD Station: monthly billing prices; billed annually, Basic is R$ 65.70 and Pro R$ 117.90 per user. Sirius: monthly billing; annual billing takes 20% off.</p>
      </div>

      <h2>Does RD Station CRM have WhatsApp integration in 2026?</h2>

      <p>
        Yes. RD Station CRM offers WhatsApp sales features on every plan, including Free, and from Pro it saves audio messages. In Sirius, WhatsApp comes from Starter (R$ 67/month), through the integrator you already pay for (Z-API, uazapi or Evolution API), and on Business (R$ 397/month) also through the official Meta API; every message lands in the customer history. If your team needs WhatsApp in the CRM without paying anything, RD Station Free does it and Sirius Free does not.
      </p>

      <h2>Does RD Station CRM have AI?</h2>

      <p>
        Yes, from Basic: the AI Copilot and report insights, with task suggestions on Pro and smart prioritization on Advanced. Sirius also has AI from its first paid plan, Starter, with a different focus: qualifying the lead with the BANT and MEDDIC frameworks, suggesting the next step and letting the Sofia agent run actions in the pipeline, with a monthly quota of 200 actions on Starter and 1,000 on Pro. Neither has AI on the free plan.
      </p>

      <h2>How much does each cost for a real team?</h2>

      <div style="overflow-x: auto; margin: 2rem 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="background: var(--primary); color: #ffffff;">
              <th style="${TH} text-align: left;">Team</th>
              <th style="${TH}">Sirius CRM</th>
              <th style="${TH}">RD Station CRM Basic</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: var(--muted);">
              <td style="${TDL}">5 salespeople</td>
              <td style="${TDC} font-weight: 700;">R$ 67/month (Starter)</td>
              <td style="${TDC}">R$ 365/month</td>
            </tr>
            <tr>
              <td style="${TDL}">10 salespeople</td>
              <td style="${TDC} font-weight: 700;">R$ 147/month (Pro)</td>
              <td style="${TDC}">R$ 730/month</td>
            </tr>
            <tr style="background: var(--muted);">
              <td style="${TDL}">20 salespeople</td>
              <td style="${TDC} font-weight: 700;">R$ 397/month (Business)</td>
              <td style="${TDC}">R$ 1,460/month</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size: 0.8rem; color: var(--foreground); margin-top: 0.5rem;">Monthly billing for both. RD Station Basic is not the equivalent of every Sirius plan; compare the features in the previous table too.</p>
      </div>

      <h2>Pros and cons</h2>

      <h3>Sirius CRM: strengths</h3>
      <ul style="${LIST}">
        <li>Per-account fee: 5 to 50 users without multiplying the price</li>
        <li>BANT/MEDDIC qualification AI and the Sofia agent from Starter</li>
        <li>Company prospecting through Google Maps with monthly credits</li>
        <li>WhatsApp in the CRM from Starter, through your integrator; official Meta API on Business</li>
      </ul>

      <h3>Sirius CRM: weaknesses</h3>
      <ul style="${LIST}">
        <li>Free plan for only 2 users, with no AI, automation or WhatsApp</li>
        <li>WhatsApp in the CRM only on paid plans; the official API only on Business</li>
        <li>No marketing automation and no native RD Station Marketing integration</li>
        <li>Smaller community than the RD Station ecosystem</li>
      </ul>

      <h3>RD Station CRM: strengths</h3>
      <ul style="${LIST}">
        <li>Free plan for up to 4 users, with WhatsApp features</li>
        <li>Native RD Station Marketing integration: marketing and sales in one ecosystem</li>
        <li>AI Copilot and automation templates from Basic</li>
        <li>Large SMB user base in Brazil</li>
      </ul>

      <h3>RD Station CRM: weaknesses</h3>
      <ul style="${LIST}">
        <li>Per-user pricing: cost grows linearly with the team</li>
        <li>Pro plan requires at least 4 users</li>
        <li>Free plan with few custom fields and email templates</li>
        <li>Inbound focus: active prospecting depends on other tools</li>
      </ul>

      <h2>When to use RD Station CRM?</h2>

      <p>RD Station CRM makes sense if:</p>
      <ul style="${LIST}">
        <li>You already use or plan to use RD Station Marketing</li>
        <li>Your leads come from inbound: blog, SEO, landing pages</li>
        <li>Your team has up to 4 people and needs WhatsApp in the CRM for free</li>
        <li>You want marketing and sales on the same platform</li>
      </ul>

      <h2>When to use Sirius CRM?</h2>

      <p>Sirius CRM makes sense if:</p>
      <ul style="${LIST}">
        <li>Your team has 5 or more salespeople and per-user pricing hurts</li>
        <li>You prospect companies actively, through Google Maps and visits</li>
        <li>Your salespeople work in the field, with unstable signal</li>
        <li>You want AI that qualifies leads with BANT and MEDDIC</li>
        <li>You want a sales-only CRM, without the marketing layer</li>
      </ul>

      <div style="background: var(--muted); border-left: 4px solid var(--fio-forte); padding: 1.5rem; border-radius: 0.75rem; margin: 2rem 0;">
        <p style="margin: 0; font-weight: 700; color: var(--foreground);">Can you use both?</p>
        <p style="margin: 0.5rem 0 0; color: var(--foreground);">Yes. Some companies attract and nurture leads with RD Station Marketing and pass the hot leads to Sirius, where the sales team prospects, visits and follows up. The link between them runs through webhooks, n8n or Zapier, available from Sirius Pro.</p>
      </div>

      <h2>FAQ: Sirius CRM vs RD Station CRM</h2>

      <details style="${DETAILS}">
        <summary style="${SUMMARY}">Is RD Station CRM free in 2026?</summary>
        <p style="${ANSWER}">It has a Free plan for up to 4 users, with WhatsApp features, 5 custom fields, 3 email templates and 200 emails sent or received per month. Automations and AI require paid plans. Sirius Free covers up to 2 users, with no AI, automation or WhatsApp.</p>
      </details>

      <details style="${DETAILS}">
        <summary style="${SUMMARY}">Does Sirius CRM integrate with RD Station Marketing?</summary>
        <p style="${ANSWER}">Not natively. You can connect them through Sirius webhooks and API (Pro plan) or through n8n and Zapier, moving qualified leads from RD Marketing into Sirius. If native integration between marketing automation and CRM is essential, the RD Station Marketing plus RD Station CRM combo is more direct.</p>
      </details>

      <details style="${DETAILS}">
        <summary style="${SUMMARY}">Which is better for a 5-person sales team?</summary>
        <p style="${ANSWER}">On price, Sirius: R$ 67/month on Starter for all 5, with automation and AI, against R$ 365/month on RD Station Basic. If that team lives on RD Station Marketing leads, or needs WhatsApp in the CRM without paying anything, RD Station can be worth the difference.</p>
      </details>

      <details style="${DETAILS} margin-bottom: 2rem;">
        <summary style="${SUMMARY}">Which CRM has the better app for field reps?</summary>
        <p style="${ANSWER}">Both have mobile apps. Sirius works offline: you log visits and update deals without internet, and the data syncs when the signal returns. That is what matters for reps who visit clients in industrial zones, rural areas or warehouses.</p>
      </details>

      <div style="background: var(--muted); border: 1px solid var(--border); padding: 1.5rem; border-radius: 0.75rem; margin: 2rem 0; text-align: center;">
        <p style="font-weight: 700; color: var(--foreground); font-size: 1.1rem; margin: 0 0 0.75rem;">Try Sirius CRM</p>
        <p style="color: var(--foreground); margin: 0 0 1rem;">14 days of Pro free, no credit card.</p>
        <p><strong><a href="/en/register" style="color: var(--foreground); text-decoration: underline;">Create a free account →</a></strong></p>
      </div>

      <hr style="margin: 3rem 0; border: none; border-top: 1px solid var(--border);" />
      <strong>Last updated:</strong> September 26, 2026<br/>
      <strong>Author:</strong> Sirius CRM Team<br/>
      <strong>Read time:</strong> 7 minutes
    `
}
