import { BlogPost } from '../../blog-types'

export const post: BlogPost = {
  slug: 'whatsapp-api-oficial-meta-crm',
  title: 'WhatsApp API Oficial: O Fim das Contas Bloqueadas e Como Usar no CRM em 2026',
  excerpt: 'Entenda por que a Meta está banindo integrações não oficiais, como a API Oficial do WhatsApp Business funciona e como conectar ao seu CRM sem risco de perder o número.',
  date: '2026-04-27',
  lastModified: '2026-04-27',
  category: 'Ferramentas',
  image: '/images/blog/whatsapp-api-oficial-meta-crm.webp',
  author: 'Equipe Sirius CRM',
  relatedSlugs: [
    'crm-com-whatsapp-integrado',
    'whatsapp-vendas-b2b-estrategias',
    'automacao-vendas-agentes-ia',
  ],
  content: `
<p>
  Em 2026, usar o WhatsApp para vender sem a <strong>API Oficial da Meta</strong> é como dirigir sem cinto: funciona até o dia que não funciona mais. Milhares de empresas brasileiras descobriram isso da pior forma — acordaram com o número bloqueado, clientes sem atendimento e meses de histórico de conversas perdidos.
</p>

<p>
  A Meta deixou de fechar os olhos para integrações não autorizadas. Ferramentas como Evolution API, Baileys e Whatsmeow — que funcionavam conectando o WhatsApp Web de forma não oficial — estão sendo detectadas e banidas em escala crescente. Se o seu CRM usa qualquer uma dessas tecnologias, o risco é real e imediato.
</p>

<p>
  Neste artigo você vai entender exatamente o que é a API Oficial do WhatsApp Business, por que ela é a única integração segura, como funciona na prática e como conectá-la ao seu CRM para nunca mais perder um número.
</p>

<div style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border-radius: 1rem; padding: 1.75rem 2rem; margin: 2rem 0;">
  <p style="font-size: 0.75rem; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 0.75rem;">TL;DR — Leitura de 30 segundos</p>
  <ul style="margin: 0; padding-left: 1.25rem; space-y: 0.5rem;">
    <li style="color: #e4e4e7; font-size: 0.9375rem; margin-bottom: 0.5rem;">A Meta está banindo ativamente contas que usam APIs não oficiais (Evolution API, Baileys, Whatsmeow)</li>
    <li style="color: #e4e4e7; font-size: 0.9375rem; margin-bottom: 0.5rem;">A API Oficial (Meta Cloud API) é a única integração homologada — sem risco de banimento</li>
    <li style="color: #e4e4e7; font-size: 0.9375rem; margin-bottom: 0.5rem;">Requer Meta Business Manager verificada + número dedicado + app no Facebook Developers</li>
    <li style="color: #e4e4e7; font-size: 0.9375rem;">O Sirius CRM é um dos únicos CRMs brasileiros com integração nativa à API Oficial</li>
  </ul>
</div>

<div class="callout-stat">
  <p><strong>📊 Dado de impacto:</strong> Segundo o próprio WhatsApp Help Center, contas que violam os Termos de Uso através de automações não autorizadas estão sujeitas a <strong>banimento permanente sem possibilidade de recurso</strong>. Em 2025, estimativas do setor apontam que mais de 40.000 números comerciais brasileiros foram bloqueados por uso de APIs não oficiais.</p>
</div>

<h2>O que é a API Oficial do WhatsApp Business?</h2>

<p>
  A <strong>WhatsApp Business API</strong> — também chamada de <strong>Meta Cloud API</strong> ou <strong>WABA (WhatsApp Business Account)</strong> — é a interface oficial desenvolvida e mantida pela Meta para permitir que empresas integrem o WhatsApp em seus sistemas de forma autorizada.
</p>

<p>
  Diferente do WhatsApp Web (que espelha um celular) ou do WhatsApp Business App (limitado a um dispositivo), a API Oficial:
</p>

<ul>
  <li>Roda em servidores da Meta, não depende de celular conectado</li>
  <li>Opera 24 horas por dia, 7 dias por semana sem interrupções</li>
  <li>Permite múltiplos atendentes simultâneos no mesmo número</li>
  <li>Está dentro dos Termos de Uso do WhatsApp — sem risco de banimento</li>
  <li>Suporta templates de mensagem aprovados pela Meta para comunicação proativa</li>
</ul>

<div class="callout-tip">
  <p><strong>💡 Dica importante:</strong> A API Oficial usa um número de telefone dedicado que <em>nunca pode ter sido usado no WhatsApp antes</em>. Isso significa um chip virgem — não é possível migrar um número que já tem histórico no WhatsApp pessoal ou Business App.</p>
</div>

<h2>Por que a Meta está banindo APIs não oficiais?</h2>

<p>
  Entender a motivação da Meta ajuda a entender por que o problema só vai piorar — não melhorar.
</p>

<p>
  Ferramentas como Evolution API, Baileys, Whatsmeow e WPPConnect funcionam fazendo engenharia reversa do protocolo do WhatsApp Web. Em vez de usar a API oficial, elas simulam um navegador se conectando à versão web do WhatsApp e capturam os dados diretamente. A Meta proíbe explicitamente isso nos Termos de Serviço, seção 4 ("Uso Aceitável").
</p>

<div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0;">
  <p style="font-weight: 700; color: #9a3412; margin: 0 0 0.75rem;">⚠️ Por que a Meta está agindo agora com mais força?</p>
  <div style="display: grid; gap: 0.75rem;">
    <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
      <span style="color: #c2410c; font-weight: 700; shrink: 0;">1.</span>
      <p style="margin: 0; color: #7c2d12; font-size: 0.9375rem;"><strong>Fraude e spam em escala:</strong> APIs não oficiais são a principal ferramenta de golpistas que disparam mensagens em massa fingindo ser bancos, Correios e órgãos governamentais.</p>
    </div>
    <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
      <span style="color: #c2410c; font-weight: 700; shrink: 0;">2.</span>
      <p style="margin: 0; color: #7c2d12; font-size: 0.9375rem;"><strong>Receita:</strong> A Meta monetiza a API Oficial por volume de conversas. Cada empresa que usa a versão gratuita não oficial é receita perdida.</p>
    </div>
    <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
      <span style="color: #c2410c; font-weight: 700; shrink: 0;">3.</span>
      <p style="margin: 0; color: #7c2d12; font-size: 0.9375rem;"><strong>Regulação:</strong> Com a LGPD e o GDPR europeu, a Meta precisa controlar o fluxo de dados que passa pelos seus servidores. APIs não oficiais criam um buraco negro de compliance.</p>
    </div>
    <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
      <span style="color: #c2410c; font-weight: 700; shrink: 0;">4.</span>
      <p style="margin: 0; color: #7c2d12; font-size: 0.9375rem;"><strong>Detecção melhorou:</strong> Os algoritmos de detecção de comportamento não humano ficaram muito mais sofisticados em 2025. Padrões de digitação uniformes, envio em lote e conexões via servidor são facilmente identificados.</p>
    </div>
  </div>
</div>

<h2>API Oficial vs APIs não oficiais: comparação honesta</h2>

<div style="overflow-x: auto; margin: 1.5rem 0;">
  <table style="width: 100%; border-collapse: collapse; font-size: 0.9375rem;">
    <thead>
      <tr style="background: #f4f4f5;">
        <th style="padding: 0.875rem 1rem; text-align: left; border-bottom: 2px solid #e4e4e7; color: #3f3f46; font-weight: 700;">Critério</th>
        <th style="padding: 0.875rem 1rem; text-align: center; border-bottom: 2px solid #e4e4e7; color: #16a34a; font-weight: 700;">API Oficial Meta</th>
        <th style="padding: 0.875rem 1rem; text-align: center; border-bottom: 2px solid #e4e4e7; color: #dc2626; font-weight: 700;">Evolution / Baileys / Whatsmeow</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Risco de banimento</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ Zero</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">🔴 Alto e crescente</td>
      </tr>
      <tr style="background: #fafafa; border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Termos de uso da Meta</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ Autorizado</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">🔴 Violação explícita</td>
      </tr>
      <tr style="border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Depende de celular conectado</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ Não</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">🔴 Sim</td>
      </tr>
      <tr style="background: #fafafa; border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Uptime garantido</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ 99,9% (SLA Meta)</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">⚠️ Variável</td>
      </tr>
      <tr style="border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Status de entrega (entregue/lido)</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ Nativo</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">⚠️ Parcial</td>
      </tr>
      <tr style="background: #fafafa; border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Templates de mensagem proativa</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ Suportado</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">🔴 Não (viola ToS)</td>
      </tr>
      <tr style="border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Multiagente no mesmo número</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ Nativo</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">⚠️ Via workaround</td>
      </tr>
      <tr style="background: #fafafa; border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Custo</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">⚠️ Por conversa (primeiras 1.000/mês grátis)</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ Gratuito (mas com risco)</td>
      </tr>
      <tr style="border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Complexidade de setup</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">⚠️ Requer Meta Business Manager verificada</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ Mais simples</td>
      </tr>
      <tr style="background: #fafafa;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Conformidade LGPD</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ Dados processados pela Meta</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">🔴 Responsabilidade total sua</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>Como funciona a API Oficial na prática</h2>

<p>
  A Meta Cloud API funciona de forma completamente diferente das integrações via WhatsApp Web. Em vez de simular um usuário humano navegando pelo WhatsApp, ela se comunica diretamente com os servidores da Meta via HTTP — o mesmo protocolo de qualquer API REST moderna.
</p>

<h3>O fluxo de uma conversa via API Oficial</h3>

<div style="display: grid; gap: 1rem; margin: 1.5rem 0;">
  <div style="display: flex; gap: 1rem; align-items: flex-start; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.75rem; padding: 1.25rem;">
    <div style="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center shrink-0; background: #16a34a; color: white; font-weight: 700; font-size: 0.875rem; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">1</div>
    <div>
      <p style="margin: 0 0 0.25rem; font-weight: 600; color: #15803d;">Cliente envia mensagem</p>
      <p style="margin: 0; color: #166534; font-size: 0.875rem;">O cliente digita uma mensagem no WhatsApp normalmente. Para ele, não há diferença alguma.</p>
    </div>
  </div>
  <div style="display: flex; gap: 1rem; align-items: flex-start; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.75rem; padding: 1.25rem;">
    <div style="background: #16a34a; color: white; font-weight: 700; font-size: 0.875rem; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">2</div>
    <div>
      <p style="margin: 0 0 0.25rem; font-weight: 600; color: #15803d;">Meta recebe e encaminha via Webhook</p>
      <p style="margin: 0; color: #166534; font-size: 0.875rem;">Os servidores da Meta recebem a mensagem e fazem um POST para o webhook configurado no seu sistema — em milissegundos.</p>
    </div>
  </div>
  <div style="display: flex; gap: 1rem; align-items: flex-start; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.75rem; padding: 1.25rem;">
    <div style="background: #16a34a; color: white; font-weight: 700; font-size: 0.875rem; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">3</div>
    <div>
      <p style="margin: 0 0 0.25rem; font-weight: 600; color: #15803d;">CRM processa e exibe</p>
      <p style="margin: 0; color: #166534; font-size: 0.875rem;">O CRM recebe o webhook, identifica o contato, cria a conversa e notifica o vendedor responsável — tudo em tempo real.</p>
    </div>
  </div>
  <div style="display: flex; gap: 1rem; align-items: flex-start; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.75rem; padding: 1.25rem;">
    <div style="background: #16a34a; color: white; font-weight: 700; font-size: 0.875rem; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">4</div>
    <div>
      <p style="margin: 0 0 0.25rem; font-weight: 600; color: #15803d;">Vendedor responde pelo CRM</p>
      <p style="margin: 0; color: #166534; font-size: 0.875rem;">O vendedor digita a resposta no CRM. O sistema faz uma chamada à API da Meta, que entrega a mensagem ao cliente via WhatsApp.</p>
    </div>
  </div>
  <div style="display: flex; gap: 1rem; align-items: flex-start; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.75rem; padding: 1.25rem;">
    <div style="background: #16a34a; color: white; font-weight: 700; font-size: 0.875rem; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">5</div>
    <div>
      <p style="margin: 0 0 0.25rem; font-weight: 600; color: #15803d;">Status em tempo real</p>
      <p style="margin: 0; color: #166534; font-size: 0.875rem;">A Meta envia webhooks de status: mensagem enviada → entregue → lida. O CRM atualiza os ícones de entrega automaticamente.</p>
    </div>
  </div>
</div>

<h2>O modelo de cobrança da API Oficial</h2>

<p>
  Uma das principais dúvidas de quem está migrando é sobre o custo. A Meta cobra por <strong>conversas</strong>, não por mensagem individual. Uma conversa é uma janela de 24 horas que se abre quando há interação.
</p>

<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0;">
  <p style="font-weight: 700; color: #1e293b; margin: 0 0 1rem;">💰 Tipos de conversa e janelas</p>
  <div style="display: grid; gap: 0.75rem;">
    <div style="display: flex; justify-content: space-between; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.875rem 1rem;">
      <div>
        <p style="font-weight: 600; color: #0f172a; margin: 0 0 0.25rem;">Conversa de Serviço</p>
        <p style="color: #64748b; font-size: 0.8125rem; margin: 0;">Cliente inicia contato — janela de 24h para respostas livres</p>
      </div>
      <span style="color: #16a34a; font-weight: 700; font-size: 0.9375rem;">~R$ 0,06</span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.875rem 1rem;">
      <div>
        <p style="font-weight: 600; color: #0f172a; margin: 0 0 0.25rem;">Conversa de Marketing</p>
        <p style="color: #64748b; font-size: 0.8125rem; margin: 0;">Empresa inicia com template de promoção/engajamento</p>
      </div>
      <span style="color: #f59e0b; font-weight: 700; font-size: 0.9375rem;">~R$ 0,25</span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.875rem 1rem;">
      <div>
        <p style="font-weight: 600; color: #0f172a; margin: 0 0 0.25rem;">Conversa de Utilidade</p>
        <p style="color: #64748b; font-size: 0.8125rem; margin: 0;">Templates transacionais (confirmação de pedido, boleto, etc.)</p>
      </div>
      <span style="color: #3b82f6; font-weight: 700; font-size: 0.9375rem;">~R$ 0,05</span>
    </div>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.5rem; padding: 0.875rem 1rem;">
      <p style="font-weight: 600; color: #15803d; margin: 0 0 0.25rem;">✅ 1.000 conversas de serviço/mês — GRÁTIS</p>
      <p style="color: #166534; font-size: 0.8125rem; margin: 0;">Ideal para empresas que recebem contato inbound dos clientes</p>
    </div>
  </div>
</div>

<div class="callout-tip">
  <p><strong>💡 Na prática:</strong> Para a maioria das empresas B2B brasileiras com atendimento predominantemente inbound (cliente que chama primeiro), o custo mensal da API Oficial fica entre R$ 30 e R$ 150 — muito abaixo do custo de ter o número bloqueado uma única vez.</p>
</div>

<h2>Pré-requisitos para usar a API Oficial</h2>

<p>
  Antes de começar a configuração, você precisa garantir que tem em mãos:
</p>

<div style="display: grid; gap: 0.75rem; margin: 1.5rem 0;">
  <div style="display: flex; gap: 0.875rem; align-items: flex-start; padding: 1rem; background: white; border: 1px solid #e4e4e7; border-radius: 0.75rem;">
    <span style="font-size: 1.375rem; flex-shrink: 0;">📱</span>
    <div>
      <p style="font-weight: 600; color: #18181b; margin: 0 0 0.25rem;">Chip virgem</p>
      <p style="color: #71717a; font-size: 0.875rem; margin: 0;">Um número de telefone que <strong>nunca foi usado</strong> no WhatsApp — nem no app pessoal, nem no Business App. Qualquer histórico anterior impede o registro na API.</p>
    </div>
  </div>
  <div style="display: flex; gap: 0.875rem; align-items: flex-start; padding: 1rem; background: white; border: 1px solid #e4e4e7; border-radius: 0.75rem;">
    <span style="font-size: 1.375rem; flex-shrink: 0;">🏢</span>
    <div>
      <p style="font-weight: 600; color: #18181b; margin: 0 0 0.25rem;">Meta Business Manager verificada</p>
      <p style="color: #71717a; font-size: 0.875rem; margin: 0;">Conta empresarial na Meta com verificação de negócio concluída (CNPJ). Sem verificação, você não consegue gerar tokens de sistema.</p>
    </div>
  </div>
  <div style="display: flex; gap: 0.875rem; align-items: flex-start; padding: 1rem; background: white; border: 1px solid #e4e4e7; border-radius: 0.75rem;">
    <span style="font-size: 1.375rem; flex-shrink: 0;">👨‍💻</span>
    <div>
      <p style="font-weight: 600; color: #18181b; margin: 0 0 0.25rem;">Acesso ao Facebook Developers</p>
      <p style="color: #71717a; font-size: 0.875rem; margin: 0;">Você vai precisar criar um app do tipo "Business" em developers.facebook.com e adicionar o produto WhatsApp a ele.</p>
    </div>
  </div>
  <div style="display: flex; gap: 0.875rem; align-items: flex-start; padding: 1rem; background: white; border: 1px solid #e4e4e7; border-radius: 0.75rem;">
    <span style="font-size: 1.375rem; flex-shrink: 0;">🔑</span>
    <div>
      <p style="font-weight: 600; color: #18181b; margin: 0 0 0.25rem;">Token de sistema permanente</p>
      <p style="color: #71717a; font-size: 0.875rem; margin: 0;">Tokens temporários expiram em 24 horas. Para uso em produção, você precisa criar um usuário do sistema no Meta Business Manager e gerar um token permanente com as permissões corretas.</p>
    </div>
  </div>
</div>

<div class="callout-warning">
  <p><strong>⚠️ Cuidado com a verificação da Meta Business Manager:</strong> O processo de verificação pode levar de 2 a 10 dias úteis e às vezes é negado na primeira tentativa. Inicie o processo antes de precisar urgente. Acesse <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer">business.facebook.com/settings</a> para checar o status da sua conta.</p>
</div>

<h2>Como conectar a API Oficial ao seu CRM</h2>

<p>
  Com os pré-requisitos em mãos, a configuração no CRM envolve 4 informações principais que você obtém no painel do Facebook Developers:
</p>

<ol style="margin: 1.5rem 0; padding-left: 1.5rem; display: grid; gap: 1rem;">
  <li style="color: #3f3f46;">
    <strong style="color: #18181b;">Phone Number ID</strong> — identificador único do seu número na plataforma Meta. Encontrado em: Facebook Developers → seu app → WhatsApp → Configuração de API.
  </li>
  <li style="color: #3f3f46;">
    <strong style="color: #18181b;">Business Account ID (WABA ID)</strong> — ID da sua conta WhatsApp Business. Na mesma tela do Phone Number ID.
  </li>
  <li style="color: #3f3f46;">
    <strong style="color: #18181b;">Access Token permanente</strong> — gerado via usuário do sistema no Meta Business Manager com permissões <code style="background: #f4f4f5; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.8125rem;">whatsapp_business_messaging</code> e <code style="background: #f4f4f5; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.8125rem;">whatsapp_business_management</code>.
  </li>
  <li style="color: #3f3f46;">
    <strong style="color: #18181b;">Webhook Verify Token</strong> — uma string que você cria e que a Meta usa para validar seu endpoint de webhook.
  </li>
</ol>

<p>
  No <strong>Sirius CRM</strong>, basta acessar <strong>Configurações → Integrações → WhatsApp Oficial</strong>, preencher esses 4 campos e ativar. O sistema configura o webhook automaticamente e já começa a receber mensagens.
</p>

<div class="callout-success">
  <p><strong>✅ Não quer configurar sozinho?</strong> A equipe do Sirius CRM oferece o serviço de implantação completa por <strong>R$ 297 (pagamento único)</strong>. Incluindo: criação do app no Facebook Developers, geração do token permanente, configuração do webhook e teste completo. <a href="/dashboard/settings/integrations/whatsapp-official">Saiba mais aqui</a>.</p>
</div>

<h2>O que muda no dia a dia da equipe de vendas?</h2>

<p>
  Para quem já usava WhatsApp no trabalho, a diferença mais percebida na prática é o <strong>chat center multiagente</strong>. Em vez de cada vendedor ter seu próprio número, a equipe inteira atende pelo mesmo número oficial da empresa — com histórico centralizado, distribuição de atendimento e visibilidade para o gestor.
</p>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin: 1.5rem 0;">
  <div style="background: white; border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 1.25rem;">
    <div style="font-size: 1.5rem; margin-bottom: 0.75rem;">⚡</div>
    <p style="font-weight: 600; color: #18181b; margin: 0 0 0.5rem;">Status em tempo real</p>
    <p style="color: #71717a; font-size: 0.875rem; margin: 0;">Veja exatamente quando a mensagem foi entregue e lida, diretamente na timeline do negócio no CRM.</p>
  </div>
  <div style="background: white; border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 1.25rem;">
    <div style="font-size: 1.5rem; margin-bottom: 0.75rem;">👥</div>
    <p style="font-weight: 600; color: #18181b; margin: 0 0 0.5rem;">Atendimento em equipe</p>
    <p style="color: #71717a; font-size: 0.875rem; margin: 0;">Múltiplos vendedores atendem pelo mesmo número sem conflito, com histórico compartilhado.</p>
  </div>
  <div style="background: white; border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 1.25rem;">
    <div style="font-size: 1.5rem; margin-bottom: 0.75rem;">🔔</div>
    <p style="font-weight: 600; color: #18181b; margin: 0 0 0.5rem;">Notificações inteligentes</p>
    <p style="color: #71717a; font-size: 0.875rem; margin: 0;">Alertas de novas mensagens diretamente no CRM. Nenhuma conversa fica sem resposta por descuido.</p>
  </div>
  <div style="background: white; border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 1.25rem;">
    <div style="font-size: 1.5rem; margin-bottom: 0.75rem;">📋</div>
    <p style="font-weight: 600; color: #18181b; margin: 0 0 0.5rem;">Histórico vinculado ao contato</p>
    <p style="color: #71717a; font-size: 0.875rem; margin: 0;">Todo o histórico de WhatsApp fica na ficha do contato no CRM. Troca de vendedor? Contexto preservado.</p>
  </div>
  <div style="background: white; border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 1.25rem;">
    <div style="font-size: 1.5rem; margin-bottom: 0.75rem;">🕐</div>
    <p style="font-weight: 600; color: #18181b; margin: 0 0 0.5rem;">24/7 sem celular</p>
    <p style="color: #71717a; font-size: 0.875rem; margin: 0;">Não depende de nenhum celular ligado. Férias, fim de semana, troca de aparelho — o número continua operando.</p>
  </div>
  <div style="background: white; border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 1.25rem;">
    <div style="font-size: 1.5rem; margin-bottom: 0.75rem;">📊</div>
    <p style="font-weight: 600; color: #18181b; margin: 0 0 0.5rem;">Métricas de atendimento</p>
    <p style="color: #71717a; font-size: 0.875rem; margin: 0;">Tempo médio de resposta, volume por vendedor, conversas abertas — tudo mensurável.</p>
  </div>
</div>

<h2>Perguntas frequentes sobre a API Oficial</h2>

<div style="display: grid; gap: 0.875rem; margin: 1.5rem 0;">
  <details style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 1.25rem; cursor: pointer;">
    <summary style="font-weight: 600; color: #18181b; list-style: none; display: flex; justify-content: space-between; align-items: center;">
      Posso migrar meu número atual para a API Oficial?
    </summary>
    <p style="color: #52525b; font-size: 0.9375rem; margin: 0.875rem 0 0; line-height: 1.6;">
      Não diretamente. O número a ser registrado na API Oficial precisa ser virgem — nunca ter sido associado ao WhatsApp. No entanto, existe um processo de migração de número ("Phone Number Migration") que em alguns casos permite mover um número existente do WhatsApp Business App para a API, mas o processo é burocrático e nem sempre aprovado pela Meta. O caminho mais comum é usar um chip novo para a API e, eventualmente, comunicar clientes sobre o novo número oficial.
    </p>
  </details>

  <details style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 1.25rem; cursor: pointer;">
    <summary style="font-weight: 600; color: #18181b; list-style: none; display: flex; justify-content: space-between; align-items: center;">
      A API Oficial suporta envio de mídia (fotos, PDF, áudio)?
    </summary>
    <p style="color: #52525b; font-size: 0.9375rem; margin: 0.875rem 0 0; line-height: 1.6;">
      Sim. A Meta Cloud API suporta envio e recebimento de imagens (JPEG, PNG), documentos (PDF), áudio (AAC, MP4, MPEG, OGG), vídeo (MP4, 3GPP) e figurinhas. Cada tipo de mídia tem limites de tamanho — documentos até 100MB, vídeos até 16MB.
    </p>
  </details>

  <details style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 1.25rem; cursor: pointer;">
    <summary style="font-weight: 600; color: #18181b; list-style: none; display: flex; justify-content: space-between; align-items: center;">
      Quanto custa a verificação da Meta Business Manager?
    </summary>
    <p style="color: #52525b; font-size: 0.9375rem; margin: 0.875rem 0 0; line-height: 1.6;">
      A verificação em si é gratuita. Você precisa ter um CNPJ válido e seguir o processo em business.facebook.com. O que custa é o tempo — o processo pode levar de 2 a 10 dias úteis. Algumas empresas contratam agências especializadas para acelerar o processo.
    </p>
  </details>

  <details style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 1.25rem; cursor: pointer;">
    <summary style="font-weight: 600; color: #18181b; list-style: none; display: flex; justify-content: space-between; align-items: center;">
      Posso usar a API Oficial para disparos em massa?
    </summary>
    <p style="color: #52525b; font-size: 0.9375rem; margin: 0.875rem 0 0; line-height: 1.6;">
      Sim, mas com regras. Para mensagens iniciadas pela empresa (fora de uma janela de 24h de resposta do cliente), você precisa usar templates aprovados pela Meta. O processo de aprovação leva de algumas horas a 2 dias úteis. Disparos que recebem muitos "bloqueios" dos destinatários podem resultar em suspensão do número — então qualidade do conteúdo é fundamental.
    </p>
  </details>

  <details style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 1.25rem; cursor: pointer;">
    <summary style="font-weight: 600; color: #18181b; list-style: none; display: flex; justify-content: space-between; align-items: center;">
      Minha empresa pequena precisa da API Oficial ou o WhatsApp Business App basta?
    </summary>
    <p style="color: #52525b; font-size: 0.9375rem; margin: 0.875rem 0 0; line-height: 1.6;">
      Depende do volume e da estrutura. Se você tem uma equipe de vendas com mais de 2 pessoas atendendo pelo mesmo número, ou se o WhatsApp é canal crítico de negócio, a API Oficial vale o investimento. O WhatsApp Business App é suficiente para MEIs e solopreneurs com volume baixo — mas continue com um número separado do pessoal, sem automações de terceiros.
    </p>
  </details>
</div>

<h2>O risco real de continuar com APIs não oficiais</h2>

<p>
  Muitas empresas procrastinam a migração porque "está funcionando". Esse é exatamente o cenário mais perigoso: você não sabe quando o banimento vai acontecer, apenas que vai.
</p>

<div class="callout-warning">
  <p><strong>🔴 O que acontece quando a Meta bane seu número:</strong></p>
  <ul>
    <li>O número é bloqueado sem aviso prévio — clientes tentam falar e recebem "número inválido"</li>
    <li>Histórico de conversas pode ser perdido dependendo de como o CRM armazenava os dados</li>
    <li>O número bloqueado geralmente não pode ser recuperado — você perde o ativo que levou anos para construir</li>
    <li>Clientes que dependem daquele contato ficam sem atendimento até você configurar um substituto</li>
    <li>O dano à reputação ("aquela empresa some") é difícil de quantificar</li>
  </ul>
</div>

<p>
  O custo de configurar a API Oficial — seja em tempo ou dinheiro — é uma fração do custo de reconstruir uma operação de vendas após um banimento. Não é uma questão de <em>se</em> vai acontecer, mas de <em>quando</em>.
</p>

<div style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border-radius: 1rem; padding: 2rem; margin: 2.5rem 0; text-align: center;">
  <p style="font-size: 1.5rem; font-weight: 800; color: #4ade80; margin: 0 0 0.75rem; line-height: 1.3;">
    Nunca mais tenha o WhatsApp bloqueado.
  </p>
  <p style="color: #a1a1aa; font-size: 0.9375rem; margin: 0 0 1.5rem; max-width: 480px; margin-left: auto; margin-right: auto;">
    O Sirius CRM tem integração nativa com a API Oficial do WhatsApp Business. Configure em minutos ou deixe nossa equipe fazer por você.
  </p>
  <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
    <a href="/register" style="display: inline-block; background: #16a34a; color: white; padding: 0.75rem 1.75rem; border-radius: 0.5rem; text-decoration: none; font-weight: 700; font-size: 0.9375rem;">
      Testar grátis por 14 dias
    </a>
    <a href="/dashboard/settings/integrations/whatsapp-official" style="display: inline-block; background: transparent; color: #4ade80; padding: 0.75rem 1.75rem; border-radius: 0.5rem; text-decoration: none; font-weight: 700; font-size: 0.9375rem; border: 1px solid #4ade80;">
      Ver integração WhatsApp Oficial
    </a>
  </div>
</div>
  `,
  titleEn: 'Official WhatsApp API: The End of Blocked Accounts and How to Use It in Your CRM in 2026',
  excerptEn: 'Why Meta is banning unofficial integrations, how the official WhatsApp Business API works, and how to connect it to your CRM without risking your number.',
  keywordsEn: ['official whatsapp api', 'whatsapp business api crm', 'meta cloud api', 'whatsapp crm integration', 'avoid whatsapp ban'],
  contentEn: `
<p>
  In 2026, using WhatsApp to sell without the <strong>Meta Official API</strong> is like driving without a seatbelt: it works until the day it doesn't. Thousands of Brazilian companies discovered this the hard way — they woke up with their number blocked, customers without service, and months of conversation history lost.
</p>

<p>
  Meta has stopped turning a blind eye to unauthorized integrations. Tools like Evolution API, Baileys, and Whatsmeow — which worked by connecting to WhatsApp Web in an unofficial way — are being detected and banned at an increasing scale. If your CRM uses any of these technologies, the risk is real and immediate.
</p>

<p>
  In this article you'll understand exactly what the Official WhatsApp Business API is, why it's the only safe integration, how it works in practice, and how to connect it to your CRM to never lose a number again.
</p>

<div style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border-radius: 1rem; padding: 1.75rem 2rem; margin: 2rem 0;">
  <p style="font-size: 0.75rem; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 0.75rem;">TL;DR — 30 second read</p>
  <ul style="margin: 0; padding-left: 1.25rem; space-y: 0.5rem;">
    <li style="color: #e4e4e7; font-size: 0.9375rem; margin-bottom: 0.5rem;">Meta is actively banning accounts using unofficial APIs (Evolution API, Baileys, Whatsmeow)</li>
    <li style="color: #e4e4e7; font-size: 0.9375rem; margin-bottom: 0.5rem;">The Official API (Meta Cloud API) is the only approved integration — no ban risk</li>
    <li style="color: #e4e4e7; font-size: 0.9375rem; margin-bottom: 0.5rem;">Requires verified Meta Business Manager + dedicated number + app on Facebook Developers</li>
    <li style="color: #e4e4e7; font-size: 0.9375rem;">Sirius CRM is one of the only Brazilian CRMs with native integration to the Official API</li>
  </ul>
</div>

<div class="callout-stat">
  <p><strong>📊 Impact data:</strong> According to WhatsApp's own Help Center, accounts that violate Terms of Use through unauthorized automations are subject to <strong>permanent ban with no appeal</strong>. In 2025, industry estimates indicate that more than 40,000 Brazilian business numbers were blocked for using unofficial APIs.</p>
</div>

<h2>What is the Official WhatsApp Business API?</h2>

<p>
  The <strong>WhatsApp Business API</strong> — also called <strong>Meta Cloud API</strong> or <strong>WABA (WhatsApp Business Account)</strong> — is the official interface developed and maintained by Meta to allow companies to integrate WhatsApp into their systems in an authorized way.
</p>

<p>
  Unlike WhatsApp Web (which mirrors a phone) or the WhatsApp Business App (limited to one device), the Official API:
</p>

<ul>
  <li>Runs on Meta's servers, does not depend on a connected phone</li>
  <li>Operates 24/7 without interruptions</li>
  <li>Allows multiple simultaneous agents on the same number</li>
  <li>Is within WhatsApp's Terms of Service — no ban risk</li>
  <li>Supports Meta-approved message templates for proactive communication</li>
</ul>

<div class="callout-tip">
  <p><strong>💡 Important note:</strong> The Official API uses a dedicated phone number that <em>has never been used on WhatsApp before</em>. This means a virgin SIM — you cannot migrate a number that already has history on personal WhatsApp or the Business App.</p>
</div>

<h2>Why is Meta banning unofficial APIs?</h2>

<p>
  Understanding Meta's motivation helps explain why the problem will only get worse — not better.
</p>

<p>
  Tools like Evolution API, Baileys, Whatsmeow, and WPPConnect work by reverse-engineering the WhatsApp Web protocol. Instead of using the official API, they simulate a browser connecting to WhatsApp's web version and capture data directly. Meta explicitly prohibits this in the Terms of Service, section 4 ("Acceptable Use").
</p>

<div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0;">
  <p style="font-weight: 700; color: #9a3412; margin: 0 0 0.75rem;">⚠️ Why is Meta acting more forcefully now?</p>
  <div style="display: grid; gap: 0.75rem;">
    <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
      <span style="color: #c2410c; font-weight: 700;">1.</span>
      <p style="margin: 0; color: #7c2d12; font-size: 0.9375rem;"><strong>Fraud and spam at scale:</strong> Unofficial APIs are the primary tool of scammers who blast mass messages pretending to be banks, postal services, and government agencies.</p>
    </div>
    <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
      <span style="color: #c2410c; font-weight: 700;">2.</span>
      <p style="margin: 0; color: #7c2d12; font-size: 0.9375rem;"><strong>Revenue:</strong> Meta monetizes the Official API by conversation volume. Every company using the free unofficial version is lost revenue.</p>
    </div>
    <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
      <span style="color: #c2410c; font-weight: 700;">3.</span>
      <p style="margin: 0; color: #7c2d12; font-size: 0.9375rem;"><strong>Regulation:</strong> With LGPD and European GDPR, Meta needs to control the data flow through its servers. Unofficial APIs create a compliance black hole.</p>
    </div>
    <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
      <span style="color: #c2410c; font-weight: 700;">4.</span>
      <p style="margin: 0; color: #7c2d12; font-size: 0.9375rem;"><strong>Detection improved:</strong> Non-human behavior detection algorithms became much more sophisticated in 2025. Uniform typing patterns, batch sending, and server connections are easily identified.</p>
    </div>
  </div>
</div>

<h2>Official API vs Unofficial APIs: honest comparison</h2>

<div style="overflow-x: auto; margin: 1.5rem 0;">
  <table style="width: 100%; border-collapse: collapse; font-size: 0.9375rem;">
    <thead>
      <tr style="background: #f4f4f5;">
        <th style="padding: 0.875rem 1rem; text-align: left; border-bottom: 2px solid #e4e4e7; color: #3f3f46; font-weight: 700;">Criterion</th>
        <th style="padding: 0.875rem 1rem; text-align: center; border-bottom: 2px solid #e4e4e7; color: #16a34a; font-weight: 700;">Official Meta API</th>
        <th style="padding: 0.875rem 1rem; text-align: center; border-bottom: 2px solid #e4e4e7; color: #dc2626; font-weight: 700;">Evolution / Baileys / Whatsmeow</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Ban risk</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ Zero</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">🔴 High and growing</td>
      </tr>
      <tr style="background: #fafafa; border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Meta Terms of Service</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ Authorized</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">🔴 Explicit violation</td>
      </tr>
      <tr style="border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Depends on connected phone</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ No</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">🔴 Yes</td>
      </tr>
      <tr style="background: #fafafa; border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Guaranteed uptime</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ 99.9% (Meta SLA)</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">⚠️ Variable</td>
      </tr>
      <tr style="border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Delivery status (delivered/read)</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ Native</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">⚠️ Partial</td>
      </tr>
      <tr style="background: #fafafa; border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Proactive message templates</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ Supported</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">🔴 No (ToS violation)</td>
      </tr>
      <tr style="border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Multi-agent on same number</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ Native</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">⚠️ Via workaround</td>
      </tr>
      <tr style="background: #fafafa; border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Cost</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">⚠️ Per conversation (first 1,000/month free)</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ Free (but with risk)</td>
      </tr>
      <tr style="background: #fafafa;">
        <td style="padding: 0.875rem 1rem; color: #52525b; font-weight: 500;">Data compliance</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">✅ Data processed by Meta</td>
        <td style="padding: 0.875rem 1rem; text-align: center;">🔴 Full liability on you</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>How the Official API works in practice</h2>

<p>
  The Meta Cloud API works completely differently from WhatsApp Web integrations. Instead of simulating a human user navigating WhatsApp, it communicates directly with Meta's servers via HTTP — the same protocol as any modern REST API.
</p>

<h3>Billing model</h3>
<p>Meta charges per <strong>conversation</strong>, not per individual message. A conversation is a 24-hour window that opens when there is interaction. The first 1,000 service conversations per month are free — ideal for companies that receive inbound customer contacts.</p>

<h2>How to connect the Official API to your CRM</h2>

<p>
  With the prerequisites in hand, CRM configuration involves 4 main pieces of information you obtain from the Facebook Developers panel:
</p>

<ol style="margin: 1.5rem 0; padding-left: 1.5rem; display: grid; gap: 1rem;">
  <li style="color: #3f3f46;"><strong style="color: #18181b;">Phone Number ID</strong> — unique identifier for your number on the Meta platform.</li>
  <li style="color: #3f3f46;"><strong style="color: #18181b;">Business Account ID (WABA ID)</strong> — ID of your WhatsApp Business account.</li>
  <li style="color: #3f3f46;"><strong style="color: #18181b;">Permanent Access Token</strong> — generated via system user in Meta Business Manager.</li>
  <li style="color: #3f3f46;"><strong style="color: #18181b;">Webhook Verify Token</strong> — a string you create that Meta uses to validate your webhook endpoint.</li>
</ol>

<p>
  In <strong>Sirius CRM</strong>, just go to <strong>Settings → Integrations → Official WhatsApp</strong>, fill in these 4 fields, and activate. The system automatically configures the webhook and starts receiving messages.
</p>

<h2>The real risk of continuing with unofficial APIs</h2>

<div class="callout-warning">
  <p><strong>🔴 What happens when Meta bans your number:</strong></p>
  <ul>
    <li>The number is blocked without prior warning — customers try to reach you and get "invalid number"</li>
    <li>Conversation history may be lost depending on how your CRM stored the data</li>
    <li>The blocked number generally cannot be recovered — you lose an asset it took years to build</li>
    <li>Customers who depended on that contact are left without service until you set up a replacement</li>
    <li>The reputation damage ("that company just disappeared") is hard to quantify</li>
  </ul>
</div>

<p>
  The cost of setting up the Official API — whether in time or money — is a fraction of the cost of rebuilding a sales operation after a ban. It's not a question of <em>if</em> it will happen, but <em>when</em>.
</p>

<div style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border-radius: 1rem; padding: 2rem; margin: 2.5rem 0; text-align: center;">
  <p style="font-size: 1.5rem; font-weight: 800; color: #4ade80; margin: 0 0 0.75rem; line-height: 1.3;">
    Never have your WhatsApp blocked again.
  </p>
  <p style="color: #a1a1aa; font-size: 0.9375rem; margin: 0 0 1.5rem; max-width: 480px; margin-left: auto; margin-right: auto;">
    Sirius CRM has native integration with the Official WhatsApp Business API. Set it up in minutes or let our team do it for you.
  </p>
  <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
    <a href="/register" style="display: inline-block; background: #16a34a; color: white; padding: 0.75rem 1.75rem; border-radius: 0.5rem; text-decoration: none; font-weight: 700; font-size: 0.9375rem;">
      Try free for 14 days
    </a>
    <a href="/dashboard/settings/integrations/whatsapp-official" style="display: inline-block; background: transparent; color: #4ade80; padding: 0.75rem 1.75rem; border-radius: 0.5rem; text-decoration: none; font-weight: 700; font-size: 0.9375rem; border: 1px solid #4ade80;">
      View Official WhatsApp integration
    </a>
  </div>
</div>
  `,
}
