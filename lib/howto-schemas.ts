/**
 * HowTo schemas para artigos tutoriais do blog.
 * O Google exibe steps estruturados diretamente nos resultados de busca.
 * Referência: https://schema.org/HowTo
 */

interface HowToStep {
  name: string
  text: string
}

interface HowToSchema {
  '@context': 'https://schema.org'
  '@type': 'HowTo'
  name: string
  description: string
  totalTime?: string // ISO 8601 duration: PT10M = 10 minutos
  estimatedCost?: { '@type': 'MonetaryAmount'; currency: string; value: string }
  step: Array<{ '@type': 'HowToStep'; name: string; text: string }>
}

function buildHowTo(
  name: string,
  description: string,
  steps: HowToStep[],
  opts?: { totalTime?: string; cost?: string }
): HowToSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    ...(opts?.totalTime && { totalTime: opts.totalTime }),
    ...(opts?.cost && {
      estimatedCost: { '@type': 'MonetaryAmount', currency: 'BRL', value: opts.cost },
    }),
    step: steps.map((s) => ({ '@type': 'HowToStep', name: s.name, text: s.text })),
  }
}

export const howToSchemas: Record<string, HowToSchema> = {
  'como-organizar-pipeline-vendas': buildHowTo(
    'Como Organizar seu Pipeline de Vendas com um CRM',
    'Guia passo a passo para estruturar seu funil de vendas, definir etapas e acompanhar negócios em tempo real.',
    [
      { name: 'Defina as etapas do seu funil', text: 'Mapeie as fases do seu processo comercial: Prospecção, Qualificação, Proposta, Negociação e Fechamento. Adapte ao seu ciclo de venda real.' },
      { name: 'Cadastre seus primeiros negócios', text: 'Importe leads do Excel ou adicione manualmente. Inclua valor, prazo esperado e responsável para cada oportunidade.' },
      { name: 'Configure as atividades de acompanhamento', text: 'Crie tarefas de follow-up para cada negócio: ligações, envio de proposta, reunião. Defina prazo e prioridade.' },
      { name: 'Mova os cards pelo Kanban', text: 'À medida que o lead avança, arraste o card para a próxima etapa. O CRM registra automaticamente data e hora de cada transição.' },
      { name: 'Analise o relatório semanal', text: 'Revise a taxa de conversão entre etapas, identifique gargalos e ajuste sua estratégia com base em dados reais.' },
    ],
    { totalTime: 'PT30M', cost: '0' }
  ),

  'como-organizar-carteira-clientes-representante': buildHowTo(
    'Como Organizar sua Carteira de Clientes sem Depender do Sistema da Fábrica',
    'Passo a passo para representantes comerciais criarem uma carteira de clientes própria e portátil, independente do ERP da representada.',
    [
      { name: 'Exporte seus contatos do sistema da fábrica', text: 'Solicite ao backoffice um relatório em CSV ou Excel com seus clientes ativos. Se não for possível, importe do seu WhatsApp Business.' },
      { name: 'Importe para o CRM pessoal', text: 'Use a função de importação CSV do Sirius CRM para subir todos os contatos de uma vez. Mapeie os campos: nome, CNPJ, telefone, cidade, segmento.' },
      { name: 'Segmente por curva ABC', text: 'Classifique clientes por volume de pedidos: A (top 20%, 80% da receita), B (30% intermediários), C (50% menores). Foque esforço nos A e B.' },
      { name: 'Adicione histórico de interações', text: 'Registre visitas, pedidos e conversas passadas nos cards dos clientes. Quanto mais contexto, melhor o atendimento na próxima visita.' },
      { name: 'Configure alertas de inatividade', text: 'Programe notificações para clientes sem pedido há 30, 60 ou 90 dias. Reativação proativa evita perda silenciosa de carteira.' },
    ],
    { totalTime: 'PT45M', cost: '0' }
  ),

  'como-usar-google-maps-para-prospectar': buildHowTo(
    'Como Usar o Google Maps para Prospectar Empresas',
    'Guia prático para usar o Google Maps como ferramenta de prospecção B2B local, encontrar empresas na sua região e importar leads para o CRM.',
    [
      { name: 'Defina seu território de prospecção', text: 'Abra o Google Maps e pesquise pelo segmento-alvo + cidade: "distribuidoras São Paulo", "construtoras Campinas". Delimite o raio geográfico do seu territory.' },
      { name: 'Filtre por avaliação e porte', text: 'Priorize empresas com 3+ avaliações (sinal de atividade) e busque indícios de porte: tamanho do local, quantidade de fotos, horário de atendimento.' },
      { name: 'Colete dados de contato', text: 'Para cada empresa: anote nome fantasia, telefone, site e endereço. Ferramentas como o Sirius PRO automatizam essa coleta via Google Places API.' },
      { name: 'Qualifique antes de ligar', text: 'Pesquise o site e LinkedIn da empresa. Identifique cargo do decisor, porte aproximado e possíveis dores antes do primeiro contato.' },
      { name: 'Importe para o CRM e crie sequência de follow-up', text: 'Adicione os leads ao pipeline com tag "Google Maps" para rastrear a origem. Configure cadência: ligação D+1, WhatsApp D+3, email D+7.' },
    ],
    { totalTime: 'PT20M', cost: '0' }
  ),

  'crm-offline-para-vendedores': buildHowTo(
    'Como Usar um CRM Offline para Registrar Pedidos sem Internet',
    'Passo a passo para vendedores externos registrarem visitas, pedidos e interações sem conexão e sincronizarem ao reconectar.',
    [
      { name: 'Instale o app como PWA no celular', text: 'Acesse siriuscrm.com.br no Chrome, toque em "Adicionar à tela inicial". O app baixa os dados dos clientes para cache local — funciona sem internet.' },
      { name: 'Registre visitas e pedidos offline', text: 'Durante a visita, abra o card do cliente, registre o pedido com valor, produtos e observações. Os dados ficam salvos localmente.' },
      { name: 'Fotografe documentos e assinaturas', text: 'Use a câmera do app para registrar pedidos assinados, notas fiscais ou contratos. As fotos ficam na fila de sincronização.' },
      { name: 'Sincronize ao reconectar', text: 'Assim que o Wi-Fi ou 4G reconectar, o app sincroniza automaticamente todos os registros offline com a nuvem. Zero perda de dados.' },
      { name: 'Revise conflitos se necessário', text: 'Se outro vendedor editou o mesmo cliente durante sua visita offline, o CRM mostra os dois registros para você escolher qual manter.' },
    ],
    { totalTime: 'PT15M', cost: '0' }
  ),

  'melhor-crm-2026-comparativo': buildHowTo(
    'Como Escolher o Melhor CRM para sua Empresa em 2026',
    'Método em 4 passos para comparar CRMs com critérios objetivos e escolher o sistema certo sem depender de opiniões enviesadas.',
    [
      { name: 'Liste suas 5 necessidades prioritárias', text: 'Antes de comparar ferramentas, defina o que é inegociável: WhatsApp integrado? Pipeline Kanban? IA para qualificação? Preço em BRL? Funcionamento offline? Priorize 5 critérios do seu processo de vendas real.' },
      { name: 'Avalie os 7 critérios eliminatórios', text: 'Para cada CRM, verifique: (1) UX/facilidade, (2) mobile/offline, (3) WhatsApp nativo, (4) automações, (5) analytics, (6) personalização, (7) preço em BRL. Se falhar em 2+ critérios prioritários, elimine.' },
      { name: 'Teste os 2-3 finalistas por 7 dias', text: 'Crie conta gratuita nos finalistas e simule seu fluxo real: importe 10 contatos, crie 5 negócios, envie 1 proposta. O que parecer mais natural em 7 dias é o vencedor.' },
      { name: 'Calcule o custo total de 12 meses', text: 'Some licença mensal × 12 × número de usuários + custo de migração + horas de treinamento. Compare o investimento total, não apenas o preço por mês. Alguns CRMs cobram extras por WhatsApp, IA ou relatórios.' },
    ],
    { totalTime: 'PT30M', cost: '0' }
  ),

  'kpis-de-vendas': buildHowTo(
    'Como Montar um Dashboard de KPIs de Vendas',
    'Passo a passo para configurar os 12 KPIs essenciais no seu CRM e acompanhar a performance da equipe comercial em tempo real.',
    [
      { name: 'Defina os KPIs por grupo', text: 'Organize em 3 categorias: Pipeline (taxa de conversão por etapa, velocidade, valor total), Performance (win rate, ticket médio, ciclo), Financeiro (CAC, LTV, MRR). Comece com 4-5 KPIs, não os 12 de uma vez.' },
      { name: 'Configure o pipeline com etapas mensuráveis', text: 'Cada etapa do Kanban deve ter critério claro de saída: "Qualificado" = respondeu 3 perguntas BANT, "Proposta" = recebeu documento formal. Sem critérios claros, os KPIs ficam imprecisos.' },
      { name: 'Estabeleça benchmarks internos', text: 'Calcule seus KPIs dos últimos 3 meses como linha de base. Benchmark B2B típico: conversão 2-5%, ciclo 30-90 dias, win rate 15-25%. Mas o mais importante é melhorar em relação a si mesmo.' },
      { name: 'Revise semanalmente com o time', text: 'Na reunião de vendas, mostre o dashboard com 3 perguntas: (1) Quais KPIs melhoraram? (2) Quais pioraram? (3) O que faremos diferente esta semana? KPI sem ação é só decoração.' },
    ],
    { totalTime: 'PT20M', cost: '0' }
  ),

  'planilha-controle-comissao-corretor': buildHowTo(
    'Como Usar a Planilha de Controle de Comissão para Corretores',
    'Passo a passo para baixar, configurar e usar a planilha gratuita de comissões imobiliárias no Excel ou Google Sheets.',
    [
      { name: 'Baixe a planilha gratuita', text: 'Clique no botão de download no artigo. A planilha funciona no Excel (2016+) e Google Sheets. São 4 abas: Controle de Vendas, Dashboard, Calculadora ROI e Instruções.' },
      { name: 'Configure suas faixas de comissão', text: 'Na aba Instruções, ajuste os percentuais: comissão padrão (6%), split com imobiliária (50/50 ou 60/40) e bônus por meta. A planilha calcula automaticamente com base nesses parâmetros.' },
      { name: 'Registre cada venda no momento do fechamento', text: 'Preencha: data, nome do cliente, valor do imóvel, tipo (venda/locação), status (pendente/recebido). A aba Dashboard atualiza automaticamente os totais.' },
      { name: 'Acompanhe comissões pendentes mensalmente', text: 'A aba Dashboard mostra: total recebido, total pendente, previsão dos próximos 30 dias e comparativo mensal. Use para cobrar comissões atrasadas e planejar seu fluxo de caixa.' },
    ],
    { totalTime: 'PT10M', cost: '0' }
  ),

  'como-escolher-crm-b2b-2026': buildHowTo(
    'Como Escolher um CRM B2B em 5 Passos',
    'Método prático para PMEs e representantes comerciais escolherem o CRM ideal sem gastar tempo com demos infinitas.',
    [
      { name: 'Responda as 5 perguntas de qualificação', text: 'Antes de pesquisar: (1) Quantos vendedores? (2) Seu processo é B2B ou B2C? (3) Usa WhatsApp para vender? (4) Precisa funcionar offline? (5) Orçamento mensal por usuário? As respostas eliminam 80% das opções.' },
      { name: 'Aplique os 7 critérios eliminatórios', text: 'Para cada CRM: WhatsApp nativo, pipeline Kanban, IA, mobile/offline, preço em BRL, onboarding rápido, suporte em português. Se falhar em 2+ critérios, não perca tempo testando.' },
      { name: 'Compare preço total em 12 meses', text: 'Calcule: (preço/mês × usuários × 12) + custo de migração + treinamento. Cuidado com CRMs que cobram em dólar — R$67/mês fixo vs US$12.50/mês que vira R$75 com câmbio e IOF.' },
      { name: 'Teste o favorito por 7 dias com dados reais', text: 'Importe seus contatos reais, crie negócios verdadeiros e use por uma semana. Se o time não adotar naturalmente em 7 dias, o CRM é complexo demais para sua operação.' },
      { name: 'Decida com base em adoção, não em features', text: 'O melhor CRM é o que o time realmente usa. Um sistema com 200 features e 10% de adoção perde para um sistema simples com 90% de adoção. Priorize UX sobre funcionalidades.' },
    ],
    { totalTime: 'PT45M', cost: '0' }
  ),

  'prospeccao-de-clientes-b2b': buildHowTo(
    'Como Prospectar Clientes B2B com um CRM',
    'Método em 5 passos para estruturar a prospecção B2B usando ICP, cadência multicanal e CRM para escalar sem perder qualidade.',
    [
      { name: 'Defina seu ICP (Ideal Customer Profile)', text: 'Identifique as 3-5 características dos seus melhores clientes: segmento, porte (faturamento/funcionários), cargo do decisor, localização e dor principal.' },
      { name: 'Construa uma lista de leads qualificados', text: 'Use LinkedIn, Google Maps, CNPJ.biz ou a prospecção automática do Sirius PRO para encontrar empresas que atendem seu ICP. Meta: 50-100 leads por semana.' },
      { name: 'Crie a cadência de abordagem', text: 'Sequência padrão: D+0 LinkedIn connection request, D+2 cold email personalizado, D+5 WhatsApp com referência ao email, D+10 ligação de follow-up.' },
      { name: 'Registre tudo no CRM', text: 'Cada tentativa de contato vira uma atividade no card do lead. Isso elimina o principal problema: o follow-up que não acontece por falta de controle.' },
      { name: 'Meça e ajuste', text: 'Analise taxa de resposta por canal e por ICP. Se cold email converte mais que LinkedIn para seu segmento, dobre a aposta. Dados guiam a otimização.' },
    ],
    { totalTime: 'PT60M', cost: '0' }
  ),
}

/** Retorna o schema HowTo para um slug, ou null se não houver */
export function getHowToSchema(slug: string): HowToSchema | null {
  return howToSchemas[slug] ?? null
}
