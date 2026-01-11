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
