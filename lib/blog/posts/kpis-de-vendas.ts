import { BlogPost } from '../../blog-types'

export const post: BlogPost = {
  slug: 'kpis-de-vendas',
  title: '12 KPIs de Vendas que Todo Gestor Precisa Acompanhar em 2026',
  excerpt: 'Conheça os 12 KPIs de vendas mais importantes, como calculá-los, quais benchmarks esperar e como monitorá-los em tempo real com um CRM.',
  date: '2026-02-28',
  lastModified: '2026-02-28',
  category: 'Gestão',
  image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop&auto=format&q=80',
  author: 'Equipe Sirius CRM',
  relatedSlugs: ['como-organizar-pipeline-vendas', 'custo-oculto-inacao-crm', 'crm-ia-inteligencia-artificial-2026'],
  content: `
      <p>
        "O que não é medido não é gerenciado." A frase de Peter Drucker continua sendo a realidade da maioria das operações de vendas em 2026: gestores tomam decisões no feeling, vendedores não sabem onde estão em relação à meta, e o pipeline vira uma caixinha preta de onde às vezes saem resultados.
      </p>

      <p>
        Neste guia, você vai aprender os <strong>12 KPIs de vendas essenciais</strong> — como calculá-los, quais benchmarks esperar por mercado, o que fazer quando cada um está ruim, e como automatizar o acompanhamento via CRM para que os números trabalhem para você, não o contrário.
      </p>

      <div class="not-prose" style="background: #1e293b; padding: 1.5rem; border-radius: 0.75rem; margin: 2rem 0;">
        <p style="margin: 0 0 0.75rem; font-weight: 700; font-size: 1.05rem; color: #38bdf8;">⚡ TL;DR — Resposta Rápida</p>
        <ul style="margin: 0; padding-left: 1.25rem; line-height: 2; color: #ffffff;">
          <li>Os 12 KPIs estão em 3 grupos: <strong>Pipeline</strong> (o que está entrando), <strong>Performance</strong> (o que está convertendo) e <strong>Financeiro</strong> (o que está gerando)</li>
          <li>KPIs de pipeline são <strong>preditivos</strong> — olham para o futuro. KPIs financeiros são <strong>lagging</strong> — confirmam o passado</li>
          <li>Um CRM bem configurado gera esses 12 KPIs automaticamente — sem planilha manual</li>
          <li>Benchmark geral: taxa de conversão lead→cliente de <strong>2-5%</strong> é saudável para B2B (varia muito por ticket e ciclo)</li>
          <li>O KPI mais ignorado — e mais importante — é a <strong>velocidade do pipeline</strong> (tempo médio em cada etapa)</li>
        </ul>
      </div>

      <h2>A Diferença entre Métricas, KPIs e OKRs</h2>

      <div class="callout-tip">
        <p><strong>💡 Entenda os 3 níveis de acompanhamento</strong></p>
        <p><strong>Métrica:</strong> Qualquer dado mensurável — número de ligações feitas, emails enviados, reuniões realizadas. Métricas são atividade.</p>
        <p><strong>KPI (Key Performance Indicator):</strong> Métricas que indicam progresso em direção a um resultado de negócio. Taxa de conversão, ciclo de vendas, CAC. KPIs são eficácia.</p>
        <p><strong>OKR (Objectives and Key Results):</strong> Meta qualitativa (Objetivo) + KPIs específicos que provam que você chegou lá (Key Results). OKRs são direção estratégica.</p>
        <p>Resumo prático: <strong>métricas explicam o que aconteceu, KPIs mostram se está no caminho certo, OKRs definem aonde você quer ir.</strong></p>
      </div>

      <h2>Grupo 1 — KPIs de Pipeline (Olhar para o Futuro)</h2>

      <p>KPIs de pipeline são preditivos — eles avisam com semanas de antecedência se o mês vai ser bom ou ruim.</p>

      <h3>KPI 1: Taxa de Conversão por Etapa</h3>

      <p>
        <strong>O que mede:</strong> Percentual de deals que avançam de uma etapa para a próxima no pipeline.
      </p>

      <p>
        <strong>Fórmula:</strong> (Deals que avançaram para próxima etapa ÷ Total de deals na etapa) × 100
      </p>

      <p>
        <strong>Benchmark B2B:</strong> Qualificação→Proposta: 30-50% | Proposta→Negociação: 40-60% | Negociação→Fechamento: 50-70%
      </p>

      <p>
        <strong>O que fazer quando está ruim:</strong> Identifique a etapa com maior queda. Se a conversão cai em Qualificação, o problema é ICP ou abordagem. Se cai em Proposta, o problema é precificação ou apresentação de valor.
      </p>

      <h3>KPI 2: Velocidade do Pipeline (Days in Stage)</h3>

      <p>
        <strong>O que mede:</strong> Tempo médio que um deal permanece em cada etapa antes de avançar ou ser perdido.
      </p>

      <p>
        <strong>Fórmula:</strong> Soma dos dias em cada etapa ÷ Número de deals nessa etapa
      </p>

      <p>
        <strong>Benchmark B2B:</strong> Deals sem movimentação por mais de 2x o tempo médio histórico estão em risco — alerta imediato necessário.
      </p>

      <p>
        <strong>O que fazer quando está ruim:</strong> Deals parados geralmente indicam falta de follow-up (configure alertas no CRM) ou objeção não endereçada (ligue e descubra o que travou).
      </p>

      <h3>KPI 3: Valor Total do Pipeline</h3>

      <p>
        <strong>O que mede:</strong> Soma do valor potencial de todos os deals ativos ponderado pela probabilidade de fechamento.
      </p>

      <p>
        <strong>Fórmula:</strong> Σ (Valor do deal × % de probabilidade de fechamento)
      </p>

      <p>
        <strong>Benchmark:</strong> Para bater a meta, o pipeline ponderado deve ser pelo menos <strong>3-4x a meta mensal</strong> — porque nem todo deal vai fechar.
      </p>

      <p>
        <strong>O que fazer quando está ruim:</strong> Pipeline fraco = prospecção insuficiente. O problema não está no fechamento — está na entrada de novos leads.
      </p>

      <h3>KPI 4: Número de Deals Ativos por Vendedor</h3>

      <p>
        <strong>O que mede:</strong> Quantos deals simultâneos cada vendedor está gerenciando.
      </p>

      <p>
        <strong>Benchmark:</strong> Para vendas B2B complexas: 15-25 deals ativos por vendedor é saudável. Acima de 40, a atenção se dilui e a taxa de conversão cai.
      </p>

      <p>
        <strong>O que fazer quando está ruim:</strong> Se muito baixo — o vendedor não está prospectando. Se muito alto — ele não está tendo tempo de nutrir deals adequadamente. Defina o número ideal para o seu ciclo de vendas.
      </p>

      <h2>Grupo 2 — KPIs de Performance (Eficiência da Equipe)</h2>

      <h3>KPI 5: Taxa de Conversão Geral (Lead → Cliente)</h3>

      <p>
        <strong>O que mede:</strong> Percentual de leads que se tornam clientes pagantes ao longo de todo o funil.
      </p>

      <p>
        <strong>Fórmula:</strong> (Novos clientes conquistados ÷ Total de leads gerados no período) × 100
      </p>

      <p>
        <strong>Benchmark B2B:</strong> 2-5% é considerado saudável. SaaS low-touch: pode ser 5-10%. Enterprise: 0,5-2%.
      </p>

      <p>
        <strong>O que fazer quando está ruim:</strong> Identifique em qual etapa ocorre o maior vazamento. Cada etapa com problema tem causa e solução diferentes.
      </p>

      <h3>KPI 6: Ticket Médio</h3>

      <p>
        <strong>O que mede:</strong> Valor médio de cada contrato fechado.
      </p>

      <p>
        <strong>Fórmula:</strong> Receita total ÷ Número de clientes conquistados no período
      </p>

      <p>
        <strong>O que fazer quando está ruim:</strong> Ticket médio caindo indica que o time está fechando deals menores para bater volume. Revise a estratégia de qualificação e treine upsell desde o início da conversa.
      </p>

      <h3>KPI 7: Ciclo de Vendas Médio</h3>

      <p>
        <strong>O que mede:</strong> Tempo médio entre o primeiro contato com um lead até o fechamento.
      </p>

      <p>
        <strong>Fórmula:</strong> Σ (Dias do primeiro contato ao fechamento) ÷ Número de deals fechados
      </p>

      <p>
        <strong>Benchmark B2B:</strong> Ticket R$ 1-5k: 14-30 dias | Ticket R$ 5-50k: 30-90 dias | Enterprise: 90-180+ dias
      </p>

      <p>
        <strong>O que fazer quando está ruim:</strong> Ciclo longo demais indica deals travados (falta de follow-up ou múltiplos decisores sem gestão). Mapeie onde está o gargalo etapa por etapa.
      </p>

      <h3>KPI 8: Taxa de Win/Loss</h3>

      <p>
        <strong>O que mede:</strong> Proporção de deals ganhos versus perdidos — e o motivo de cada perda.
      </p>

      <p>
        <strong>Fórmula:</strong> Deals ganhos ÷ (Deals ganhos + Deals perdidos) × 100
      </p>

      <p>
        <strong>Benchmark:</strong> 20-30% de win rate é saudável para B2B complexo com boa qualificação. Abaixo de 15% indica problema de qualificação ou posicionamento.
      </p>

      <p>
        <strong>O que fazer quando está ruim:</strong> Analise os motivos de perda registrados no CRM. Os 3 mais comuns — preço, concorrente, sem budget — têm soluções diferentes.
      </p>

      <h2>Grupo 3 — KPIs Financeiros (Resultado Real)</h2>

      <h3>KPI 9: CAC (Custo de Aquisição de Clientes)</h3>

      <p>
        <strong>O que mede:</strong> Quanto custa, em média, conquistar um novo cliente.
      </p>

      <p>
        <strong>Fórmula:</strong> (Total de gastos com vendas + marketing no período) ÷ Número de novos clientes no período
      </p>

      <p>
        <strong>Benchmark:</strong> CAC saudável é quando LTV ÷ CAC ≥ 3. Se você gasta R$ 1.000 para adquirir um cliente, ele precisa gerar ao menos R$ 3.000 em receita total.
      </p>

      <p>
        <strong>O que fazer quando está ruim:</strong> CAC alto geralmente vem de processo de vendas longo, leads ruins ou marketing ineficiente. Otimize por canal — descubra de onde vêm os clientes com menor CAC e invista mais lá.
      </p>

      <h3>KPI 10: LTV (Lifetime Value)</h3>

      <p>
        <strong>O que mede:</strong> Receita total que um cliente gera durante todo o relacionamento com sua empresa.
      </p>

      <p>
        <strong>Fórmula:</strong> Ticket médio × Número médio de compras × Tempo médio de retenção (em anos)
      </p>

      <p>
        <strong>Benchmark:</strong> LTV:CAC de 3:1 é mínimo saudável. 5:1 é ótimo. Abaixo de 2:1, o modelo de negócio está em risco.
      </p>

      <p>
        <strong>O que fazer quando está ruim:</strong> LTV baixo = churn alto ou ausência de upsell. Foque em onboarding de qualidade, uso do produto e gestão de sucesso do cliente.
      </p>

      <h3>KPI 11: MRR/ARR (para negócios de recorrência)</h3>

      <p>
        <strong>O que mede:</strong> Monthly Recurring Revenue (receita recorrente mensal) ou Annual Recurring Revenue.
      </p>

      <p>
        <strong>Fórmula MRR:</strong> Σ (Valor mensal de todos os contratos ativos)
      </p>

      <p>
        <strong>Componentes do MRR:</strong> New MRR (novos clientes) + Expansion MRR (upsell) — Churned MRR (cancelamentos) — Contraction MRR (downgrades)
      </p>

      <p>
        <strong>O que fazer quando está ruim:</strong> MRR estagnado com baixo New MRR indica problema de aquisição. MRR caindo com alto Churned MRR indica problema de retenção e produto.
      </p>

      <h3>KPI 12: Revenue per Rep (Receita por Vendedor)</h3>

      <p>
        <strong>O que mede:</strong> Quanto cada vendedor gera em receita — permite comparar eficiência individual e identificar melhores práticas.
      </p>

      <p>
        <strong>Fórmula:</strong> Receita total gerada ÷ Número de vendedores no período
      </p>

      <p>
        <strong>Benchmark B2B Brasil:</strong> Varia muito por setor e ticket. Use como comparativo interno — identifique seus top performers e entenda o que eles fazem diferente.
      </p>

      <p>
        <strong>O que fazer quando está ruim:</strong> Análise de quais vendedores têm maior Revenue per Rep e quais comportamentos explicam a diferença. Depois, treine os demais com base nos padrões dos melhores.
      </p>

      <h2>Como o Dashboard do Sirius CRM Automatiza Todos Esses KPIs</h2>

      <p>
        Calcular esses 12 KPIs manualmente — extraindo dados do pipeline, atualizando planilhas, fazendo as contas — leva horas por semana e ainda está sujeito a erros humanos. Um gestor que passa 4 horas por semana construindo relatórios está deixando de gerenciar.
      </p>

      <p>
        O Sirius CRM calcula e exibe todos esses KPIs automaticamente, em tempo real, no dashboard de gestão:
      </p>

      <ul style="line-height: 2; padding-left: 1.5rem;">
        <li>Pipeline value ponderado por probabilidade — atualizado em tempo real conforme os deals evoluem</li>
        <li>Taxa de conversão por etapa — com drill-down por vendedor e por período</li>
        <li>Days in stage com alertas automáticos quando um deal está parado além do normal</li>
        <li>Win/loss rate com análise dos motivos de perda mais frequentes</li>
        <li>CAC e LTV calculados automaticamente quando conectado à plataforma financeira</li>
      </ul>

      <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 2rem; border-radius: 1rem; margin: 2.5rem 0; text-align: center;">
        <p style="color: white; font-size: 1.25rem; font-weight: 700; margin: 0 0 0.5rem;">Todos os seus KPIs em um único dashboard</p>
        <p style="color: #bfdbfe; margin: 0 0 1.25rem;">Pare de construir relatórios manualmente. O Sirius CRM entrega seus KPIs em tempo real, gratuitamente.</p>
        <a href="/cadastro" style="display: inline-block; background: white; color: #2563eb; padding: 0.75rem 2rem; border-radius: 0.5rem; font-weight: 700; text-decoration: none;">Começar Grátis →</a>
      </div>

      <h2>Perguntas Frequentes sobre KPIs de Vendas</h2>

      <details style="border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem; margin-bottom: 0.75rem;">
        <summary style="font-weight: 600; cursor: pointer; color: #1e293b; list-style: revert;">Qual é o KPI de vendas mais importante?</summary>
        <p style="margin: 0.75rem 0 0; color: #4b5563;">Não existe um único KPI mais importante — depende do estágio do negócio. Para empresas em fase de crescimento acelerado, o New MRR e o CAC são críticos. Para negócios maduros focados em eficiência, win rate e ciclo de vendas. Para gestão do time, Revenue per Rep e conversão por etapa. O segredo é acompanhar KPIs dos 3 grupos (pipeline, performance, financeiro) para ter visão completa — e não se apegar a apenas um número.</p>
      </details>

      <details style="border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem; margin-bottom: 0.75rem;">
        <summary style="font-weight: 600; cursor: pointer; color: #1e293b; list-style: revert;">Com que frequência revisar os KPIs de vendas?</summary>
        <p style="margin: 0.75rem 0 0; color: #4b5563;">KPIs de pipeline (deals ativos, days in stage, alertas) devem ser revistos diariamente — idealmente o gestor olha o dashboard toda manhã. KPIs de performance (taxa de conversão, win rate, ciclo) devem ser analisados semanalmente na reunião de vendas. KPIs financeiros (CAC, LTV, MRR) são revisados mensalmente e trimestralmente para decisões estratégicas.</p>
      </details>

      <details style="border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem; margin-bottom: 0.75rem;">
        <summary style="font-weight: 600; cursor: pointer; color: #1e293b; list-style: revert;">Como definir benchmarks de KPIs para minha empresa?</summary>
        <p style="margin: 0.75rem 0 0; color: #4b5563;">Os benchmarks de mercado (como os apresentados neste artigo) são um ponto de partida, mas o benchmark mais relevante é o seu histórico interno. Calcule os seus KPIs dos últimos 6-12 meses e use-os como linha de base. Benchmarks externos variam muito por setor, ticket médio e modelo de vendas — uma agência de marketing tem ciclo de vendas e win rate muito diferentes de um fabricante industrial.</p>
      </details>

      <details style="border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem; margin-bottom: 2rem;">
        <summary style="font-weight: 600; cursor: pointer; color: #1e293b; list-style: revert;">O que fazer quando os KPIs mostram resultado ruim?</summary>
        <p style="margin: 0.75rem 0 0; color: #4b5563;">KPI ruim é informação valiosa — ele aponta onde agir. O processo é: (1) Identificar qual KPI está fora do padrão; (2) Analisar a etapa ou comportamento que explica o desvio; (3) Formular hipótese de causa (ex: win rate caiu porque aumentou a concorrência, ou porque o time não está trabalhando objeções?); (4) Testar uma ação corretiva específica; (5) Medir resultado após 2-4 semanas. Nunca tome decisões drásticas com base em uma semana de dados ruim — analise tendências.</p>
      </details>

      <h2>Conclusão</h2>

      <p>
        Os 12 KPIs apresentados neste guia formam o painel de controle completo de uma operação de vendas profissional. A boa notícia: você não precisa calculá-los manualmente — um CRM bem configurado faz isso automaticamente, deixando você livre para analisar e agir.
      </p>

      <p>
        Comece pelo básico: taxa de conversão por etapa e days in stage. São os dois KPIs que mais rapidamente revelam onde está o gargalo da sua operação. Com esses dois dominados, avance para os demais gradualmente.
      </p>

      <hr style="margin: 3rem 0; border: none; border-top: 1px solid #e5e7eb;" />
      <strong>Última Atualização:</strong> 28 de Fevereiro de 2026<br/>
      <strong>Autor:</strong> Equipe Sirius CRM<br/>
      <strong>Tempo de Leitura:</strong> 9 minutos
    `
}
