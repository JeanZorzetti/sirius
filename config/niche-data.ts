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
      title: 'CRM para Corretores de Imóveis 2026 | Automação de Vendas e Comissões',
      description: 'Melhor CRM para corretores e imobiliárias em 2026. Automação de follow-up, gestão de visitas e controle de comissões. Pare de perder vendas por desorganização. Teste grátis.',
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
    icon: 'Building2'
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
      title: 'CRM para Energia Solar 2026 | Sistema de Gestão de Propostas Fotovoltaicas',
      description: 'Melhor CRM para integradoras solares em 2026. Gestão completa de propostas, visitas técnicas e instalações. Converta mais projetos com automação inteligente. Teste grátis.',
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
    icon: 'Sun'
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
      title: 'CRM para Agências de Marketing 2026 | Melhor Sistema de Vendas e Automação',
      description: 'Top #1 CRM para agências digitais em 2026. Automação de propostas comerciais, qualificação de leads e métricas em tempo real. Escale suas vendas hoje. Teste grátis.',
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
    icon: 'Sparkles'
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
      title: 'CRM para Consultores 2026 | Gestão Automatizada de Projetos e Clientes',
      description: 'Melhor CRM para consultores empresariais em 2026. Automação de follow-up, controle de projetos e propostas comerciais. Feche mais contratos com menos esforço. Grátis.',
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
    icon: 'Briefcase'
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
      title: 'CRM para Representantes Comerciais 2026 | Automação de Vendas e Pedidos',
      description: 'Melhor CRM para representantes em 2026. Automação de follow-up, gestão de carteira e lembretes de recompra. Aumente suas vendas 50% com inteligência. Grátis.',
      keywords: [
        'crm para representantes',
        'crm representante comercial',
        'gestão carteira clientes',
        'organizar vendas representante',
        'sistema representante comercial',
        'aumentar vendas representante',
        'app representante'
      ]
    },
    color: {
      primary: 'green',
      secondary: 'emerald',
      gradient: 'from-green-600 to-emerald-600'
    },
    icon: 'TrendingUp'
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
