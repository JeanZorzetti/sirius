/**
 * FAQ Schema Markup Generator for SEO
 * Generates JSON-LD FAQPage schema for Google Featured Snippets
 */

export interface FAQItem {
  question: string
  answer: string
}

/**
 * Strip HTML tags and get plain text for schema markup
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
}

/**
 * Generate FAQPage JSON-LD schema for a blog post
 */
export function generateFAQSchema(faqs: FAQItem[], url: string) {
  if (faqs.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripHtml(faq.answer),
      },
    })),
  }
}

/**
 * FAQ data for SPIN Selling blog post
 */
export const spinSellingFAQs: FAQItem[] = [
  {
    question: 'SPIN Selling funciona para vendas transacionais?',
    answer:
      'Não. SPIN foi desenhado para vendas complexas (B2B, alto ticket, múltiplos decisores). Para vendas transacionais (< R$ 1.000, decisão rápida), use abordagens mais diretas como AIDA ou vendas consultivas simplificadas.',
  },
  {
    question: 'Quanto tempo leva para dominar SPIN?',
    answer:
      'Nível Básico: 2-4 semanas (com prática diária). Nível Intermediário: 2-3 meses (10-15 discoveries). Nível Avançado: 6-12 meses (50+ discoveries + feedback constante). Dica: A curva de aprendizado acelera com gravações + feedback.',
  },
  {
    question: 'Como convencer minha equipe a adotar SPIN?',
    answer:
      '1. Mostre dados: 17% aumento conversão, 53% mais chances (estudos Huthwaite). 2. Piloto: Comece com 1-2 vendedores top performers. 3. Resultados: Compartilhe wins da primeira semana. 4. Gamificação: Crie competição saudável. Insight: Vendedores experientes resistem mais. Foque em provar ROI rápido.',
  },
  {
    question: 'SPIN funciona em vendas remotas (Zoom, Meet)?',
    answer:
      'Sim, inclusive é mais fácil! Benefícios: Você pode ter o template aberto durante a call, Gravação automática para revisão, Cliente não vê você anotando (menos distração), Compartilhamento de tela para mostrar ROI calculado. Dica: Use 2 monitores (1 para Zoom, 1 para template).',
  },
  {
    question: "E se o cliente reclamar de 'muitas perguntas'?",
    answer:
      'Isso indica que você: Não criou rapport inicial, Fez muitas perguntas de Situação (deveria pesquisar antes), Não explicou o propósito do discovery. Script de Ajuste: "Entendo. O motivo de estar fazendo essas perguntas é garantir que, se eu mostrar alguma coisa, seja exatamente o que resolve seus desafios. Posso fazer mais 2-3 perguntas rápidas?"',
  },
  {
    question: 'Qual a diferença entre SPIN e BANT?',
    answer:
      'SPIN Selling: Foco em discovery profundo de dores, usado durante discovery meeting (40-50 min), objetivo de criar valor percebido, resultado é cliente articula necessidade. BANT: Foco em qualificação rápida, usado no lead scoring inicial (10-15 min), objetivo de filtrar leads viáveis, resultado é vendedor decide se qualifica. Melhor Abordagem: Use BANT primeiro (qualificação) depois SPIN (discovery).',
  },
  {
    question: 'Posso combinar SPIN com outras metodologias?',
    answer:
      'Sim! SPIN é altamente complementar: SPIN + BANT: BANT qualifica, SPIN aprofunda. SPIN + GPCT: GPCT mapeia jornada, SPIN explora dores. SPIN + Challenger: SPIN descobre dores, Challenger ensina novas perspectivas. SPIN + Sandler: Sandler qualifica dor, SPIN quantifica.',
  },
  {
    question: 'Como medir ROI do treinamento SPIN?',
    answer:
      'Acompanhe estas métricas (antes vs depois): Taxa Conversão SQL→Proposta (CRM), Duração Média Discovery (Gravações), Problemas Identificados/Discovery (Template SPIN), % Deals com ROI Calculado (CRM campo custom), Objeção "Está Caro" (CRM motivo de perda), Ciclo de Vendas Médio (CRM), Ticket Médio (CRM). Meta Realista: +15-20% conversão em 3 meses.',
  },
  {
    question: 'SPIN funciona para vendas consultivas de serviços?',
    answer:
      'Perfeitamente! Na verdade, SPIN foi criado para consultoria. Adaptações para Serviços: Situação - Foque em projetos anteriores, aprendizados, expectativas. Problema - Explore gargalos em execução, comunicação, timing. Implicação - Quantifique custo de atrasos, retrabalho, escopo mal definido. Necessidade - Explore expectativas de parceria, não só entrega. Exemplo: Consultoria de RH explorando "Qual o custo de uma contratação errada?"',
  },
  {
    question: 'Quanto tempo deve durar um discovery SPIN?',
    answer:
      'Complexidade Simples (SaaS low-touch): 30-40 min. Complexidade Média (CRM, ERP mid-market): 40-50 min. Complexidade Alta (Enterprise, múltiplos decisores): 50-60 min. Regra de Ouro: Se terminou em < 30 min, você não explorou o suficiente.',
  },
]

/**
 * FAQ data for CRM com IA blog post
 */
export const crmIaFAQs: FAQItem[] = [
  {
    question: 'O que é CRM com Inteligência Artificial?',
    answer: 'CRM com Inteligência Artificial é um sistema de gestão de clientes que usa machine learning para automatizar tarefas, prever fechamentos e priorizar leads. Diferente de CRMs tradicionais (que apenas registram), um CRM com IA antecipa o que vai acontecer e recomenda o que fazer agora.',
  },
  {
    question: 'CRM com IA é caro? Vale a pena para PMEs?',
    answer: 'Não. Em 2026, CRMs com IA como o Sirius CRM oferecem planos gratuitos com recursos de IA incluídos. O ROI é imediato: vendedores que usam lead scoring com IA fecham 3x mais deals em menos tempo, sem contratar mais vendedores.',
  },
  {
    question: 'Qual a diferença entre CRM tradicional e CRM com IA?',
    answer: 'CRM tradicional: registra o que aconteceu, depende do vendedor para decidir tudo, gera relatórios do passado. CRM com IA: prevê o que vai acontecer, sugere a próxima ação ideal, prioriza automaticamente os melhores leads e detecta deals em risco antes que esfriem.',
  },
  {
    question: 'Como o Sirius CRM usa IA?',
    answer: 'O Sirius CRM usa IA em 3 camadas: (1) Alertas automáticos de follow-up baseados em padrões de comportamento de compra; (2) Análise de carteira para identificar clientes em risco de churn; (3) Assistente SPIN para qualificação de leads com metodologia de vendas consultiva em linguagem natural.',
  },
  {
    question: 'Preciso de conhecimento técnico para usar IA no CRM?',
    answer: 'Não. Os melhores CRMs com IA são desenhados para vendedores, não para engenheiros. A IA funciona em segundo plano — você recebe alertas, sugestões e previsões de forma clara e acionável. Não é necessário configurar modelos ou entender algoritmos.',
  },
]

/**
 * FAQ data for Automação de Vendas blog post
 */
export const automacaoVendasFAQs: FAQItem[] = [
  {
    question: 'O que é automação de vendas no CRM?',
    answer: 'Automação de vendas no CRM é a configuração de ações automáticas que o sistema executa sem intervenção manual — como enviar um e-mail quando um deal fica 3 dias sem resposta, alertar quando um cliente entra no ciclo de recompra, ou criar tarefas quando um lead avança de etapa no pipeline.',
  },
  {
    question: 'Quais tarefas de vendas posso automatizar?',
    answer: 'As mais comuns: (1) Captura e atribuição de leads de formulários web; (2) E-mails de follow-up por estágio do pipeline; (3) Lembretes para clientes inativos; (4) Alertas de ciclo de recompra B2B; (5) Relatórios automáticos semanais; (6) Registro de interações via WhatsApp no histórico do cliente.',
  },
  {
    question: 'Quanto tempo leva para configurar automação de vendas?',
    answer: 'Com um CRM moderno como o Sirius, você configura as primeiras automações em menos de 30 minutos. Comece simples: gatilho "deal em Proposta Enviada por 3 dias" → ação "criar lembrete de ligação". Isso já resolve o problema mais comum de leads perdidos por falta de follow-up.',
  },
  {
    question: 'Automação de vendas deixa o relacionamento impessoal?',
    answer: 'Não, quando feita corretamente. A automação cuida do que é previsível e repetitivo (lembretes, registros, relatórios), liberando o vendedor para o que exige inteligência emocional: escutar, negociar e construir confiança. O erro é automatizar demais — o toque humano no fechamento e na negociação sempre vale mais.',
  },
  {
    question: 'Qual o ROI da automação de vendas com CRM?',
    answer: 'Em média: +40% de produtividade por vendedor, -60% de leads perdidos por falta de follow-up, +25% de taxa de conversão com contato no timing ideal. Para um vendedor que ganha R$ 8.000/mês e passa 10h/semana em tarefas administrativas, a automação recupera aproximadamente R$ 12.000/ano em tempo produtivo.',
  },
]

/**
 * FAQ data for Melhor CRM 2026 blog post
 */
export const melhorCrm2026FAQs: FAQItem[] = [
  {
    question: 'Qual o melhor CRM para pequenas empresas em 2026?',
    answer: 'Para pequenas empresas em 2026, o melhor CRM combina facilidade de uso, automação de follow-up e plano gratuito generoso. O Sirius CRM oferece pipeline visual, alertas de IA e integração WhatsApp gratuitamente para até 50 clientes — ideal para começar sem investimento inicial.',
  },
  {
    question: 'CRM com WhatsApp é essencial em 2026?',
    answer: 'Sim. No Brasil, mais de 95% dos vendedores usam WhatsApp como principal canal de comunicação com clientes. Um CRM sem integração nativa com WhatsApp em 2026 força cópia manual de conversas, perdendo histórico e eficiência.',
  },
  {
    question: 'Quanto custa um bom CRM em 2026?',
    answer: 'Varia muito: de R$ 0 (planos gratuitos como Sirius CRM, HubSpot Free) até R$ 500+ por usuário/mês (Salesforce, Microsoft Dynamics). Para PMEs brasileiras, a faixa de R$ 0 a R$ 150/mês por usuário cobre a maioria das necessidades.',
  },
  {
    question: 'CRM online ou instalado localmente?',
    answer: 'Em 2026, CRM online (SaaS/cloud) é a escolha dominante: acesso de qualquer lugar, app mobile nativo, atualizações automáticas, sem custo de infraestrutura. CRMs instalados localmente existem para setores muito regulados (governo, saúde) mas são a exceção para vendas B2B e B2C.',
  },
  {
    question: 'Salesforce, HubSpot ou Sirius CRM: qual escolher?',
    answer: 'Depende do contexto: Salesforce é o líder global, poderoso mas complexo e caro (R$ 200-500+/usuário/mês). HubSpot tem excelente plano gratuito mas cobra caro por automações avançadas. O Sirius CRM é feito para o mercado brasileiro, com automações nativas para WhatsApp, alertas de recompra e interface em português — com plano gratuito para sempre até 50 clientes.',
  },
]

/**
 * FAQ data for Prospecção B2B blog post
 */
export const prospeccaoB2bFAQs: FAQItem[] = [
  {
    question: 'Quantos contatos fazer por dia na prospecção B2B?',
    answer: 'Para um SDR dedicado, o benchmark é 50-80 touchpoints por dia (entre emails, mensagens LinkedIn e ligações). Para um vendedor que também fecha, o ideal é 20-30 touchpoints por dia para manter uma cadência saudável sem comprometer o fechamento dos deals ativos. Qualidade é mais importante que volume: 20 emails bem personalizados superam 100 genéricos.',
  },
  {
    question: 'Cold email ou LinkedIn: qual tem mais resultado em B2B?',
    answer: 'Depende do ICP. LinkedIn funciona melhor para cargos C-level e diretores — quem tem presença ativa na plataforma. Cold email funciona melhor para volume e para perfis que não são tão ativos no LinkedIn (financeiro, operacional). A melhor estratégia combina os dois em cadência multicanal — o mesmo lead recebe abordagem por ambos os canais, o que aumenta o reconhecimento e a taxa de resposta.',
  },
  {
    question: 'Como qualificar um lead na prospecção antes de gastar tempo?',
    answer: 'Use o framework BANT rápido: Budget (tem orçamento ou pode ter?), Authority (é o decisor ou tem acesso a ele?), Need (tem o problema que você resolve?), Timeline (existe urgência ou gatilho de compra?). Você consegue responder 3 das 4 perguntas com pesquisa antes do primeiro contato — LinkedIn, site da empresa, notícias recentes. Se não passa no BANT, não entre na cadência — é desperdício de tempo.',
  },
  {
    question: 'Quantos follow-ups fazer antes de desistir de um lead?',
    answer: 'O número ideal é 6-8 touchpoints distribuídos em 2-3 semanas antes do email de break-up. Dados do Rainmaker Institute mostram que 80% das vendas complexas B2B acontecem entre o 5º e o 12º contato. Desistir no 2º ou 3º follow-up (o que a maioria faz) significa abandonar a maioria dos leads que poderiam converter. O segredo é variar o canal e o ângulo da mensagem a cada touchpoint — não mandar o mesmo email 8 vezes.',
  },
]

/**
 * FAQ data for Técnicas de Fechamento de Vendas blog post
 */
export const fechamentoVendasFAQs: FAQItem[] = [
  {
    question: 'Qual a melhor técnica de fechamento para vendas B2B?',
    answer: 'Não existe uma única "melhor técnica" — depende do momento e do perfil do cliente. Para vendas B2B complexas, o Fechamento por Resumo e a Pergunta de Comprometimento (SPIN) tendem a funcionar melhor porque respeitam o processo de decisão mais longo. Para deals que já estão maduros e o cliente demonstrou sinais claros, o Fechamento Assumido acelera sem forçar.',
  },
  {
    question: 'O que fazer quando o cliente diz "preciso pensar"?',
    answer: '"Preciso pensar" é sempre uma objeção disfarçada — raramente significa que o cliente precisa apenas de tempo. A resposta certa é usar o Fechamento Columbo: "Claro, entendo. Antes de você ir — só para eu entender melhor — o que especificamente você ainda precisa avaliar?" Com a objeção real na mesa (preço, timing, aprovação interna), você pode endereçá-la diretamente em vez de esperar o cliente nunca voltar.',
  },
  {
    question: 'Quantas tentativas de fechamento fazer em uma reunião?',
    answer: 'Em vendas consultivas B2B, tente fechar uma ou duas vezes por reunião — não mais. Múltiplas tentativas na mesma conversa sinalizam desespero e pressionam o cliente negativamente. Se a primeira tentativa gerou hesitação, explore a objeção, trate-a e tente uma vez mais. Se ainda assim não houver avanço, estabeleça o próximo passo claro (próxima reunião com data e pauta definidos) antes de encerrar.',
  },
]

/**
 * FAQ data for Objeções em Vendas blog post
 */
export const objecoesVendasFAQs: FAQItem[] = [
  {
    question: 'Como saber se a objeção é real ou apenas desculpa?',
    answer: 'Use a pergunta de exploração do LAER: "O que especificamente te preocupa nisso?" e depois "Se esse ponto estivesse resolvido, você avançaria?" Se o cliente diz sim à segunda pergunta, a objeção é real e você pode endereçá-la. Se ele cria outra objeção imediatamente, provavelmente há algo mais profundo — falta de confiança, outro decisor, ou ausência de interesse genuíno.',
  },
  {
    question: 'É possível evitar objeções antes que apareçam?',
    answer: 'Sim — as melhores equipes de vendas trabalham a prevenção de objeções durante o discovery e a apresentação. Se você sabe que "preço" será levantado, aborde o ROI antes que o cliente pergunte. Se sabe que "já usamos outra solução" é comum no seu mercado, demonstre o diferencial proativamente. Objeções antecipadas e respondidas no momento certo são muito mais fáceis de superar do que quando surgem depois da proposta.',
  },
  {
    question: 'Quantas objeções um cliente pode levantar antes de comprar?',
    answer: 'Em vendas B2B complexas, é comum um cliente levantar 3 a 6 objeções diferentes ao longo do ciclo de vendas. Cada objeção superada aumenta a confiança e aproxima o fechamento. A pesquisa da Huthwaite International mostra que vendedores que conseguem superar 4 ou mais objeções têm taxa de fechamento 60% maior que os que desistem na segunda ou terceira.',
  },
  {
    question: 'O que fazer quando o cliente objeta após já ter concordado com tudo?',
    answer: 'Objeções de último minuto (após proposta ou na assinatura) geralmente indicam cold feet — arrependimento antecipado de compra. A melhor resposta é reconhecer o momento: "É normal sentir isso antes de uma decisão importante. O que posso fazer para te dar mais confiança?" Depois, ofereça uma garantia, referência de cliente similar ou condição de entrada menor para reduzir o risco percebido.',
  },
]

/**
 * FAQ data for KPIs de Vendas blog post
 */
export const kpisVendasFAQs: FAQItem[] = [
  {
    question: 'Qual é o KPI de vendas mais importante?',
    answer: 'Não existe um único KPI mais importante — depende do estágio do negócio. Para empresas em fase de crescimento acelerado, o New MRR e o CAC são críticos. Para negócios maduros focados em eficiência, win rate e ciclo de vendas. Para gestão do time, Revenue per Rep e conversão por etapa. O segredo é acompanhar KPIs dos 3 grupos (pipeline, performance, financeiro) para ter visão completa — e não se apegar a apenas um número.',
  },
  {
    question: 'Com que frequência revisar os KPIs de vendas?',
    answer: 'KPIs de pipeline (deals ativos, days in stage, alertas) devem ser revistos diariamente — idealmente o gestor olha o dashboard toda manhã. KPIs de performance (taxa de conversão, win rate, ciclo) devem ser analisados semanalmente na reunião de vendas. KPIs financeiros (CAC, LTV, MRR) são revisados mensalmente e trimestralmente para decisões estratégicas.',
  },
  {
    question: 'Como definir benchmarks de KPIs para minha empresa?',
    answer: 'Os benchmarks de mercado são um ponto de partida, mas o benchmark mais relevante é o seu histórico interno. Calcule os seus KPIs dos últimos 6-12 meses e use-os como linha de base. Benchmarks externos variam muito por setor, ticket médio e modelo de vendas — uma agência de marketing tem ciclo de vendas e win rate muito diferentes de um fabricante industrial.',
  },
  {
    question: 'O que fazer quando os KPIs mostram resultado ruim?',
    answer: 'KPI ruim é informação valiosa — ele aponta onde agir. O processo é: (1) Identificar qual KPI está fora do padrão; (2) Analisar a etapa ou comportamento que explica o desvio; (3) Formular hipótese de causa; (4) Testar uma ação corretiva específica; (5) Medir resultado após 2-4 semanas. Nunca tome decisões drásticas com base em uma semana de dados ruim — analise tendências.',
  },
]

/**
 * FAQ data for Erros de CRM blog post
 */
export const errosCrmFAQs: FAQItem[] = [
  {
    question: 'Por que meu time resiste ao uso do CRM?',
    answer: 'A resistência ao CRM quase sempre tem uma das três causas: (1) O sistema é percebido como controle, não como ajuda — o vendedor sente que está sendo vigiado, não apoiado. (2) O CRM cria trabalho extra sem entregar valor perceptível para quem usa — registrar tudo e nunca ver benefício. (3) Falta de treinamento — o vendedor simplesmente não sabe usar bem. A solução é mostrar como o CRM ajuda o próprio vendedor: menos follow-ups perdidos, mais comissão.',
  },
  {
    question: 'Quanto tempo leva para um CRM gerar resultado?',
    answer: 'Com implementação correta (treinamento, pipeline bem estruturado, automações básicas ativas), os primeiros resultados aparecem em 30-60 dias: menos leads perdidos por falta de follow-up, pipeline mais previsível, gestão com mais tempo livre de tarefas operacionais. Resultados financeiros mensuráveis (aumento de taxa de conversão, redução de ciclo de vendas) aparecem em 90-120 dias de uso consistente.',
  },
  {
    question: 'O que fazer quando o CRM atual está completamente bagunçado?',
    answer: 'Se o CRM está com dados inconsistentes, etapas embaralhadas e time sem adesão, a melhor abordagem é um "reset" controlado: (1) Exporte os contatos e deals ativos; (2) Archive tudo que tem mais de 90 dias sem movimentação; (3) Reconfigure o pipeline do zero com as etapas corretas; (4) Faça um treinamento de reimplantação com o time; (5) Recomece com disciplina de atualização diária. É mais eficaz do que tentar "arrumar" um sistema em caos.',
  },
]
