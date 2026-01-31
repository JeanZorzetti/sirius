/**
 * Generative UI - Component Registry
 *
 * Central registry of all UI components available to the AI.
 * The AI consults this registry to decide which component to render
 * and how to validate its props.
 */

import type { ComponentRegistry, ComponentDefinition, ValidationResult } from './types'
import {
  ROICalculatorPropsSchema,
  DealFormGeneratorPropsSchema,
  PricingComparisonPropsSchema,
  ScriptPreviewPropsSchema,
  DemoSchedulerPropsSchema,
  QualificationDashboardPropsSchema,
  CompetitorMatrixPropsSchema,
  OnboardingTimelinePropsSchema,
  InsightCardPropsSchema,
  EmailPreviewPropsSchema,
} from './schemas'

// Lazy imports for code splitting (components will be implemented in Phase 2)
// For now, we'll use placeholder components
const PlaceholderComponent = ({ name }: { name: string }) => {
  return (
    <div className="p-6 border border-dashed border-gray-400 rounded-lg bg-gray-50">
      <p className="text-gray-600">
        Component <strong>{name}</strong> will be implemented in Phase 2
      </p>
    </div>
  )
}

/**
 * Complete Sales UI Components Registry
 *
 * Each component includes:
 * - Metadata for AI decision-making
 * - Props validation schema
 * - React component reference
 * - Skeleton configuration
 * - Usage examples
 */
export const SALES_UI_COMPONENTS: ComponentRegistry = {
  ROICalculator: {
    name: 'ROICalculator',
    description: 'Calculadora interativa de ROI para demonstrar valor do Sirius CRM',
    when_to_use: [
      'usuário questiona custo ou investimento',
      'lead score > 50 (interesse em pricing)',
      'contexto de comparação com concorrentes',
      'fase de "Implication" no SPIN',
      'necessidade de quantificar economia/valor',
    ],
    required_context: ['currentCost', 'estimatedSavings'],
    optional_context: ['industry', 'teamSize', 'dealValue'],
    props_schema: ROICalculatorPropsSchema,
    render: (props) => PlaceholderComponent({ name: 'ROICalculator', ...props }),
    skeleton: { height: 400, variant: 'calculator' },
    triggers_event: 'roi_calculated',
    example: {
      scenario: 'Lead menciona gastar R$15k/mês em CRM atual + processos manuais',
      invocation: {
        scenario: {
          currentCost: 15000,
          withSirius: 8000,
          monthlySavings: 7000,
          annualROI: 84000,
          paybackPeriod: 2,
        },
        industry: 'orthodontics',
        comparisonMode: true,
      },
    },
  },

  DealFormGenerator: {
    name: 'DealFormGenerator',
    description: 'Formulário de criação de deal com dados pré-preenchidos extraídos da conversa',
    when_to_use: [
      'usuário está qualificado (BANT completo)',
      'contexto de criar oportunidade',
      'após demo bem-sucedida',
      'lead score > 70',
      'usuário pergunta "como começar" ou "como contratar"',
    ],
    required_context: [],
    optional_context: ['contactName', 'contactEmail', 'dealValue', 'closeDate', 'conversationSummary'],
    props_schema: DealFormGeneratorPropsSchema,
    render: (props) => PlaceholderComponent({ name: 'DealFormGenerator', ...props }),
    skeleton: { height: 500, variant: 'form' },
    triggers_event: 'deal_created',
    example: {
      scenario: 'Lead qualificado após demo, pronto para criar oportunidade',
      invocation: {
        prefill: {
          title: 'Implementação Sirius CRM - Clínica Excellence',
          value: 12000,
          closeDate: '2026-03-15',
        },
        suggestedTags: ['ortodontia', 'high-value', 'demo-realizada'],
        aiNotes: 'Lead qualificado. BANT completo. Pain points: processos manuais.',
      },
    },
  },

  PricingComparison: {
    name: 'PricingComparison',
    description: 'Tabela comparativa de planos FREE vs PRO com highlighting contextual',
    when_to_use: [
      'usuário pergunta sobre preços ou planos',
      'fase de "Need-Payoff" no SPIN',
      'objeção de custo',
      'comparação com concorrentes',
      'dúvida sobre diferenças entre planos',
    ],
    required_context: [],
    optional_context: ['userPlan', 'annualSavings', 'focusedFeatures'],
    props_schema: PricingComparisonPropsSchema,
    render: (props) => PlaceholderComponent({ name: 'PricingComparison', ...props }),
    skeleton: { height: 600, variant: 'table' },
    example: {
      scenario: 'Lead pergunta sobre diferença entre planos FREE e PRO',
      invocation: {
        highlighted: 'pro',
        emphasize_features: ['api_access', 'unlimited_contacts', 'agi_assistant'],
        show_roi_badge: true,
        annual_savings: 84000,
      },
    },
  },

  ScriptPreview: {
    name: 'ScriptPreview',
    description: 'Preview de script de vendas gerado com opções de edição e cópia',
    when_to_use: [
      'após gerar script via /api/agi/generate-script',
      'usuário solicita ajuda com abordagem de vendas',
      'contexto de preparação de prospecção',
      'cold call ou cold email scenario',
    ],
    required_context: ['scriptType', 'scriptContent'],
    optional_context: ['targetRole', 'painPoints', 'valuePropositions'],
    props_schema: ScriptPreviewPropsSchema,
    render: (props) => PlaceholderComponent({ name: 'ScriptPreview', ...props }),
    skeleton: { height: 350, variant: 'text' },
    triggers_event: 'script_copied',
    example: {
      scenario: 'Usuário pediu script de cold call para CEO de clínica odontológica',
      invocation: {
        scriptType: 'cold_call',
        content: 'Olá [Nome], aqui é da Sirius CRM...',
        metadata: {
          targetRole: 'CEO de clínica odontológica',
          painPoints: ['processos manuais', 'falta de visibilidade'],
          valueProps: ['automação', 'AI assistant', 'ROI rápido'],
        },
        editable: true,
        showCopyButton: true,
      },
    },
  },

  DemoScheduler: {
    name: 'DemoScheduler',
    description: 'Agendador de demos via Calendly com criação automática de deal',
    when_to_use: [
      'lead score > 80',
      'BANT completo',
      'usuário expressa interesse em ver demo',
      'fase final de SPIN (Need-Payoff)',
      'usuário pergunta "como funciona na prática"',
    ],
    required_context: [],
    optional_context: ['contactName', 'contactEmail', 'company', 'leadScore'],
    props_schema: DemoSchedulerPropsSchema,
    render: (props) => PlaceholderComponent({ name: 'DemoScheduler', ...props }),
    skeleton: { height: 700, variant: 'iframe' },
    triggers_event: 'demo_scheduled',
    example: {
      scenario: 'Lead altamente qualificado quer agendar demo',
      invocation: {
        eventType: 'demo_60min',
        prefill: {
          name: 'Dr. João Silva',
          email: 'joao@clinica.com',
          company: 'Clínica Excellence',
        },
        autoTriggerCRM: true,
      },
    },
  },

  QualificationDashboard: {
    name: 'QualificationDashboard',
    description: 'Dashboard visual de score BANT/MEDDIC com recomendações',
    when_to_use: [
      'após diagnóstico completo',
      'usuário questiona fit do produto ("Sirius é pra mim?")',
      'fase de "Problem" no SPIN',
      'após completar qualification questions',
    ],
    required_context: ['bantScores', 'overallScore'],
    optional_context: ['industryBenchmark', 'dealSize'],
    props_schema: QualificationDashboardPropsSchema,
    render: (props) => PlaceholderComponent({ name: 'QualificationDashboard', ...props }),
    skeleton: { height: 450, variant: 'dashboard' },
    example: {
      scenario: 'Lead completou diagnóstico e AI analisou fit',
      invocation: {
        scores: {
          budget: 85,
          authority: 100,
          need: 90,
          timeline: 70,
        },
        overall: 86,
        recommendations: [
          'Você tem budget e autoridade para decisão ✓',
          'Necessidade clara identificada ✓',
        ],
        nextSteps: ['Agendar demo completa', 'Validar integrações'],
      },
    },
  },

  CompetitorMatrix: {
    name: 'CompetitorMatrix',
    description: 'Matriz comparativa Sirius vs Concorrentes (Pipedrive, HubSpot, etc.)',
    when_to_use: [
      'usuário menciona concorrente específico',
      'fase de consideração/avaliação',
      'objeção de "preciso avaliar outras opções"',
      'pergunta sobre diferenciais',
    ],
    required_context: ['competitors'],
    optional_context: ['focusFeatures', 'userPainPoints'],
    props_schema: CompetitorMatrixPropsSchema,
    render: (props) => PlaceholderComponent({ name: 'CompetitorMatrix', ...props }),
    skeleton: { height: 500, variant: 'table' },
    example: {
      scenario: 'Lead está avaliando Pipedrive e quer comparar',
      invocation: {
        competitors: ['pipedrive', 'hubspot'],
        focusFeatures: ['ai_assistant', 'whatsapp_integration', 'brazilian_payments'],
        showPricing: true,
      },
    },
  },

  OnboardingTimeline: {
    name: 'OnboardingTimeline',
    description: 'Timeline visual de implementação do Sirius CRM',
    when_to_use: [
      'usuário pergunta "quanto tempo leva para implementar?"',
      'objeção de complexidade de setup',
      'após lead qualificado (score > 70)',
      'fase de "Need-Payoff" (mostrar facilidade)',
    ],
    required_context: ['plan'],
    optional_context: ['teamSize', 'hasIntegrations', 'industry'],
    props_schema: OnboardingTimelinePropsSchema,
    render: (props) => PlaceholderComponent({ name: 'OnboardingTimeline', ...props }),
    skeleton: { height: 400, variant: 'timeline' },
    example: {
      scenario: 'Lead preocupado com tempo de implementação',
      invocation: {
        plan: 'pro',
        teamSize: 'small',
        hasIntegrations: true,
        estimatedDays: 14,
      },
    },
  },

  InsightCard: {
    name: 'InsightCard',
    description: 'Card de insight/recomendação do AI com ações rápidas',
    when_to_use: [
      'após análise de deal',
      'sugestões de próximos passos',
      'alertas de oportunidades ou riscos',
      'recomendações contextuais',
    ],
    required_context: ['insightType', 'title', 'description'],
    optional_context: ['actions', 'dealId'],
    props_schema: InsightCardPropsSchema,
    render: (props) => PlaceholderComponent({ name: 'InsightCard', ...props }),
    skeleton: { height: 200, variant: 'card' },
    example: {
      scenario: 'AI identifica oportunidade de upsell',
      invocation: {
        type: 'opportunity',
        title: 'Oportunidade de Upsell Detectada',
        description: 'Cliente usa 95% do limite de contatos do plano FREE.',
        confidence: 0.87,
        actions: [
          {
            label: 'Sugerir upgrade',
            action: 'send_email',
            params: { template: 'upgrade_nudge' },
          },
        ],
      },
    },
  },

  EmailPreview: {
    name: 'EmailPreview',
    description: 'Preview de email de automação com editor inline',
    when_to_use: [
      'configuração de automações de email',
      'usuário quer personalizar templates',
      'preview antes de ativar automation',
      'teste de email',
    ],
    required_context: ['emailTemplate'],
    optional_context: ['recipientExample', 'variables'],
    props_schema: EmailPreviewPropsSchema,
    render: (props) => PlaceholderComponent({ name: 'EmailPreview', ...props }),
    skeleton: { height: 500, variant: 'email' },
    example: {
      scenario: 'Usuário configurando email de boas-vindas',
      invocation: {
        template: {
          subject: 'Bem-vindo ao Sirius CRM, {{contact_name}}!',
          body: 'Olá {{contact_name}},\n\nFicamos felizes em ter você...',
          variables: {
            contact_name: 'João',
            company_name: 'Clínica Excellence',
          },
        },
        testMode: true,
      },
    },
  },
}

/**
 * Validate component props against schema
 *
 * @param componentName - Name of component in registry
 * @param props - Props to validate
 * @returns Validation result with parsed data or error
 */
export function validateComponentProps(
  componentName: string,
  props: unknown
): ValidationResult {
  const component = SALES_UI_COMPONENTS[componentName]

  if (!component) {
    return {
      valid: false,
      error: `Component "${componentName}" not found in registry. Available: ${Object.keys(SALES_UI_COMPONENTS).join(', ')}`,
    }
  }

  const result = component.props_schema.safeParse(props)

  if (!result.success) {
    return {
      valid: false,
      error: `Props validation failed: ${result.error.message}`,
    }
  }

  return {
    valid: true,
    data: result.data,
  }
}

/**
 * Get simplified component list for AI system prompt
 *
 * @returns Array of component metadata for AI context
 */
export function getComponentsForAI() {
  return Object.entries(SALES_UI_COMPONENTS).map(([name, def]) => ({
    name,
    description: def.description,
    when_to_use: def.when_to_use,
    required_context: def.required_context,
    optional_context: def.optional_context || [],
    example_scenario: def.example?.scenario,
  }))
}

/**
 * Get component definition by name
 *
 * @param name - Component name
 * @returns Component definition or undefined
 */
export function getComponentDefinition(name: string): ComponentDefinition | undefined {
  return SALES_UI_COMPONENTS[name]
}

/**
 * Check if a component exists in registry
 *
 * @param name - Component name
 * @returns True if component exists
 */
export function hasComponent(name: string): boolean {
  return name in SALES_UI_COMPONENTS
}

/**
 * Get all component names
 *
 * @returns Array of component names
 */
export function getComponentNames(): string[] {
  return Object.keys(SALES_UI_COMPONENTS)
}
