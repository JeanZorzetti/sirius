/**
 * Configuração de Cidades para SEO Local Programático
 *
 * Cada cidade gera uma página estática em /solucoes/cidade/[slug]
 * com conteúdo personalizado à realidade econômica local.
 *
 * Reutiliza a mesma interface NicheData de niche-data.ts.
 */

import { NicheData } from './niche-data'

export const CITIES: NicheData[] = [
  {
    slug: 'crm-para-empresas-em-sao-paulo',
    title: 'O CRM que Fecha Mais Negócios em São Paulo',
    subtitle: 'Velocidade de resposta define quem fecha em SP',
    painPoint: 'Perdendo leads para concorrentes porque o follow-up demora horas?',
    painPointSecondary: 'Time comercial afogado em planilhas enquanto o cliente decide em outra empresa?',
    jargon: {
      lead: 'Lead',
      deal: 'Negócio',
      revenue: 'Faturamento',
      pipeline: 'Pipeline Comercial',
      conversion: 'Taxa de Conversão'
    },
    calculatorCopy: {
      title: 'Quanto faturamento sua empresa paulistana está perdendo?',
      subtitle: 'Em SP, quem responde primeiro fecha. Calcule o custo do seu atraso.',
      volumeLabel: 'Quantos leads sua empresa recebe por mês?',
      ticketLabel: 'Qual o ticket médio dos seus negócios?',
      ctaText: 'Fechar mais rápido que a concorrência'
    },
    benefits: [
      {
        title: 'Resposta Instantânea via WhatsApp',
        description: 'Em São Paulo, o cliente recebe 3 propostas no mesmo dia. Com automação de WhatsApp, você é o primeiro a responder — e quem responde primeiro fecha mais.'
      },
      {
        title: 'Pipeline para Times Comerciais',
        description: 'Gerencie equipes de SDR, closers e pós-venda em um funil unificado. Visibilidade total do ciclo comercial, do lead inbound ao contrato assinado.'
      },
      {
        title: 'IA que Qualifica Leads Automaticamente',
        description: 'Com o volume de leads de São Paulo, não dá pra qualificar tudo manual. A IA identifica os prospects com maior propensão a fechar e prioriza sua agenda.'
      },
      {
        title: 'Métricas de Conversão em Tempo Real',
        description: 'Dashboards para gestores e diretores comerciais. Veja CAC, ciclo de venda e taxa de conversão por canal — dados para tomar decisões mais rápidas.'
      }
    ],
    faq: [
      {
        question: 'O Sirius funciona para empresas com times grandes em São Paulo?',
        answer: 'Sim! Você pode cadastrar toda a equipe comercial, definir territórios e permissões por usuário. Ideal para times de 5 a 100 pessoas — com visibilidade total para gestores e diretores.'
      },
      {
        question: 'Tem integração com ferramentas que as startups paulistanas usam (HubSpot, Pipedrive)?',
        answer: 'Você pode migrar sua base existente via importação CSV. Estamos desenvolvendo integrações nativas com as principais ferramentas — enquanto isso, nossa API REST permite conexões personalizadas.'
      },
      {
        question: 'Como o Sirius ajuda a competir no mercado mais competitivo do Brasil?',
        answer: 'Com automação de follow-up e WhatsApp, você responde leads em minutos — não em horas. A IA prioriza os prospects mais quentes para que seu time foque energia onde converte mais.'
      }
    ],
    seo: {
      title: 'CRM para PMEs Brasileiras em São Paulo 2026: IA',
      description: 'CRM com IA para empresas em São Paulo. Follow-up automático, WhatsApp integrado e pipeline visual. Feche mais rápido que a concorrência. Teste grátis — sem cartão.',
      keywords: [
        'crm sao paulo',
        'crm para empresas em sao paulo',
        'software crm sp',
        'gestao comercial sao paulo',
        'crm pme paulistana',
        'crm whatsapp sao paulo',
        'sistema de vendas sao paulo',
        'crm para startups sp'
      ]
    },
    icon: 'TrendingUp'
  },
  {
    slug: 'crm-para-empresas-em-curitiba',
    title: 'O CRM para Representantes e Distribuidoras de Curitiba',
    subtitle: 'Organize sua carteira e venda mais no Sul do Brasil',
    painPoint: 'Perdendo pedidos de distribuidoras por falta de controle de follow-up?',
    painPointSecondary: 'Representantes da região sul sem visibilidade da carteira de clientes?',
    jargon: {
      lead: 'Cliente',
      deal: 'Pedido',
      revenue: 'Faturamento',
      pipeline: 'Carteira de Clientes',
      conversion: 'Taxa de Recompra'
    },
    calculatorCopy: {
      title: 'Quanto sua distribuidora está perdendo por desorganização?',
      subtitle: 'Calcule o impacto de pedidos não acompanhados na região Sul.',
      volumeLabel: 'Quantos clientes você atende por mês?',
      ticketLabel: 'Qual o valor médio de pedido?',
      ctaText: 'Organizar minha carteira agora'
    },
    benefits: [
      {
        title: 'Gestão de Carteira para o Setor Industrial',
        description: 'Curitiba concentra polo automotivo, metal-mecânico e de tecnologia. Organize clientes por setor, região e ciclo de recompra — com alertas automáticos para o timing certo.'
      },
      {
        title: 'Controle de Pedidos para Distribuidoras',
        description: 'Acompanhe cada pedido desde o contato inicial até a entrega. Histórico completo de cada cliente para antecipar necessidades e evitar perda para o concorrente.'
      },
      {
        title: 'Carteira no Celular em Campo',
        description: 'Representantes que visitam clientes na Grande Curitiba e no interior do Paraná consultam a ficha do cliente no celular e registram a visita assim que têm sinal.'
      },
      {
        title: 'Relatórios por Região e Canal',
        description: 'Visualize performance por território — Grande Curitiba, litoral paranaense, interior. Identifique onde estão as melhores oportunidades de crescimento.'
      }
    ],
    faq: [
      {
        question: 'O Sirius funciona para distribuidoras com múltiplos representantes em Curitiba?',
        answer: 'Sim! Você cadastra toda a equipe, define territórios e monitora a performance de cada representante. Gestão centralizada com visibilidade individual por vendedor.'
      },
      {
        question: 'Consigo usar o CRM durante visitas técnicas no interior do Paraná sem internet?',
        answer: 'Em parte. Sem internet, o app mostra as telas que você já abriu. Para registrar a visita, o pedido ou a observação, é preciso ter conexão.'
      },
      {
        question: 'Como o Sirius se adapta ao ciclo de vendas mais longo do setor industrial?',
        answer: 'Você personaliza as etapas do pipeline conforme seu processo: Prospecção → Proposta → Negociação → Pedido → Entrega. O sistema cria follow-ups automáticos em cada etapa.'
      }
    ],
    seo: {
      title: 'CRM para Empresas em Curitiba 2026: IA e WhatsApp',
      description: 'CRM com IA para empresas em Curitiba. Gestão de carteira, pedidos e pipeline para distribuidoras e representantes do Sul. Teste grátis — sem cartão.',
      keywords: [
        'crm curitiba',
        'crm para empresas em curitiba',
        'crm distribuidoras curitiba',
        'crm representantes parana',
        'software vendas curitiba',
        'gestao comercial curitiba',
        'crm para industria curitiba'
      ]
    },
    icon: 'Briefcase'
  },
  {
    slug: 'crm-para-empresas-em-belo-horizonte',
    title: 'O CRM que Estrutura o Pipeline de Vendas em BH',
    subtitle: 'Venda mais para PMEs mineiras com processo organizado',
    painPoint: 'Clientes de BH levam mais tempo para decidir — e você perde por não acompanhar?',
    painPointSecondary: 'Propostas enviadas para empresas de construção e mineração sem retorno?',
    jargon: {
      lead: 'Prospect',
      deal: 'Proposta',
      revenue: 'Faturamento',
      pipeline: 'Pipeline de Vendas',
      conversion: 'Taxa de Fechamento'
    },
    calculatorCopy: {
      title: 'Quanto sua empresa mineira está perdendo por falta de follow-up?',
      subtitle: 'O cliente de BH decide devagar — mas decide. Calcule o custo de não acompanhar.',
      volumeLabel: 'Quantas propostas você envia por mês?',
      ticketLabel: 'Qual o ticket médio dos seus projetos?',
      ctaText: 'Fechar mais propostas mineiras'
    },
    benefits: [
      {
        title: 'Pipeline Adaptado ao Ciclo Longo de BH',
        description: 'Empresas de Belo Horizonte — construção civil, mineração, serviços B2B — têm ciclos de decisão mais longos. Configure etapas de follow-up automático para não perder nenhuma proposta no caminho.'
      },
      {
        title: 'Histórico Completo de Propostas',
        description: 'Registre todas as reuniões, revisões de proposta e objeções de cada empresa. Retome qualquer negociação no contexto certo, mesmo meses depois do primeiro contato.'
      },
      {
        title: 'WhatsApp para Relacionamento B2B',
        description: 'Em BH, o relacionamento é fundamental. Use WhatsApp integrado para manter contato próximo com decisores de empresas mineiras — sem perder o histórico das conversas.'
      },
      {
        title: 'Relatórios de Performance Comercial',
        description: 'Veja taxa de conversão por setor (construção, mineração, serviços), tempo médio de fechamento e ticket médio. Foque nos segmentos que mais convertem na sua região.'
      }
    ],
    faq: [
      {
        question: 'O Sirius funciona para empresas que vendem para construtoras e mineradoras em BH?',
        answer: 'Sim! Você pode criar pipelines específicos para cada segmento, com etapas e campos personalizados para construção civil, mineração ou qualquer setor B2B mineiro.'
      },
      {
        question: 'Como gerenciar follow-ups de propostas que levam 3 a 6 meses para fechar?',
        answer: 'Configure sequências de follow-up automáticas com intervalos personalizados — 7 dias, 15 dias, 30 dias. O sistema envia lembretes e mensagens nos momentos certos sem você precisar lembrar.'
      },
      {
        question: 'Funciona para times pequenos (2 a 5 vendedores) como a maioria das PMEs de BH?',
        answer: 'Perfeitamente. O plano gratuito suporta times pequenos com todos os recursos essenciais. Muitos dos nossos usuários em Belo Horizonte são PMEs com 2 a 10 pessoas no comercial.'
      }
    ],
    seo: {
      title: 'CRM para Empresas em Belo Horizonte 2026: IA',
      description: 'CRM com IA para empresas em Belo Horizonte. Pipeline para ciclos longos, follow-up automático e WhatsApp integrado para PMEs mineiras. Teste grátis — sem cartão.',
      keywords: [
        'crm belo horizonte',
        'crm para empresas em belo horizonte',
        'crm bh',
        'software vendas belo horizonte',
        'crm pme mineira',
        'gestao comercial bh',
        'crm construcao civil bh',
        'crm b2b minas gerais'
      ]
    },
    icon: 'Building2'
  },
  {
    slug: 'crm-para-vendedores-em-porto-alegre',
    title: 'O CRM para Representantes e Distribuidores Gaúchos',
    subtitle: 'Organize sua carteira e multiplique as recompras no RS',
    painPoint: 'Perdendo clientes gaúchos para concorrentes por falta de contato regular?',
    painPointSecondary: 'Sem visibilidade da carteira de distribuidores e revendas no Rio Grande do Sul?',
    jargon: {
      lead: 'Cliente',
      deal: 'Pedido',
      revenue: 'Faturamento',
      pipeline: 'Carteira Ativa',
      conversion: 'Taxa de Recompra'
    },
    calculatorCopy: {
      title: 'Quanto sua representação gaúcha está deixando na mesa?',
      subtitle: 'Calcule o impacto de clientes que pararam de comprar por falta de acompanhamento.',
      volumeLabel: 'Quantos clientes você atende por mês?',
      ticketLabel: 'Qual o valor médio de pedido?',
      ctaText: 'Aumentar minhas recompras agora'
    },
    benefits: [
      {
        title: 'Gestão de Carteira para o Agronegócio e Indústria RS',
        description: 'Porto Alegre é hub de representação para o agronegócio gaúcho, metalurgia e distribuição. Organize clientes por setor e frequência de compra para nunca perder uma recompra.'
      },
      {
        title: 'Roteiro de Visitas para o Interior do RS',
        description: 'Planeje visitas a clientes espalhados pelo Rio Grande do Sul com roteiros otimizados. Registre tudo pelo celular e aproveite cada viagem.'
      },
      {
        title: 'Automação de Pedidos Recorrentes',
        description: 'Identifique padrões de recompra de cada cliente e programe lembretes automáticos. O sistema avisa quando está na hora de ligar para o cliente antes que ele compre do concorrente.'
      },
      {
        title: 'Histórico Completo por Cliente',
        description: 'Todo o histórico de pedidos, conversas e negociações de cada distribuidor gaúcho em um único lugar. Retome qualquer conversa com contexto — mesmo anos depois.'
      }
    ],
    faq: [
      {
        question: 'Funciona para representantes que cobrem todo o Rio Grande do Sul?',
        answer: 'Sim! Você organiza clientes por região — Grande Porto Alegre, Serra Gaúcha, Litoral, Campanha — e planeja rotas de visita. Para registrar a visita, é preciso ter conexão.'
      },
      {
        question: 'Consigo gerenciar clientes de múltiplas representadas no mesmo CRM?',
        answer: 'Sim! Use tags ou pipelines separados para organizar clientes por representada. Tenha visibilidade total da sua carteira, independente de quantas marcas você representa.'
      },
      {
        question: 'Como funciona o controle de comissões para representantes gaúchos?',
        answer: 'Você registra o valor de cada pedido e o percentual de comissão. O sistema projeta suas comissões futuras com base na carteira ativa — visibilidade financeira que planilha não oferece.'
      }
    ],
    seo: {
      title: 'CRM para Vendedores em Porto Alegre 2026: IA',
      description: 'CRM com IA para representantes e distribuidores em Porto Alegre. Gestão de carteira e automação de recompras para o mercado gaúcho. Teste grátis — sem cartão.',
      keywords: [
        'crm porto alegre',
        'crm representante comercial rs',
        'crm para vendedores porto alegre',
        'crm gaúcho',
        'software representante rs',
        'gestao carteira clientes rs',
        'crm distribuidores rio grande do sul',
        'crm agronegocio rs'
      ]
    },
    icon: 'TrendingUp'
  },
  {
    slug: 'crm-para-empresas-no-rio-de-janeiro',
    title: 'O CRM com Pipeline e WhatsApp para Times Cariocas',
    subtitle: 'Estruture o comercial e feche mais no Rio de Janeiro',
    painPoint: 'Time carioca perdendo negócios por pipeline desestruturado e follow-up irregular?',
    painPointSecondary: 'Clientes no WhatsApp sumindo sem retorno porque não tem processo definido?',
    jargon: {
      lead: 'Lead',
      deal: 'Negócio',
      revenue: 'Faturamento',
      pipeline: 'Pipeline de Vendas',
      conversion: 'Taxa de Fechamento'
    },
    calculatorCopy: {
      title: 'Quanto faturamento seu time no Rio está perdendo?',
      subtitle: 'Calcule o impacto de um processo comercial desestruturado no mercado carioca.',
      volumeLabel: 'Quantos leads seu time recebe por mês?',
      ticketLabel: 'Qual o ticket médio dos seus serviços?',
      ctaText: 'Estruturar meu comercial no RJ'
    },
    benefits: [
      {
        title: 'WhatsApp Integrado para o Mercado Carioca',
        description: 'No Rio de Janeiro, o WhatsApp é o canal principal de negócios. Gerencie todas as conversas comerciais com histórico completo — sem misturar pessoal com profissional.'
      },
      {
        title: 'Pipeline para Serviços e Consultoria RJ',
        description: 'Turismo de negócios, construção, serviços B2B e consultorias são pilares do RJ. Crie pipelines específicos para cada tipo de serviço com etapas personalizadas.'
      },
      {
        title: 'IA Nativa para Qualificação de Leads',
        description: 'O mercado carioca tem alto volume de contatos informais. A IA do Sirius qualifica automaticamente quem tem real potencial de fechar, para seu time focar no que converte.'
      },
      {
        title: 'Relatórios para Gestores Comerciais',
        description: 'Dashboards com taxa de conversão por bairro, segmento e canal de origem. Entenda onde estão os melhores negócios no Rio e direcione seu time com dados.'
      }
    ],
    faq: [
      {
        question: 'O Sirius funciona para empresas de turismo e eventos no Rio de Janeiro?',
        answer: 'Perfeitamente. Você pode criar pipelines com etapas específicas para o ciclo de venda de turismo e eventos — desde a consulta inicial até o fechamento do grupo ou contrato.'
      },
      {
        question: 'Como gerenciar clientes que entram pelo WhatsApp de forma mais informal?',
        answer: 'O Sirius integra com WhatsApp Business. Quando um contato entra, você cria o lead diretamente da conversa, com histórico completo — sem perder o contexto informal do mercado carioca.'
      },
      {
        question: 'Funciona para times distribuídos pela cidade (Zona Sul, Norte, Baixada)?',
        answer: 'Sim! Você pode segmentar clientes e oportunidades por região geográfica. Cada vendedor gerencia sua área com visibilidade individual, e o gestor vê tudo consolidado.'
      }
    ],
    seo: {
      title: 'CRM para Empresas no Rio de Janeiro 2026: IA',
      description: 'CRM com IA nativa para empresas no Rio de Janeiro. WhatsApp integrado, pipeline de vendas e qualificação automática para times cariocas. Teste grátis — sem cartão.',
      keywords: [
        'crm rio de janeiro',
        'crm rj',
        'crm para empresas no rio de janeiro',
        'software crm rio de janeiro',
        'crm whatsapp rj',
        'gestao comercial rio de janeiro',
        'crm servicos rj',
        'crm consultoria rio de janeiro'
      ]
    },
    icon: 'Sparkles'
  },
  {
    slug: 'crm-para-empresas-em-brasilia',
    title: 'O CRM para Consultores e Prestadores de Serviço no DF',
    subtitle: 'Proposta automática e pipeline para o mercado de Brasília',
    painPoint: 'Perdendo contratos no DF porque a proposta demora mais que a concorrência?',
    painPointSecondary: 'Consultores e prestadores sem processo comercial para atender o mercado B2B de Brasília?',
    jargon: {
      lead: 'Prospect',
      deal: 'Contrato',
      revenue: 'Honorários',
      pipeline: 'Pipeline de Contratos',
      conversion: 'Taxa de Fechamento'
    },
    calculatorCopy: {
      title: 'Quanto em contratos sua empresa brasiliense está perdendo?',
      subtitle: 'No DF, quem tem processo vence. Calcule o impacto de não ter pipeline estruturado.',
      volumeLabel: 'Quantos prospects você conversa por mês?',
      ticketLabel: 'Qual o valor médio dos seus contratos?',
      ctaText: 'Fechar mais contratos no DF'
    },
    benefits: [
      {
        title: 'Proposta Automática para o Mercado de Brasília',
        description: 'Consultores e prestadores do DF competem por contratos com ciclos rígidos. Gere propostas profissionais automaticamente com IA — mais rápido que qualquer concorrente.'
      },
      {
        title: 'Pipeline para Contratos B2B e Licitações',
        description: 'Organize oportunidades de contratos B2B com empresas públicas e privadas de Brasília. Acompanhe cada etapa — do primeiro contato à assinatura — sem perder prazo.'
      },
      {
        title: 'Gestão de Relacionamento com Tomadores de Decisão',
        description: 'No DF, quem você conhece importa tanto quanto o que você oferece. Registre contatos, histórico de interações e preferências de cada decisor para nutrir relacionamentos estratégicos.'
      },
      {
        title: 'Controle de Renovações de Contrato',
        description: 'Nunca perca uma renovação. O sistema avisa com antecedência quando contratos estão próximos do vencimento — para você agir antes que o cliente procure outro fornecedor.'
      }
    ],
    faq: [
      {
        question: 'O Sirius funciona para consultores que atendem tanto setor privado quanto público no DF?',
        answer: 'Sim! Você pode criar pipelines distintos para contratos privados e processos de licitação/credenciamento. Campos personalizados permitem registrar especificidades de cada tipo de contrato.'
      },
      {
        question: 'Como funciona a geração de propostas automáticas?',
        answer: 'Com base nas informações do prospect e do escopo, a IA gera um rascunho de proposta em minutos. Você revisa, personaliza e envia — direto pelo CRM, com rastreamento de abertura.'
      },
      {
        question: 'Tem como controlar renovações de contrato recorrente em Brasília?',
        answer: 'Sim! Para cada contrato, você define a data de vencimento e o período de alerta. O sistema cria automaticamente uma tarefa de renovação com antecedência configurável — 30, 60 ou 90 dias antes.'
      }
    ],
    seo: {
      title: 'CRM para Empresas em Brasília 2026: Propostas com IA',
      description: 'CRM com IA para consultores e prestadores de serviço em Brasília. Proposta automática, pipeline de contratos e renovações automáticas para o mercado do DF. Teste grátis — sem cartão.',
      keywords: [
        'crm brasilia',
        'crm distrito federal',
        'crm para empresas em brasilia',
        'crm consultores df',
        'software crm brasilia',
        'gestao contratos brasilia',
        'crm prestadores servico df',
        'crm b2b brasilia'
      ]
    },
    icon: 'Briefcase'
  }
]

/**
 * Retorna dados de uma cidade pelo slug
 */
export function getCityBySlug(slug: string): NicheData | undefined {
  return CITIES.find(city => city.slug === slug)
}

/**
 * Retorna todos os slugs de cidades (para generateStaticParams)
 */
export function getAllCitySlugs(): string[] {
  return CITIES.map(city => city.slug)
}

/**
 * Mapa slug → nome de exibição da cidade
 */
export const CITY_DISPLAY_NAMES: Record<string, string> = {
  'crm-para-empresas-em-sao-paulo': 'São Paulo',
  'crm-para-empresas-em-curitiba': 'Curitiba',
  'crm-para-empresas-em-belo-horizonte': 'Belo Horizonte',
  'crm-para-vendedores-em-porto-alegre': 'Porto Alegre',
  'crm-para-empresas-no-rio-de-janeiro': 'Rio de Janeiro',
  'crm-para-empresas-em-brasilia': 'Brasília',
}

/**
 * Mapa slug → addressLocality para JSON-LD LocalBusiness
 */
export const CITY_ADDRESS_LOCALITY: Record<string, string> = {
  'crm-para-empresas-em-sao-paulo': 'São Paulo',
  'crm-para-empresas-em-curitiba': 'Curitiba',
  'crm-para-empresas-em-belo-horizonte': 'Belo Horizonte',
  'crm-para-vendedores-em-porto-alegre': 'Porto Alegre',
  'crm-para-empresas-no-rio-de-janeiro': 'Rio de Janeiro',
  'crm-para-empresas-em-brasilia': 'Brasília',
}
