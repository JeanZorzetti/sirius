/**
 * Configuração de Nichos para SEO Programático
 *
 * Cada nicho gera uma página estática em /solucoes/[slug]
 * com conteúdo personalizado e jargão específico.
 */

export interface NicheJargon {
  lead: string
  deal: string
  revenue: string
  pipeline: string
  conversion: string
}

export interface NicheData {
  slug: string
  title: string
  subtitle: string
  painPoint: string
  painPointSecondary: string
  jargon: NicheJargon
  calculatorCopy: {
    title: string
    subtitle: string
    volumeLabel: string
    ticketLabel: string
    ctaText: string
  }
  benefits: Array<{
    title: string
    description: string
  }>
  socialProof: {
    users: string
    improvement: string
  }
  testimonial: {
    quote: string
    author: string
    role: string
    company: string
  }
  faq: Array<{
    question: string
    answer: string
  }>
  seo: {
    title: string
    description: string
    keywords: string[]
  }
  color: {
    primary: string
    secondary: string
    gradient: string
  }
  icon: 'Building2' | 'Sun' | 'Sparkles' | 'Briefcase' | 'TrendingUp'
  // EN variants (optional — noindex served when absent)
  titleEn?: string
  subtitleEn?: string
  painPointEn?: string
  painPointSecondaryEn?: string
  calculatorCopyEn?: {
    title: string
    subtitle: string
    volumeLabel: string
    ticketLabel: string
    ctaText: string
  }
  benefitsEn?: Array<{
    title: string
    description: string
  }>
  testimonialEn?: {
    quote: string
    author: string
    role: string
    company: string
  }
  faqEn?: Array<{
    question: string
    answer: string
  }>
  seoEn?: {
    title: string
    description: string
    keywords: string[]
  }
}

export const NICHES: NicheData[] = [
  {
    slug: 'corretores-de-imoveis',
    title: 'O CRM que Organiza suas Vendas de Imóveis',
    subtitle: 'Pare de perder comissões por desorganização',
    painPoint: 'Perdendo comissões por esquecer de cobrar o cliente?',
    painPointSecondary: 'Clientes interessados esfriando porque você não fez follow-up?',
    jargon: {
      lead: 'Interessado',
      deal: 'Visita',
      revenue: 'Comissão',
      pipeline: 'Funil de Vendas',
      conversion: 'Taxa de Fechamento'
    },
    calculatorCopy: {
      title: 'Quanto de comissão você deixou na mesa?',
      subtitle: 'Descubra o impacto real de não acompanhar seus interessados',
      volumeLabel: 'Quantos interessados você recebe por mês?',
      ticketLabel: 'Qual a comissão média por venda?',
      ctaText: 'Recuperar essas comissões agora'
    },
    benefits: [
      {
        title: 'Follow-up Automático de Interessados',
        description: 'Nunca mais esqueça de ligar para aquele cliente que pediu para retornar na próxima semana. Sistema avisa você no momento certo.'
      },
      {
        title: 'Histórico Completo de Visitas',
        description: 'Registre todas as visitas, propostas e negociações. Retome qualquer conversa do ponto exato onde parou.'
      },
      {
        title: 'Pipeline Visual de Negociações',
        description: 'Veja todos os seus imóveis e clientes em um funil organizado. Saiba exatamente quais visitas estão próximas de fechar.'
      },
      {
        title: 'Comissões Projetadas',
        description: 'Visualize quanto dinheiro está em cada etapa do funil. Saiba suas comissões futuras em tempo real.'
      }
    ],
    socialProof: {
      users: '+2.500 corretores',
      improvement: '34% mais vendas fechadas'
    },
    testimonial: {
      quote: 'Antes do Sirius, eu perdia pelo menos 3 vendas por mês porque esquecia de dar follow-up. Hoje, minha taxa de fechamento subiu de 12% para 19%. Isso significou R$ 42 mil a mais de comissão nos últimos 6 meses.',
      author: 'Ricardo Mendes',
      role: 'Corretor Autônomo',
      company: 'São Paulo, SP'
    },
    faq: [
      {
        question: 'Funciona para corretores autônomos ou só para imobiliárias?',
        answer: 'Funciona perfeitamente para ambos! Muitos dos nossos usuários são corretores autônomos que precisam organizar seus interessados sem depender do sistema da imobiliária.'
      },
      {
        question: 'Consigo importar minha base de contatos do Excel?',
        answer: 'Sim! Você pode importar sua planilha de interessados em poucos cliques. O sistema mapeia automaticamente os campos.'
      },
      {
        question: 'Como funciona o acompanhamento de visitas?',
        answer: 'Para cada interessado, você registra a visita, data de retorno e observações. O sistema cria lembretes automáticos para você não esquecer nenhum follow-up.'
      }
    ],
    seo: {
      title: 'CRM para Corretores 2026 [IA + WhatsApp] — Nunca Perca Uma Comissão | Grátis',
      description: 'Corretores que usam IA vendem 50% mais. Follow-up automático, pipeline visual e WhatsApp integrado. Pare de perder comissões por desorganização. Sem planilha. Teste grátis — sem cartão.',
      keywords: [
        'crm para corretores',
        'crm imobiliário',
        'gestão de vendas imóveis',
        'organizar vendas corretor',
        'follow-up imobiliário',
        'aumentar comissões',
        'software corretor imoveis'
      ]
    },
    color: {
      primary: 'indigo',
      secondary: 'purple',
      gradient: 'from-indigo-600 to-purple-600'
    },
    icon: 'Building2',
    titleEn: 'The CRM That Organizes Your Real Estate Sales',
    subtitleEn: 'Stop losing commissions due to disorganization',
    painPointEn: 'Losing commissions because you forgot to follow up?',
    painPointSecondaryEn: 'Interested buyers going cold because you missed the callback?',
    calculatorCopyEn: {
      title: 'How much commission are you leaving on the table?',
      subtitle: 'Find out the real impact of not tracking your leads',
      volumeLabel: 'How many leads do you receive per month?',
      ticketLabel: 'What is your average commission per sale?',
      ctaText: 'Recover those commissions now'
    },
    benefitsEn: [
      {
        title: 'Automatic Lead Follow-up',
        description: 'Never forget to call back that buyer who asked you to check in next week. The system reminds you at exactly the right moment.'
      },
      {
        title: 'Complete Visit History',
        description: 'Log every property showing, proposal, and negotiation. Pick up any conversation exactly where you left off.'
      },
      {
        title: 'Visual Negotiation Pipeline',
        description: 'See all your listings and clients in an organized funnel. Know exactly which deals are close to closing.'
      },
      {
        title: 'Projected Commissions',
        description: 'See how much money sits in each pipeline stage. Know your future commissions in real time.'
      }
    ],
    testimonialEn: {
      quote: 'Before Sirius, I was losing at least 3 sales a month because I forgot to follow up. Now my closing rate went from 12% to 19%. That meant an extra R$ 42,000 in commissions over the last 6 months.',
      author: 'Ricardo Mendes',
      role: 'Independent Real Estate Agent',
      company: 'São Paulo, SP'
    },
    faqEn: [
      {
        question: 'Does it work for independent agents or only real estate agencies?',
        answer: 'It works perfectly for both! Many of our users are independent agents who need to organize their leads without relying on their agency\'s system.'
      },
      {
        question: 'Can I import my contact list from Excel?',
        answer: 'Yes! You can import your lead spreadsheet in just a few clicks. The system automatically maps the fields.'
      },
      {
        question: 'How does visit tracking work?',
        answer: 'For each lead, you log the showing, callback date, and notes. The system creates automatic reminders so you never miss a follow-up.'
      }
    ],
    seoEn: {
      title: 'Real Estate CRM 2026 [AI + WhatsApp] — Never Lose a Commission Again | Free',
      description: 'Agents using AI close 50% more deals. Automatic follow-up, visual pipeline, and WhatsApp integration. Stop losing commissions to disorganization. No spreadsheet. Free trial — no credit card.',
      keywords: [
        'real estate crm',
        'crm for realtors',
        'real estate sales software',
        'property agent crm',
        'real estate follow-up tool',
        'increase realtor commissions',
        'real estate pipeline management'
      ]
    }
  },
  {
    slug: 'energia-solar',
    title: 'O CRM que Fecha Mais Propostas de Energia Solar',
    subtitle: 'Pare de perder instalações por falta de follow-up',
    painPoint: 'Propostas de energia solar esfriando na gaveta?',
    painPointSecondary: 'Clientes não retornam depois da visita técnica?',
    jargon: {
      lead: 'Lead',
      deal: 'Proposta',
      revenue: 'Faturamento',
      pipeline: 'Pipeline de Vendas',
      conversion: 'Taxa de Conversão'
    },
    calculatorCopy: {
      title: 'Quanto faturamento você está perdendo?',
      subtitle: 'Descubra o impacto de propostas não acompanhadas',
      volumeLabel: 'Quantas propostas você faz por mês?',
      ticketLabel: 'Qual o ticket médio de instalação?',
      ctaText: 'Recuperar essas instalações agora'
    },
    benefits: [
      {
        title: 'Gestão Completa de Propostas',
        description: 'Acompanhe cada proposta desde o orçamento até a instalação. Veja em tempo real quais estão travadas e por quê.'
      },
      {
        title: 'Pipeline por Etapa Técnica',
        description: 'Separe suas propostas por: Orçamento → Visita Técnica → Aprovação → Instalação. Foque energia no que converte.'
      },
      {
        title: 'Histórico de Simulações',
        description: 'Todas as simulações de economia, visitas técnicas e ajustes de projeto registrados em um único lugar.'
      },
      {
        title: 'Relatórios de Conversão',
        description: 'Veja sua taxa de conversão por origem, região e tipo de instalação. Otimize o que funciona.'
      }
    ],
    socialProof: {
      users: '+150 integradoras',
      improvement: '58% mais propostas fechadas'
    },
    testimonial: {
      quote: 'Perdíamos 40% das propostas porque não tínhamos controle de follow-up. Com o Sirius, implementamos um processo claro e nossa conversão subiu de 15% para 26%. Isso representou +R$ 340 mil em 3 meses.',
      author: 'Rafael Costa',
      role: 'Diretor Comercial',
      company: 'Solar Tech RJ'
    },
    faq: [
      {
        question: 'Consigo registrar dados técnicos da instalação?',
        answer: 'Sim! Você pode adicionar campos personalizados para kWp, área disponível, tipo de telha, e qualquer outra informação técnica relevante.'
      },
      {
        question: 'Tem integração com ferramentas de simulação?',
        answer: 'Ainda não temos integração nativa, mas você pode anexar as simulações (PDFs) diretamente na proposta para ter tudo centralizado.'
      },
      {
        question: 'Como funciona o acompanhamento pós-venda?',
        answer: 'Depois da instalação, você pode criar tarefas de follow-up para garantir satisfação do cliente e gerar indicações.'
      }
    ],
    seo: {
      title: 'CRM para Solar 2026 [IA + Propostas Automáticas] — Feche 3x Mais Projetos | Grátis',
      description: 'Integradoras solares que usam IA qualificam leads 3x mais rápido. Pipeline visual, propostas automáticas e WhatsApp do pré-venda ao fechamento. Sem planilha. Teste grátis — sem cartão.',
      keywords: [
        'crm energia solar',
        'crm fotovoltaica',
        'gestão comercial solar',
        'vender mais energia solar',
        'organizar propostas solar',
        'sistema integradora solar',
        'crm integradora'
      ]
    },
    color: {
      primary: 'amber',
      secondary: 'orange',
      gradient: 'from-amber-500 to-orange-600'
    },
    icon: 'Sun',
    titleEn: 'The CRM That Closes More Solar Energy Proposals',
    subtitleEn: 'Stop losing installations due to poor follow-up',
    painPointEn: 'Solar proposals sitting untouched in your inbox?',
    painPointSecondaryEn: 'Prospects going dark after the site survey?',
    calculatorCopyEn: {
      title: 'How much revenue are you missing out on?',
      subtitle: 'Find out the impact of untracked proposals',
      volumeLabel: 'How many proposals do you send per month?',
      ticketLabel: 'What is your average installation ticket?',
      ctaText: 'Recover those installations now'
    },
    benefitsEn: [
      {
        title: 'Full Proposal Management',
        description: 'Track every proposal from quote to installation. See in real time which ones are stalled and why.'
      },
      {
        title: 'Pipeline by Technical Stage',
        description: 'Organize proposals by: Quote → Site Survey → Approval → Installation. Focus your energy on what converts.'
      },
      {
        title: 'Simulation History',
        description: 'All energy savings simulations, site visits, and project revisions stored in one place.'
      },
      {
        title: 'Conversion Reports',
        description: 'See your conversion rate by lead source, region, and installation type. Double down on what works.'
      }
    ],
    testimonialEn: {
      quote: 'We were losing 40% of our proposals because we had no follow-up control. With Sirius, we built a clear process and our conversion rate went from 15% to 26%. That was an extra R$ 340,000 in just 3 months.',
      author: 'Rafael Costa',
      role: 'Commercial Director',
      company: 'Solar Tech RJ'
    },
    faqEn: [
      {
        question: 'Can I log technical installation data?',
        answer: 'Yes! You can add custom fields for kWp, available roof area, tile type, and any other relevant technical information.'
      },
      {
        question: 'Is there integration with simulation tools?',
        answer: 'Not natively yet, but you can attach simulation PDFs directly to each proposal to keep everything centralized.'
      },
      {
        question: 'How does post-sale follow-up work?',
        answer: 'After installation, you can create follow-up tasks to ensure customer satisfaction and generate referrals.'
      }
    ],
    seoEn: {
      title: 'Solar CRM 2026 [AI + Auto Proposals] — Close 3x More Projects | Free',
      description: 'Solar companies using AI qualify leads 3x faster. Visual pipeline, automated proposals, and WhatsApp from pre-sale to close. No spreadsheet. Free trial — no credit card.',
      keywords: [
        'solar energy crm',
        'solar sales crm',
        'solar installer software',
        'solar proposal management',
        'solar lead tracking',
        'solar company crm',
        'photovoltaic sales software'
      ]
    }
  },
  {
    slug: 'agencias-de-marketing',
    title: 'O CRM que Estrutura o Comercial da Sua Agência',
    subtitle: 'Pare de perder clientes por processo bagunçado',
    painPoint: 'Propostas comerciais esquecidas na caixa de entrada?',
    painPointSecondary: 'Time comercial gastando tempo com leads errados?',
    jargon: {
      lead: 'Lead',
      deal: 'Proposta',
      revenue: 'Faturamento',
      pipeline: 'Funil Comercial',
      conversion: 'Taxa de Fechamento'
    },
    calculatorCopy: {
      title: 'Quanto faturamento sua agência está perdendo?',
      subtitle: 'Calcule o impacto de um processo comercial desorganizado',
      volumeLabel: 'Quantos leads sua agência recebe por mês?',
      ticketLabel: 'Qual o ticket médio dos seus projetos?',
      ctaText: 'Recuperar esse faturamento agora'
    },
    benefits: [
      {
        title: 'Pipeline de Propostas Comerciais',
        description: 'Gerencie todas as propostas em um único lugar. Da descoberta ao fechamento, sem perder nenhum lead qualificado.'
      },
      {
        title: 'Qualificação Automática de Leads',
        description: 'Identifique rapidamente quais leads têm fit com sua agência. Foque energia nos prospects certos e evite desperdício.'
      },
      {
        title: 'Histórico Completo de Interações',
        description: 'Todas as reuniões, apresentações e negociações registradas. Time inteiro alinhado no contexto de cada cliente.'
      },
      {
        title: 'Métricas Comerciais em Tempo Real',
        description: 'Ticket médio, ciclo de venda, taxa de conversão por origem. Dados reais para tomar decisões melhores.'
      }
    ],
    socialProof: {
      users: '+380 agências',
      improvement: '47% mais propostas fechadas'
    },
    testimonial: {
      quote: 'Nossa comunicação entre comercial e entrega era caótica. Perdíamos leads porque ninguém sabia quem estava falando com quem. Com o Sirius, criamos um processo previsível. Taxa de fechamento subiu de 18% para 31%.',
      author: 'Mariana Alves',
      role: 'Head of Growth',
      company: 'Pixel Perfect Agency'
    },
    faq: [
      {
        question: 'Consigo separar por tipo de serviço (SEO, Ads, Social)?',
        answer: 'Sim! Você pode criar pipelines diferentes para cada linha de serviço ou usar tags para categorizar as oportunidades.'
      },
      {
        question: 'O time todo pode acessar?',
        answer: 'Sim! Você adiciona todos os membros da agência e controla as permissões de cada um (comercial, atendimento, gestão).'
      },
      {
        question: 'Tem relatório de funil comercial?',
        answer: 'Sim! Você vê quantos leads entraram, quantos avançaram por etapa, onde travaram e qual a taxa de conversão de cada fase.'
      }
    ],
    seo: {
      title: 'CRM para Agências 2026 [IA Nativa] — Escale Clientes Sem Contratar Mais | Grátis',
      description: 'Agências que usam IA convertem 40% mais leads. Automação de propostas, qualificação inteligente e métricas em tempo real. Cresça o faturamento sem aumentar o time. Teste grátis — sem cartão.',
      keywords: [
        'crm para agencias',
        'crm agencia marketing',
        'gestão comercial agencia',
        'vender mais agencia',
        'processo comercial agencia',
        'organizar vendas agencia',
        'sistema agencia marketing'
      ]
    },
    color: {
      primary: 'purple',
      secondary: 'pink',
      gradient: 'from-purple-600 to-pink-600'
    },
    icon: 'Sparkles',
    titleEn: 'The CRM That Structures Your Agency\'s Sales Process',
    subtitleEn: 'Stop losing clients to a chaotic sales pipeline',
    painPointEn: 'Proposals getting buried in your email inbox?',
    painPointSecondaryEn: 'Sales team wasting time on the wrong leads?',
    calculatorCopyEn: {
      title: 'How much revenue is your agency leaving on the table?',
      subtitle: 'Calculate the cost of a disorganized sales process',
      volumeLabel: 'How many leads does your agency receive per month?',
      ticketLabel: 'What is the average ticket for your projects?',
      ctaText: 'Recover that revenue now'
    },
    benefitsEn: [
      {
        title: 'Commercial Proposal Pipeline',
        description: 'Manage every proposal in one place. From discovery to close — never lose a qualified lead again.'
      },
      {
        title: 'Automatic Lead Qualification',
        description: 'Quickly identify which leads are a fit for your agency. Focus on the right prospects and stop wasting effort.'
      },
      {
        title: 'Complete Interaction History',
        description: 'Every meeting, presentation, and negotiation recorded. Your whole team stays aligned on every client context.'
      },
      {
        title: 'Real-time Sales Metrics',
        description: 'Average ticket, sales cycle length, conversion rate by source. Real data to make better decisions.'
      }
    ],
    testimonialEn: {
      quote: 'Communication between sales and delivery was chaotic. We were losing leads because nobody knew who was talking to whom. With Sirius, we built a predictable process. Closing rate went from 18% to 31%.',
      author: 'Mariana Alves',
      role: 'Head of Growth',
      company: 'Pixel Perfect Agency'
    },
    faqEn: [
      {
        question: 'Can I separate by service type (SEO, Ads, Social)?',
        answer: 'Yes! You can create different pipelines for each service line or use tags to categorize opportunities.'
      },
      {
        question: 'Can the whole team access it?',
        answer: 'Yes! Add all agency members and control each person\'s permissions (sales, account management, leadership).'
      },
      {
        question: 'Is there a commercial funnel report?',
        answer: 'Yes! You can see how many leads entered, how many advanced at each stage, where they stalled, and the conversion rate for each phase.'
      }
    ],
    seoEn: {
      title: 'CRM for Marketing Agencies 2026 [Native AI] — Scale Clients Without Hiring More | Free',
      description: 'Agencies using AI convert 40% more leads. Proposal automation, intelligent qualification, and real-time metrics. Grow revenue without growing headcount. Free trial — no credit card.',
      keywords: [
        'crm for marketing agencies',
        'agency sales crm',
        'marketing agency management software',
        'agency lead tracking',
        'sales process for agencies',
        'digital agency crm',
        'proposal pipeline software'
      ]
    }
  },
  {
    slug: 'consultores-empresariais',
    title: 'O CRM que Organiza sua Consultoria',
    subtitle: 'Pare de perder clientes por falta de follow-up',
    painPoint: 'Projetos de consultoria travando por falta de acompanhamento?',
    painPointSecondary: 'Clientes esfriando depois da proposta comercial?',
    jargon: {
      lead: 'Prospect',
      deal: 'Projeto',
      revenue: 'Honorários',
      pipeline: 'Pipeline de Projetos',
      conversion: 'Taxa de Conversão'
    },
    calculatorCopy: {
      title: 'Quanto em honorários você está perdendo?',
      subtitle: 'Descubra o impacto de projetos não acompanhados',
      volumeLabel: 'Quantos prospects você conversa por mês?',
      ticketLabel: 'Qual o valor médio dos seus projetos?',
      ctaText: 'Recuperar esses projetos agora'
    },
    benefits: [
      {
        title: 'Gestão de Pipeline de Projetos',
        description: 'Acompanhe cada projeto desde a prospecção até o fechamento. Veja em tempo real onde cada oportunidade está.'
      },
      {
        title: 'Histórico de Diagnósticos',
        description: 'Registre todas as reuniões de diagnóstico, pontos de dor identificados e propostas enviadas em um único lugar.'
      },
      {
        title: 'Follow-up Estruturado',
        description: 'Crie lembretes automáticos para acompanhar cada proposta no timing certo. Nunca mais perca um projeto por esquecimento.'
      },
      {
        title: 'Relatórios de Performance',
        description: 'Veja sua taxa de conversão, tempo médio de fechamento e ticket médio. Otimize seu processo comercial.'
      }
    ],
    socialProof: {
      users: '+450 consultores',
      improvement: '42% mais projetos fechados'
    },
    testimonial: {
      quote: 'Como consultor solo, eu perdia projetos porque tinha dificuldade em acompanhar todas as conversas. Com o Sirius, organizei meu processo e minha taxa de conversão subiu de 25% para 38%. Isso significou mais R$ 180 mil em projetos fechados no último ano.',
      author: 'Dr. Paulo Henrique',
      role: 'Consultor Empresarial',
      company: 'Especialista em Gestão'
    },
    faq: [
      {
        question: 'Funciona para consultores solo ou só para consultorias grandes?',
        answer: 'Funciona perfeitamente para ambos! Muitos consultores independentes usam o Sirius para organizar seus projetos sem precisar de ferramentas complexas.'
      },
      {
        question: 'Consigo anexar propostas e contratos?',
        answer: 'Sim! Você pode anexar qualquer arquivo (PDF, Word, Excel) diretamente no projeto para ter tudo centralizado.'
      },
      {
        question: 'Tem como controlar prazos de entrega?',
        answer: 'Sim! Você pode criar tarefas e marcos com datas específicas. O sistema avisa quando algo está próximo do prazo.'
      }
    ],
    seo: {
      title: 'CRM para Consultores 2026 [IA + Automação] — Feche Contratos Enquanto Dorme | Grátis',
      description: 'Consultores que automatizam follow-ups fecham 35% mais contratos. IA qualifica leads, pipeline visual e histórico completo de projetos. Foque em entregar, deixe a IA vender. Teste grátis — sem cartão.',
      keywords: [
        'crm para consultores',
        'crm consultoria empresarial',
        'gestão projetos consultoria',
        'organizar consultoria',
        'vender mais consultoria',
        'sistema consultor',
        'crm consultor empresarial'
      ]
    },
    color: {
      primary: 'blue',
      secondary: 'cyan',
      gradient: 'from-blue-600 to-cyan-600'
    },
    icon: 'Briefcase',
    titleEn: 'The CRM That Organizes Your Consulting Practice',
    subtitleEn: 'Stop losing clients due to poor follow-up',
    painPointEn: 'Consulting projects stalling because nothing is tracked?',
    painPointSecondaryEn: 'Prospects going cold after you send the commercial proposal?',
    calculatorCopyEn: {
      title: 'How much in fees are you missing out on?',
      subtitle: 'Find out the cost of untracked consulting projects',
      volumeLabel: 'How many prospects do you talk to per month?',
      ticketLabel: 'What is your average project value?',
      ctaText: 'Recover those projects now'
    },
    benefitsEn: [
      {
        title: 'Project Pipeline Management',
        description: 'Track every project from prospecting to close. See in real time exactly where each opportunity stands.'
      },
      {
        title: 'Diagnostic Meeting History',
        description: 'Log all discovery meetings, identified pain points, and sent proposals in one place.'
      },
      {
        title: 'Structured Follow-up',
        description: 'Create automatic reminders to follow up on every proposal at the right time. Never lose a project to forgetfulness again.'
      },
      {
        title: 'Performance Reports',
        description: 'Track your conversion rate, average closing time, and average ticket. Optimize your sales process with real data.'
      }
    ],
    testimonialEn: {
      quote: 'As a solo consultant, I was losing projects because I couldn\'t keep track of all conversations. With Sirius, I organized my process and my conversion rate went from 25% to 38%. That meant an extra R$ 180,000 in closed projects over the past year.',
      author: 'Dr. Paulo Henrique',
      role: 'Business Consultant',
      company: 'Management Specialist'
    },
    faqEn: [
      {
        question: 'Does it work for solo consultants or only large firms?',
        answer: 'It works perfectly for both! Many independent consultants use Sirius to organize their projects without needing complex tools.'
      },
      {
        question: 'Can I attach proposals and contracts?',
        answer: 'Yes! You can attach any file (PDF, Word, Excel) directly to the project to keep everything centralized.'
      },
      {
        question: 'Can I track delivery deadlines?',
        answer: 'Yes! You can create tasks and milestones with specific dates. The system notifies you when a deadline is approaching.'
      }
    ],
    seoEn: {
      title: 'CRM for Consultants 2026 [AI + Automation] — Close Contracts While You Sleep | Free',
      description: 'Consultants who automate follow-ups close 35% more contracts. AI qualifies leads, visual pipeline, and complete project history. Focus on delivery — let the AI handle sales. Free trial — no credit card.',
      keywords: [
        'crm for consultants',
        'consulting business crm',
        'consulting project management crm',
        'consultant sales software',
        'consulting pipeline management',
        'business consultant crm',
        'freelance consultant crm'
      ]
    }
  },
  {
    slug: 'representantes-comerciais',
    title: 'O CRM que Multiplica suas Vendas como Representante',
    subtitle: 'Pare de perder pedidos por desorganização',
    painPoint: 'Perdendo pedidos por esquecer de cobrar o cliente?',
    painPointSecondary: 'Clientes comprando do concorrente porque você não deu follow-up?',
    jargon: {
      lead: 'Cliente',
      deal: 'Pedido',
      revenue: 'Faturamento',
      pipeline: 'Carteira de Clientes',
      conversion: 'Taxa de Recompra'
    },
    calculatorCopy: {
      title: 'Quanto em comissões você está perdendo?',
      subtitle: 'Calcule o impacto de pedidos não acompanhados',
      volumeLabel: 'Quantos clientes você atende por mês?',
      ticketLabel: 'Qual o valor médio de pedido?',
      ctaText: 'Recuperar essas comissões agora'
    },
    benefits: [
      {
        title: 'Gestão de Carteira de Clientes',
        description: 'Organize todos os seus clientes por região, categoria e potencial de compra. Foque nos clientes certos no momento certo.'
      },
      {
        title: 'Histórico de Pedidos',
        description: 'Veja todo o histórico de compras de cada cliente. Identifique padrões de recompra e antecipe necessidades.'
      },
      {
        title: 'Roteiro de Visitas Otimizado',
        description: 'Planeje suas visitas por região e prioridade. Maximize o aproveitamento de cada dia de trabalho.'
      },
      {
        title: 'Lembretes de Recompra',
        description: 'Sistema avisa quando um cliente está no timing ideal para recomprar. Nunca mais perca um pedido por esquecimento.'
      }
    ],
    socialProof: {
      users: '+920 representantes',
      improvement: '51% mais recompras'
    },
    testimonial: {
      quote: 'Antes do Sirius, eu tinha uma planilha gigante e perdia vendas porque esquecia de ligar para os clientes no momento certo. Agora, o sistema me avisa quando cada cliente está pronto para recomprar. Minhas vendas subiram 48% em 6 meses.',
      author: 'Carlos Eduardo',
      role: 'Representante Comercial',
      company: 'Região Sul'
    },
    faq: [
      {
        question: 'Funciona no celular? Preciso acessar na rua.',
        answer: 'Sim! O Sirius é totalmente responsivo e funciona perfeitamente no celular. Você pode registrar visitas e pedidos de qualquer lugar.'
      },
      {
        question: 'Consigo registrar pedidos offline?',
        answer: 'No momento, você precisa de conexão para registrar. Mas estamos desenvolvendo modo offline para breve!'
      },
      {
        question: 'Tem como separar por linha de produto?',
        answer: 'Sim! Você pode usar tags ou campos personalizados para categorizar seus clientes e pedidos por linha de produto.'
      }
    ],
    seo: {
      title: 'CRM para Representante Comercial 2026 [IA + Offline] — Nunca Perca Dados ao Trocar de Representada',
      description: 'O único CRM com IA que funciona OFFLINE para representantes. Sua carteira fica com você — mesmo trocando de representada. Gestão de pedidos, comissões e WhatsApp automático. Grátis para sempre.',
      keywords: [
        'crm para representante comercial',
        'crm representante comercial',
        'crm para representantes de vendas',
        'software para representante comercial',
        'gestão carteira clientes',
        'organizar vendas representante',
        'sistema representante comercial',
        'aumentar vendas representante',
        'app crm representante',
        'alternativa planilha representante comercial',
        'crm automação representante',
        'crm ia representante comercial'
      ]
    },
    color: {
      primary: 'green',
      secondary: 'emerald',
      gradient: 'from-green-600 to-emerald-600'
    },
    icon: 'TrendingUp',
    titleEn: 'The CRM That Multiplies Your Sales as a Sales Rep',
    subtitleEn: 'Stop losing orders due to disorganization',
    painPointEn: 'Missing orders because you forgot to follow up with a client?',
    painPointSecondaryEn: 'Clients buying from a competitor because you didn\'t check in?',
    calculatorCopyEn: {
      title: 'How much in commissions are you leaving on the table?',
      subtitle: 'Calculate the impact of untracked orders',
      volumeLabel: 'How many clients do you serve per month?',
      ticketLabel: 'What is your average order value?',
      ctaText: 'Recover those commissions now'
    },
    benefitsEn: [
      {
        title: 'Client Portfolio Management',
        description: 'Organize all your clients by region, category, and buying potential. Focus on the right clients at the right time.'
      },
      {
        title: 'Order History',
        description: 'See every client\'s complete purchase history. Identify repurchase patterns and anticipate their needs.'
      },
      {
        title: 'Optimized Visit Routing',
        description: 'Plan your visits by region and priority. Maximize every workday with a smarter route.'
      },
      {
        title: 'Repurchase Reminders',
        description: 'The system alerts you when a client is in the ideal window to reorder. Never miss an order due to forgetfulness again.'
      }
    ],
    testimonialEn: {
      quote: 'Before Sirius, I had a giant spreadsheet and was losing sales because I forgot to call clients at the right moment. Now the system tells me exactly when each client is ready to reorder. My sales went up 48% in 6 months.',
      author: 'Carlos Eduardo',
      role: 'Sales Representative',
      company: 'Southern Brazil Region'
    },
    faqEn: [
      {
        question: 'Does it work on mobile? I need access in the field.',
        answer: 'Yes! Sirius is fully responsive and works great on mobile. You can log visits and orders from anywhere.'
      },
      {
        question: 'Can I log orders offline?',
        answer: 'Currently you need a connection to register. But we\'re building offline mode — coming soon!'
      },
      {
        question: 'Can I filter by product line?',
        answer: 'Yes! You can use tags or custom fields to categorize your clients and orders by product line.'
      }
    ],
    seoEn: {
      title: 'CRM for Sales Reps 2026 [AI + Offline] — Your Client Portfolio Stays With You | Free',
      description: 'The only AI-powered CRM built for sales representatives. Your client portfolio stays with you — even when you change manufacturers. Order management, commissions, and automatic WhatsApp. Free forever.',
      keywords: [
        'crm for sales representatives',
        'sales rep crm',
        'field sales crm',
        'manufacturer rep software',
        'client portfolio management crm',
        'sales territory crm',
        'mobile crm for sales reps'
      ]
    }
  }
]

/**
 * Retorna dados de um nicho pelo slug
 */
export function getNicheBySlug(slug: string): NicheData | undefined {
  return NICHES.find(niche => niche.slug === slug)
}

/**
 * Retorna todos os slugs de nichos (para generateStaticParams)
 */
export function getAllNicheSlugs(): string[] {
  return NICHES.map(niche => niche.slug)
}
