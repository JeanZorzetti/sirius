/**
 * AGI Sirius - Skills Module
 * 
 * Sales-focused skills adapted from AGI Sirius Python version.
 * Each skill is a pure function that can be executed independently.
 */

// ============================================
// TYPES
// ============================================

export interface BANTQualification {
    score: number;
    qualificado: boolean;
    criterios: {
        budget: string;
        authority: string;
        need: string;
        timeline: string;
    };
}

export interface FunnelAnalysis {
    conversoes: {
        lead_to_mql: number;
        mql_to_sql: number;
        sql_to_sale: number;
        lead_to_sale: number;
    };
    gargalos: string[];
    saude_funil: 'Saudável' | 'Precisa atenção';
}

export interface SPINQuestions {
    situation: string[];
    problem: string[];
    implication: string[];
    need_payoff: string[];
}

export interface ObjectionResponses {
    feel_felt_found: string;
    redefinicao: string;
    divisao: string;
    comparacao: string;
    isolamento: string;
}

export interface SalesMetrics {
    ltv_cac_ratio: number;
    ltv_cac_saude: 'Saudável' | 'Atenção';
    payback_months: number;
    arr: number;
    churn_anual: number;
    recomendacoes: string[];
}

// ============================================
// SKILL: BANT Qualification
// ============================================

export function qualificarBANT(
    empresa: string | null,
    orcamento: number,
    decisor: string,
    prazo: number
): BANTQualification {
    let score = 0;
    const criterios: BANTQualification['criterios'] = {
        budget: 'Indefinido',
        authority: 'Baixa',
        need: 'Não identificada',
        timeline: 'Longo prazo',
    };

    // Budget
    if (orcamento && orcamento > 0) {
        score += 25;
        criterios.budget = 'OK';
    }

    // Authority
    const highAuthority = ['CEO', 'Diretor', 'Gerente', 'VP', 'C-Level', 'CTO', 'CFO', 'CMO', 'COO'];
    if (highAuthority.some(role => decisor?.toUpperCase().includes(role.toUpperCase()))) {
        score += 25;
        criterios.authority = 'Alta';
    }

    // Need
    if (empresa) {
        score += 25;
        criterios.need = 'Identificada';
    }

    // Timeline
    if (prazo && prazo <= 90) {
        score += 25;
        criterios.timeline = `${prazo} dias`;
    }

    return {
        score,
        qualificado: score >= 75,
        criterios,
    };
}

// ============================================
// SKILL: Funnel Analysis
// ============================================

export function analisarFunil(
    leads: number,
    mqls: number,
    sqls: number,
    vendas: number
): FunnelAnalysis {
    const conversoes = {
        lead_to_mql: leads > 0 ? (mqls / leads) * 100 : 0,
        mql_to_sql: mqls > 0 ? (sqls / mqls) * 100 : 0,
        sql_to_sale: sqls > 0 ? (vendas / sqls) * 100 : 0,
        lead_to_sale: leads > 0 ? (vendas / leads) * 100 : 0,
    };

    const gargalos: string[] = [];

    if (conversoes.lead_to_mql < 20) {
        gargalos.push('Qualificação inicial fraca');
    }
    if (conversoes.mql_to_sql < 30) {
        gargalos.push('Nurturing insuficiente');
    }
    if (conversoes.sql_to_sale < 25) {
        gargalos.push('Problema no fechamento');
    }

    return {
        conversoes,
        gargalos,
        saude_funil: gargalos.length === 0 ? 'Saudável' : 'Precisa atenção',
    };
}

// ============================================
// SKILL: SPIN Questions Generator
// ============================================

export function gerarPerguntasSPIN(
    industria: string,
    problema?: string
): SPINQuestions {
    const spin: SPINQuestions = {
        situation: [
            `Como funciona atualmente o processo de ${industria} na sua empresa?`,
            'Quantas pessoas estão envolvidas?',
            'Quais ferramentas vocês usam hoje?',
        ],
        problem: [
            `Quais são os maiores desafios em ${industria}?`,
            'Isso impacta os resultados?',
            'Com que frequência isso acontece?',
        ],
        implication: [
            'Qual o impacto no negócio se não resolver?',
            'Quanto isso custa em produtividade?',
            'Como afeta o atingimento de metas?',
        ],
        need_payoff: [
            'Como seria se vocês resolvessem isso?',
            'Quanto economizariam?',
            'Que diferença faria nos resultados?',
        ],
    };

    if (problema) {
        spin.problem.unshift(`Vocês enfrentam problemas com ${problema}?`);
    }

    return spin;
}

// ============================================
// SKILL: Price Objection Handling
// ============================================

export function quebrarObjecaoPreco(
    valorSolucao: number,
    roiMensal: number
): ObjectionResponses {
    const roiAnual = roiMensal * 12;
    const roiPercentual = (roiAnual / valorSolucao) * 100;
    const valorMensal = valorSolucao / 12;

    return {
        feel_felt_found: `Entendo como você se sente. Outros clientes também sentiram o mesmo, mas descobriram que o ROI de R$ ${roiMensal.toLocaleString('pt-BR')}/mês compensa em poucos meses.`,

        redefinicao: `Mais que um custo, veja como investimento. Se R$ ${valorSolucao.toLocaleString('pt-BR')} gera R$ ${roiAnual.toLocaleString('pt-BR')}/ano, o ROI é ${roiPercentual.toFixed(0)}%.`,

        divisao: `R$ ${valorSolucao.toLocaleString('pt-BR')} são R$ ${valorMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês. Menos que um cafezinho por dia.`,

        comparacao: `Comparado ao custo de NÃO resolver, R$ ${valorSolucao.toLocaleString('pt-BR')} é um investimento mínimo.`,

        isolamento: 'Além do preço, existe outra preocupação? [Se não] Ótimo, então se ajustarmos o valor, podemos seguir?',
    };
}

// ============================================
// SKILL: Sales Metrics Calculator
// ============================================

export function calcularMetricas(
    vendas: number,
    cac: number,
    ltv: number,
    churnMensal: number
): SalesMetrics {
    const ltv_cac_ratio = cac > 0 ? ltv / cac : 0;
    const payback_months = ltv > 0 ? cac / (ltv / 12) : 0;
    const arr = vendas * ltv;
    const churn_anual = (1 - Math.pow(1 - churnMensal, 12)) * 100;

    const recomendacoes: string[] = [];

    if (ltv_cac_ratio < 3) {
        recomendacoes.push('Reduzir CAC ou aumentar LTV');
    }
    if (payback_months > 12) {
        recomendacoes.push('Payback longo, revisar estratégia');
    }
    if (churn_anual > 15) {
        recomendacoes.push('Churn alto, focar retenção');
    }

    return {
        ltv_cac_ratio,
        ltv_cac_saude: ltv_cac_ratio >= 3 ? 'Saudável' : 'Atenção',
        payback_months,
        arr,
        churn_anual,
        recomendacoes,
    };
}

// ============================================
// SKILL REGISTRY
// ============================================

export interface SkillDefinition {
    name: string;
    description: string;
    execute: (...args: any[]) => any;
    tags: string[];
}

export const SALES_SKILLS: Record<string, SkillDefinition> = {
    qualificacao_bant: {
        name: 'qualificacao_bant',
        description: 'Qualificação BANT completa com scoring',
        execute: qualificarBANT,
        tags: ['vendas', 'qualificacao', 'bant'],
    },

    analise_funil: {
        name: 'analise_funil',
        description: 'Análise completa de funil de vendas',
        execute: analisarFunil,
        tags: ['vendas', 'funil', 'metricas'],
    },

    perguntas_spin: {
        name: 'perguntas_spin',
        description: 'Gerador de perguntas SPIN Selling',
        execute: gerarPerguntasSPIN,
        tags: ['vendas', 'spin', 'discovery'],
    },

    quebra_objecao_preco: {
        name: 'quebra_objecao_preco',
        description: 'Técnicas para quebra de objeção de preço',
        execute: quebrarObjecaoPreco,
        tags: ['vendas', 'objecoes', 'preco'],
    },

    calcular_metricas_vendas: {
        name: 'calcular_metricas_vendas',
        description: 'Cálculo de métricas essenciais (LTV/CAC, ARR, Churn)',
        execute: calcularMetricas,
        tags: ['vendas', 'metricas', 'analytics'],
    },
};

/**
 * Execute a skill by name with provided arguments
 */
export function executeSkill(skillName: string, ...args: any[]): any {
    const skill = SALES_SKILLS[skillName];
    if (!skill) {
        throw new Error(`Skill '${skillName}' not found`);
    }

    try {
        return skill.execute(...args);
    } catch (error) {
        throw new Error(
            `Failed to execute skill '${skillName}': ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Get list of all available skills
 */
export function getAvailableSkills(): SkillDefinition[] {
    return Object.values(SALES_SKILLS);
}

/**
 * Search skills by tag
 */
export function findSkillsByTag(tag: string): SkillDefinition[] {
    return Object.values(SALES_SKILLS).filter(skill =>
        skill.tags.includes(tag)
    );
}
