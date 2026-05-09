export interface HelpArticle {
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  description: string;
  lastUpdated: string;
  readTime: string;
  content: {
    sections: {
      title: string;
      content: string;
      steps?: string[];
      tips?: string[];
      warning?: string;
    }[];
  };
  relatedArticles?: {
    title: string;
    slug: string;
    category: string;
  }[];
  // EN variants — if absent, /en/help/... gets noindex
  titleEn?: string;
  descriptionEn?: string;
  contentEn?: {
    sections: {
      title: string;
      content: string;
      steps?: string[];
      tips?: string[];
      warning?: string;
    }[];
  };
}

export const helpArticles: HelpArticle[] = [
  // ===== PRIMEIROS PASSOS =====
  {
    title: "Como criar seu primeiro negócio",
    slug: "criar-primeiro-negocio",
    category: "Primeiros Passos",
    categorySlug: "primeiros-passos",
    description: "Guia completo para criar e gerenciar seu primeiro deal no Sirius CRM",
    lastUpdated: "2024-01-23",
    readTime: "4 min",
    content: {
      sections: [
        {
          title: "Introdução",
          content: "Criar seu primeiro negócio no Sirius CRM é simples e intuitivo. Um 'deal' (ou negócio) representa uma oportunidade de venda que você está trabalhando ativamente. Cada deal contém informações como valor, contato responsável, e em qual etapa do processo de venda ele está.",
        },
        {
          title: "Criando seu primeiro deal",
          content: "Siga estes passos para criar um deal:",
          steps: [
            "No dashboard principal (Pipeline Kanban), clique no botão '+ Novo Deal' no canto superior direito",
            "Preencha o título do negócio (ex: 'Venda CRM - Empresa ABC')",
            "Informe o valor estimado do negócio",
            "Selecione ou crie um novo contato para associar ao deal",
            "Adicione uma descrição ou observações se necessário",
            "Clique em 'Criar Deal' - ele aparecerá na primeira etapa do seu pipeline",
          ],
          tips: [
            "Use títulos descritivos que identifiquem facilmente o negócio",
            "Sempre associe um contato ao deal para facilitar o acompanhamento",
            "Defina um valor realista baseado em sua experiência ou proposta",
            "Você pode editar todas as informações depois clicando no card do deal",
          ],
        },
        {
          title: "Movendo o deal pelo pipeline",
          content: "Após criar o deal, você pode movê-lo entre as etapas do pipeline simplesmente arrastando e soltando o card. Cada movimento representa um progresso na negociação.",
          tips: [
            "Arraste o card para a direita conforme avança na negociação",
            "Use as etapas intermediárias para não pular processos importantes",
            "Atualize as informações do deal sempre que houver mudanças significativas",
          ],
        },
      ],
    },
    titleEn: "How to Create Your First Deal",
    descriptionEn: "Complete guide to creating and managing your first deal in Sirius CRM",
    contentEn: {
      sections: [
        {
          title: "Introduction",
          content: "Creating your first deal in Sirius CRM is simple and intuitive. A 'deal' represents a sales opportunity you are actively working on. Each deal holds information like value, the associated contact, and which stage of your sales process it is in.",
        },
        {
          title: "Creating your first deal",
          content: "Follow these steps to create a deal:",
          steps: [
            "On the main dashboard (Pipeline Kanban), click the '+ New Deal' button in the top-right corner",
            "Enter a deal title (e.g., 'CRM Sale - ABC Company')",
            "Enter the estimated deal value",
            "Select or create a new contact to associate with the deal",
            "Add a description or notes if needed",
            "Click 'Create Deal' — it will appear in the first stage of your pipeline",
          ],
          tips: [
            "Use descriptive titles that make the deal easy to identify",
            "Always associate a contact to make follow-up easier",
            "Set a realistic value based on your experience or proposal",
            "You can edit all information later by clicking on the deal card",
          ],
        },
        {
          title: "Moving the deal through the pipeline",
          content: "After creating the deal, you can move it between pipeline stages simply by dragging and dropping the card. Each move represents progress in the negotiation.",
          tips: [
            "Drag the card to the right as you advance in the negotiation",
            "Use intermediate stages to avoid skipping important steps",
            "Update deal information whenever there are significant changes",
          ],
        },
      ],
    },
    relatedArticles: [
      {
        title: "Entendendo o Pipeline Kanban",
        slug: "entendendo-pipeline-kanban",
        category: "Pipeline e Negócios",
      },
      {
        title: "Como cadastrar contatos",
        slug: "cadastrar-contatos",
        category: "Contatos",
      },
    ],
  },

  {
    title: "Entendendo o Pipeline Kanban",
    slug: "entendendo-pipeline-kanban",
    category: "Pipeline e Negócios",
    categorySlug: "pipeline-negocios",
    description: "Aprenda como funciona a visualização Kanban e como usá-la para gerenciar suas vendas",
    titleEn: "Understanding the Kanban Pipeline",
    descriptionEn: "Learn how the Kanban view works and how to use it to manage your sales",
    lastUpdated: "2024-01-23",
    readTime: "5 min",
    content: {
      sections: [
        {
          title: "O que é o Pipeline Kanban?",
          content: "O Pipeline Kanban é uma visualização em colunas que mostra todas as suas oportunidades de venda organizadas por etapa do processo comercial. Cada coluna representa uma fase da venda, e cada card representa um negócio individual. É inspirado na metodologia ágil Kanban, amplamente usada em desenvolvimento de software e agora aplicada a vendas.",
        },
        {
          title: "Estrutura padrão do pipeline",
          content: "Quando você cria sua conta no Sirius CRM, já vem com um pipeline padrão com 5 etapas:",
          steps: [
            "Prospecção - Leads novos que entraram no radar",
            "Qualificação - Leads validados com potencial real de compra",
            "Proposta - Orçamento enviado e em análise pelo cliente",
            "Negociação - Ajustes finais de preço, prazo e condições",
            "Fechado - Deal ganho! Contrato assinado ou venda confirmada",
          ],
          tips: [
            "Você pode personalizar os nomes das etapas em Configurações > Pipelines",
            "Adicione ou remova etapas conforme seu processo de venda",
            "Evite criar muitas etapas - mantenha entre 4-7 para não complicar",
          ],
        },
        {
          title: "Como usar o Kanban no dia a dia",
          content: "O poder do Kanban está na simplicidade visual. Você consegue ver rapidamente:",
          tips: [
            "Quantos deals você tem em cada etapa",
            "Qual o valor total em cada fase do funil",
            "Quais deals estão parados há muito tempo",
            "Onde está o gargalo do seu processo de vendas",
            "Qual vendedor está mais próximo de bater a meta",
          ],
        },
        {
          title: "Boas práticas",
          content: "Para aproveitar ao máximo o Pipeline Kanban:",
          steps: [
            "Atualize o pipeline diariamente - deals parados geram dados falsos",
            "Mova os cards apenas quando a etapa realmente mudar",
            "Use filtros para focar em vendedores ou períodos específicos",
            "Marque deals como 'Perdido' quando não forem mais viáveis",
            "Revise semanalmente os deals em cada etapa para identificar problemas",
          ],
          warning: "Deals parados por mais de 30 dias em uma etapa geralmente indicam problemas. Revise-os regularmente e tome ação ou marque como perdido.",
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "What is the Kanban Pipeline?",
          content: "The Kanban Pipeline is a column-based view that displays all your sales opportunities organized by stage of the sales process. Each column represents a sales phase, and each card represents an individual deal. It is inspired by the Agile Kanban methodology, widely used in software development and now applied to sales.",
        },
        {
          title: "Default pipeline structure",
          content: "When you create your Sirius CRM account, it comes pre-loaded with a default 5-stage pipeline:",
          steps: [
            "Prospecting — New leads that have come onto your radar",
            "Qualification — Validated leads with real buying potential",
            "Proposal — Quote sent and under review by the client",
            "Negotiation — Final adjustments on price, timeline, and terms",
            "Closed — Deal won! Contract signed or sale confirmed",
          ],
          tips: [
            "You can customize stage names in Settings > Pipelines",
            "Add or remove stages to match your sales process",
            "Avoid too many stages — keep it between 4 and 7",
          ],
        },
        {
          title: "Using the Kanban day to day",
          content: "The power of Kanban lies in its visual simplicity. At a glance you can see:",
          tips: [
            "How many deals you have at each stage",
            "Total value in each funnel phase",
            "Which deals have been stalled for a long time",
            "Where the bottleneck in your sales process is",
            "Which rep is closest to hitting quota",
          ],
        },
        {
          title: "Best practices",
          content: "To get the most from the Kanban Pipeline:",
          steps: [
            "Update the pipeline daily — stalled deals produce inaccurate data",
            "Move cards only when the stage truly changes",
            "Use filters to focus on specific reps or time periods",
            "Mark deals as 'Lost' when they are no longer viable",
            "Review deals in each stage weekly to identify issues",
          ],
          warning: "Deals stalled for more than 30 days in a stage usually signal a problem. Review them regularly and take action or mark them as lost.",
        },
      ],
    },
  },

  {
    title: "Como cadastrar e gerenciar contatos",
    slug: "cadastrar-contatos",
    category: "Contatos",
    categorySlug: "contatos",
    description: "Aprenda a criar e organizar seus contatos no Sirius CRM",
    titleEn: "How to Add and Manage Contacts",
    descriptionEn: "Learn how to create and organize your contacts in Sirius CRM",
    lastUpdated: "2024-01-23",
    readTime: "3 min",
    content: {
      sections: [
        {
          title: "Por que cadastrar contatos?",
          content: "Todo deal no Sirius CRM precisa estar associado a um contato. Os contatos representam as pessoas ou empresas com quem você está fazendo negócio. Manter uma base de contatos organizada facilita o acompanhamento, histórico de interações e automações futuras.",
        },
        {
          title: "Cadastrando um novo contato",
          content: "Existem 3 formas de adicionar contatos:",
          steps: [
            "Via menu Contatos: Clique em 'Contatos' no menu lateral > '+ Novo Contato'",
            "Ao criar um deal: Durante a criação de um deal, você pode criar um contato novo na hora",
            "Via importação CSV: Para adicionar vários contatos de uma vez (ver artigo específico)",
          ],
        },
        {
          title: "Campos essenciais",
          content: "Ao cadastrar um contato, preencha pelo menos:",
          steps: [
            "Nome completo ou Razão Social da empresa",
            "Email - importante para automações futuras",
            "Telefone - para contato via WhatsApp",
            "Empresa (se for B2B)",
            "Cargo (opcional mas recomendado)",
          ],
          tips: [
            "Quanto mais completo o cadastro, mais poderosas ficam as automações",
            "Padronize o formato dos telefones: (11) 99999-9999",
            "Use tags para segmentar contatos (ex: 'hot-lead', 'CEO', 'tomador-decisao')",
          ],
        },
        {
          title: "Visualizando histórico do contato",
          content: "Ao clicar em um contato, você vê todos os deals associados a ele, histórico de interações e automações disparadas. Isso dá visibilidade completa do relacionamento com cada cliente.",
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "Why add contacts?",
          content: "Every deal in Sirius CRM needs to be linked to a contact. Contacts represent the people or companies you are doing business with. Keeping a well-organized contact base makes follow-up, interaction history, and future automations much easier.",
        },
        {
          title: "Adding a new contact",
          content: "There are 3 ways to add contacts:",
          steps: [
            "Via the Contacts menu: Click 'Contacts' in the sidebar > '+ New Contact'",
            "While creating a deal: You can create a new contact on the fly during deal creation",
            "Via CSV import: To add multiple contacts at once (see the dedicated article)",
          ],
        },
        {
          title: "Essential fields",
          content: "When adding a contact, fill in at least:",
          steps: [
            "Full name or company name",
            "Email — important for future automations",
            "Phone — for WhatsApp contact",
            "Company (for B2B)",
            "Job title (optional but recommended)",
          ],
          tips: [
            "The more complete the record, the more powerful your automations",
            "Standardize phone format: +1 (555) 999-9999",
            "Use tags to segment contacts (e.g., 'hot-lead', 'CEO', 'decision-maker')",
          ],
        },
        {
          title: "Viewing contact history",
          content: "Clicking on a contact shows all deals linked to them, interaction history, and triggered automations. This gives you complete visibility into each client relationship.",
        },
      ],
    },
  },

  {
    title: "Criando múltiplos pipelines",
    slug: "multiplos-pipelines",
    category: "Pipeline e Negócios",
    categorySlug: "pipeline-negocios",
    description: "Como gerenciar diferentes fluxos de venda com múltiplos pipelines (recurso PRO)",
    titleEn: "Creating Multiple Pipelines",
    descriptionEn: "How to manage different sales flows with multiple pipelines (PRO feature)",
    lastUpdated: "2024-01-23",
    readTime: "4 min",
    content: {
      sections: [
        {
          title: "O que são múltiplos pipelines?",
          content: "Múltiplos pipelines permitem que você tenha diferentes fluxos de venda dentro da mesma conta. Por exemplo: um pipeline para vendas diretas, outro para parcerias, e outro para renovações. Cada pipeline pode ter suas próprias etapas customizadas. Este é um recurso exclusivo do plano PRO.",
        },
        {
          title: "Quando usar múltiplos pipelines?",
          content: "Use múltiplos pipelines quando você tem processos de venda muito diferentes:",
          tips: [
            "Vendas novas vs Renovações (ciclos e etapas diferentes)",
            "B2B vs B2C (complexidade e abordagem distintas)",
            "Produtos diferentes com processos específicos",
            "Vendedores com fluxos especializados",
            "Parcerias ou revendas (processo de aprovação diferente)",
          ],
          warning: "Não crie pipelines desnecessários. Muitos pipelines podem confundir a equipe e diluir métricas. Mantenha entre 2-4 pipelines no máximo.",
        },
        {
          title: "Criando um novo pipeline",
          content: "Para criar um pipeline adicional (requer plano PRO):",
          steps: [
            "Vá em 'Configurações' > 'Pipelines'",
            "Clique em '+ Novo Pipeline'",
            "Dê um nome descritivo (ex: 'Renovações', 'Parcerias')",
            "Defina as etapas específicas para esse fluxo",
            "Salve e comece a adicionar deals nesse pipeline",
          ],
        },
        {
          title: "Alternando entre pipelines",
          content: "No dashboard principal, use o seletor de pipeline no topo da tela para alternar entre seus pipelines. Cada pipeline mostra seus próprios deals e métricas.",
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "What are multiple pipelines?",
          content: "Multiple pipelines let you maintain different sales flows within the same account. For example: one pipeline for direct sales, another for partnerships, and another for renewals. Each pipeline can have its own custom stages. This is an exclusive PRO plan feature.",
        },
        {
          title: "When to use multiple pipelines?",
          content: "Use multiple pipelines when you have very different sales processes:",
          tips: [
            "New sales vs. Renewals (different cycles and stages)",
            "B2B vs. B2C (different complexity and approach)",
            "Different products with specific processes",
            "Specialized reps with distinct workflows",
            "Partnerships or resellers (different approval process)",
          ],
          warning: "Don't create unnecessary pipelines. Too many pipelines can confuse the team and dilute metrics. Keep it to 2–4 pipelines maximum.",
        },
        {
          title: "Creating a new pipeline",
          content: "To create an additional pipeline (requires PRO plan):",
          steps: [
            "Go to Settings > Pipelines",
            "Click '+ New Pipeline'",
            "Give it a descriptive name (e.g., 'Renewals', 'Partnerships')",
            "Define the specific stages for that flow",
            "Save and start adding deals to this pipeline",
          ],
        },
        {
          title: "Switching between pipelines",
          content: "On the main dashboard, use the pipeline selector at the top of the screen to switch between your pipelines. Each pipeline shows its own deals and metrics.",
        },
      ],
    },
  },

  {
    title: "Configurando automações de email",
    slug: "automacoes-email",
    category: "Automações",
    categorySlug: "automacoes",
    description: "Aprenda a criar automações inteligentes baseadas nas etapas do pipeline (PRO)",
    titleEn: "Setting Up Email Automations",
    descriptionEn: "Learn how to create smart automations triggered by pipeline stages (PRO)",
    lastUpdated: "2024-01-23",
    readTime: "6 min",
    content: {
      sections: [
        {
          title: "O que são automações de email?",
          content: "Automações de email no Sirius CRM disparam mensagens automaticamente quando um deal muda de etapa. Por exemplo: quando um deal vai para 'Proposta', você pode enviar automaticamente um email de acompanhamento ao cliente. Este é um recurso exclusivo do plano PRO.",
        },
        {
          title: "Criando sua primeira automação",
          content: "Siga estes passos:",
          steps: [
            "Vá em 'Email Automations' no menu lateral",
            "Clique em '+ Nova Automação'",
            "Escolha o trigger (evento que dispara): 'Deal movido para etapa X'",
            "Selecione a etapa que dispara a automação",
            "Configure o delay (ex: enviar 2 horas após o deal entrar na etapa)",
            "Escreva o assunto e corpo do email",
            "Use variáveis dinâmicas como {{contact.name}} e {{deal.value}}",
            "Ative a automação",
          ],
          tips: [
            "Teste com um deal real antes de ativar para toda a equipe",
            "Use delays estratégicos - nem sempre o envio imediato é o melhor",
            "Personalize com variáveis para aumentar a taxa de resposta",
            "Monitore as métricas de abertura e resposta na seção de analytics",
          ],
        },
        {
          title: "Variáveis disponíveis",
          content: "Você pode usar estas variáveis nos seus emails:",
          steps: [
            "{{contact.name}} - Nome do contato",
            "{{contact.email}} - Email do contato",
            "{{contact.company}} - Empresa do contato",
            "{{deal.title}} - Título do negócio",
            "{{deal.value}} - Valor do negócio",
            "{{deal.stage}} - Etapa atual",
            "{{user.name}} - Nome do vendedor responsável",
          ],
        },
        {
          title: "Melhores práticas",
          content: "Para automações eficazes:",
          tips: [
            "Mantenha os emails curtos e com call-to-action claro",
            "Personalize além do nome - mencione detalhes do negócio",
            "Não automatize tudo - interações humanas ainda são essenciais",
            "Teste A/B diferentes abordagens",
            "Revise e otimize suas automações mensalmente",
          ],
          warning: "Cuidado para não spamear o cliente. Configure delays apropriados e evite enviar múltiplos emails automatizados em sequência.",
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "What are email automations?",
          content: "Email automations in Sirius CRM send messages automatically when a deal moves to a stage. For example: when a deal enters 'Proposal', you can automatically send a follow-up email to the client. This is an exclusive PRO plan feature.",
        },
        {
          title: "Creating your first automation",
          content: "Follow these steps:",
          steps: [
            "Go to 'Email Automations' in the sidebar",
            "Click '+ New Automation'",
            "Choose the trigger (event that fires it): 'Deal moved to stage X'",
            "Select the stage that triggers the automation",
            "Set a delay (e.g., send 2 hours after the deal enters the stage)",
            "Write the email subject and body",
            "Use dynamic variables like {{contact.name}} and {{deal.value}}",
            "Activate the automation",
          ],
          tips: [
            "Test with a real deal before activating for the whole team",
            "Use strategic delays — immediate sends are not always best",
            "Personalize with variables to increase reply rates",
            "Monitor open and reply metrics in the analytics section",
          ],
        },
        {
          title: "Available variables",
          content: "You can use these variables in your emails:",
          steps: [
            "{{contact.name}} — Contact's name",
            "{{contact.email}} — Contact's email",
            "{{contact.company}} — Contact's company",
            "{{deal.title}} — Deal title",
            "{{deal.value}} — Deal value",
            "{{deal.stage}} — Current stage",
            "{{user.name}} — Responsible salesperson's name",
          ],
        },
        {
          title: "Best practices",
          content: "For effective automations:",
          tips: [
            "Keep emails short with a clear call-to-action",
            "Personalize beyond the name — mention deal details",
            "Don't automate everything — human interactions are still essential",
            "A/B test different approaches",
            "Review and optimize your automations monthly",
          ],
          warning: "Be careful not to spam your client. Set appropriate delays and avoid sending multiple automated emails back to back.",
        },
      ],
    },
  },

  {
    title: "Entendendo o Analytics básico",
    slug: "analytics-basico",
    category: "Analytics e Relatórios",
    categorySlug: "analytics",
    description: "Aprenda a interpretar as métricas essenciais do seu funil de vendas",
    titleEn: "Understanding Basic Analytics",
    descriptionEn: "Learn how to interpret the essential metrics of your sales funnel",
    lastUpdated: "2024-01-23",
    readTime: "5 min",
    content: {
      sections: [
        {
          title: "Visão geral do Analytics",
          content: "A página de Analytics mostra métricas em tempo real sobre seu desempenho comercial. Mesmo no plano FREE, você tem acesso a indicadores essenciais para acompanhar a saúde do seu funil.",
        },
        {
          title: "Métricas principais (disponíveis no FREE)",
          content: "Entenda cada métrica:",
          steps: [
            "Total de Deals - Quantidade de oportunidades ativas no pipeline",
            "Valor Total Pipeline - Soma de todos os deals ativos",
            "Taxa de Conversão - % de deals que chegam ao fechamento",
            "Ticket Médio - Valor médio dos deals fechados",
            "Deals por Etapa - Distribuição de oportunidades no funil",
            "Deals Criados vs Fechados - Comparação período a período",
          ],
        },
        {
          title: "Como interpretar seus números",
          content: "Use as métricas para identificar problemas:",
          tips: [
            "Taxa de conversão abaixo de 20%? Revise seu processo de qualificação",
            "Muitos deals em Proposta? Talvez suas propostas precisem melhorar",
            "Poucos deals fechados? Foque em aumentar o topo do funil",
            "Ticket médio caindo? Pode estar vendendo para o perfil errado",
          ],
        },
        {
          title: "Analytics PRO - O próximo nível",
          content: "No plano PRO, você desbloqueia:",
          steps: [
            "Forecasting - Previsão de faturamento baseada em probabilidades",
            "Análise por vendedor - Performance individual de cada rep",
            "Tempo médio por etapa - Identifique gargalos no processo",
            "Funil de conversão detalhado - Taxa entre cada etapa",
            "Relatórios históricos - Compare períodos e identifique tendências",
            "Exportação de dados - Excel e CSV para análises customizadas",
          ],
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "Analytics overview",
          content: "The Analytics page shows real-time metrics about your sales performance. Even on the FREE plan, you have access to essential indicators to track the health of your funnel.",
        },
        {
          title: "Key metrics (available on FREE)",
          content: "Understanding each metric:",
          steps: [
            "Total Deals — Number of active opportunities in the pipeline",
            "Total Pipeline Value — Sum of all active deals",
            "Conversion Rate — % of deals that reach close",
            "Average Ticket — Average value of closed deals",
            "Deals by Stage — Distribution of opportunities in the funnel",
            "Deals Created vs. Closed — Period-over-period comparison",
          ],
        },
        {
          title: "How to interpret your numbers",
          content: "Use metrics to identify problems:",
          tips: [
            "Conversion rate below 20%? Review your qualification process",
            "Too many deals in Proposal? Your proposals may need improvement",
            "Few closed deals? Focus on increasing the top of the funnel",
            "Average ticket dropping? You may be selling to the wrong profile",
          ],
        },
        {
          title: "PRO Analytics — the next level",
          content: "On the PRO plan, you unlock:",
          steps: [
            "Forecasting — Revenue projection based on pipeline probabilities",
            "Rep-level analysis — Individual performance for each salesperson",
            "Average time per stage — Identify process bottlenecks",
            "Detailed conversion funnel — Conversion rate between each stage",
            "Historical reports — Compare periods and identify trends",
            "Data export — Excel and CSV for custom analysis",
          ],
        },
      ],
    },
  },

  {
    title: "Integração com WhatsApp",
    slug: "integracao-whatsapp",
    category: "Integrações",
    categorySlug: "integracoes",
    description: "Como usar a integração nativa com WhatsApp para contatar seus leads",
    titleEn: "WhatsApp Integration",
    descriptionEn: "How to use the native WhatsApp integration to contact your leads",
    lastUpdated: "2024-01-23",
    readTime: "3 min",
    content: {
      sections: [
        {
          title: "Como funciona a integração?",
          content: "O Sirius CRM tem integração nativa com WhatsApp Web. Quando você clica no botão verde (ícone do WhatsApp) em um card de deal, o WhatsApp Web abre automaticamente com uma mensagem pré-formatada para aquele contato. É rápido, simples e não requer configuração complexa.",
        },
        {
          title: "Usando o WhatsApp no dia a dia",
          content: "Para enviar uma mensagem via WhatsApp:",
          steps: [
            "Certifique-se de que o contato tem um telefone cadastrado",
            "No card do deal, clique no botão verde com ícone do WhatsApp",
            "O WhatsApp Web abrirá com uma mensagem sugerida",
            "Personalize a mensagem conforme necessário",
            "Envie normalmente pelo WhatsApp",
          ],
          tips: [
            "Mantenha os telefones no formato padrão: (11) 99999-9999",
            "Use o WhatsApp para follow-ups rápidos e informais",
            "Para conversas mais formais, prefira email",
          ],
        },
        {
          title: "Dica avançada: Templates de mensagem",
          content: "Crie templates de mensagem personalizados no WhatsApp Web para agilizar ainda mais. Por exemplo, crie atalhos como '/followup', '/proposta', '/agradecimento' que expandem para mensagens completas.",
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "How does the integration work?",
          content: "Sirius CRM has native integration with WhatsApp Web. When you click the green button (WhatsApp icon) on a deal card, WhatsApp Web opens automatically with a pre-formatted message for that contact. It is fast, simple, and requires no complex setup.",
        },
        {
          title: "Using WhatsApp day to day",
          content: "To send a message via WhatsApp:",
          steps: [
            "Make sure the contact has a phone number on file",
            "On the deal card, click the green WhatsApp icon button",
            "WhatsApp Web will open with a suggested message",
            "Customize the message as needed",
            "Send normally through WhatsApp",
          ],
          tips: [
            "Keep phone numbers in a standard format",
            "Use WhatsApp for quick, informal follow-ups",
            "For more formal conversations, prefer email",
          ],
        },
        {
          title: "Pro tip: Message templates",
          content: "Create custom message templates in WhatsApp Web to speed things up even more. For example, create shortcuts like '/followup', '/proposal', '/thankyou' that expand into full messages.",
        },
      ],
    },
  },

  {
    title: "Sincronizando com Google Calendar",
    slug: "google-calendar",
    category: "Integrações",
    categorySlug: "integracoes",
    description: "Conecte seu Google Calendar para sincronizar reuniões e follow-ups",
    titleEn: "Syncing with Google Calendar",
    descriptionEn: "Connect your Google Calendar to sync meetings and follow-ups",
    lastUpdated: "2024-01-23",
    readTime: "4 min",
    content: {
      sections: [
        {
          title: "Por que integrar com Google Calendar?",
          content: "A integração com Google Calendar permite que você agende follow-ups e reuniões diretamente no Sirius CRM e eles apareçam automaticamente no seu calendário. Além disso, você pode ver seus próximos compromissos sem sair do CRM.",
        },
        {
          title: "Conectando sua conta Google",
          content: "Para configurar a integração:",
          steps: [
            "Vá em Configurações > Integrações > Google Calendar",
            "Clique em 'Conectar Google Calendar'",
            "Autorize o Sirius CRM a acessar seu calendário (permissão somente leitura)",
            "Aguarde a sincronização - pode levar alguns segundos",
            "Pronto! Agora você pode agendar eventos direto do CRM",
          ],
          warning: "O Sirius CRM nunca modifica ou deleta eventos existentes. A integração é segura e você pode desconectar a qualquer momento.",
        },
        {
          title: "Agendando follow-ups",
          content: "Com a integração ativa, você pode:",
          tips: [
            "Agendar reuniões ao criar ou editar um deal",
            "Ver seus próximos compromissos no dashboard",
            "Receber lembretes automáticos de follow-ups pendentes",
            "Bloquear horários diretamente pelo CRM",
          ],
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "Why integrate with Google Calendar?",
          content: "The Google Calendar integration lets you schedule follow-ups and meetings directly in Sirius CRM, and they appear automatically in your calendar. You can also see upcoming appointments without leaving the CRM.",
        },
        {
          title: "Connecting your Google account",
          content: "To set up the integration:",
          steps: [
            "Go to Settings > Integrations > Google Calendar",
            "Click 'Connect Google Calendar'",
            "Authorize Sirius CRM to access your calendar (read-only permission)",
            "Wait for the sync — it may take a few seconds",
            "Done! You can now schedule events directly from the CRM",
          ],
          warning: "Sirius CRM never modifies or deletes existing events. The integration is safe and you can disconnect at any time.",
        },
        {
          title: "Scheduling follow-ups",
          content: "With the integration active, you can:",
          tips: [
            "Schedule meetings when creating or editing a deal",
            "See upcoming appointments on the dashboard",
            "Receive automatic reminders for pending follow-ups",
            "Block time slots directly from the CRM",
          ],
        },
      ],
    },
  },

  {
    title: "Gerenciando permissões de equipe",
    slug: "permissoes-equipe",
    category: "Equipe e Configurações",
    categorySlug: "equipe",
    description: "Como adicionar usuários e configurar níveis de acesso (PRO)",
    titleEn: "Managing Team Permissions",
    descriptionEn: "How to add users and configure access levels (PRO)",
    lastUpdated: "2024-01-23",
    readTime: "5 min",
    content: {
      sections: [
        {
          title: "Estrutura de permissões",
          content: "O Sirius CRM tem 3 níveis de permissão para usuários:",
          steps: [
            "Owner (Dono) - Acesso total, incluindo billing e exclusão da conta",
            "Admin - Gerencia usuários, pipelines e configurações gerais, mas não pode alterar plano ou excluir conta",
            "Member (Membro) - Acesso apenas aos seus próprios deals, sem permissões administrativas",
          ],
        },
        {
          title: "Adicionando membros à equipe (PRO)",
          content: "Para convidar novos usuários:",
          steps: [
            "Vá em Configurações > Equipe",
            "Clique em '+ Convidar Membro'",
            "Digite o email da pessoa",
            "Escolha o nível de permissão (Admin ou Member)",
            "Envie o convite - a pessoa receberá um email",
            "Ela precisará aceitar o convite e criar uma conta",
          ],
          tips: [
            "Comece adicionando membros como 'Member' - você pode promover depois",
            "Apenas Owners podem gerenciar a assinatura e pagamentos",
            "Cada usuário no plano PRO tem custo adicional - veja a tabela de preços",
          ],
        },
        {
          title: "Visibilidade de dados",
          content: "O que cada nível pode ver:",
          steps: [
            "Owner e Admin - Veem todos os deals de todos os vendedores",
            "Member - Vê apenas seus próprios deals (filtro automático)",
            "Contatos são compartilhados com toda a organização",
            "Analytics mostra dados consolidados para Admin/Owner, individuais para Member",
          ],
        },
        {
          title: "Boas práticas",
          content: "Recomendações para gestão de equipe:",
          tips: [
            "Defina um Owner principal e 1-2 Admins de backup",
            "Revise as permissões trimestralmente",
            "Remova usuários inativos para reduzir custos",
            "Use a visibilidade limitada de Members para incentivar autonomia",
          ],
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "Permission structure",
          content: "Sirius CRM has 3 user permission levels:",
          steps: [
            "Owner — Full access, including billing and account deletion",
            "Admin — Manages users, pipelines, and general settings, but cannot change plan or delete account",
            "Member — Access only to their own deals, no admin permissions",
          ],
        },
        {
          title: "Adding team members (PRO)",
          content: "To invite new users:",
          steps: [
            "Go to Settings > Team",
            "Click '+ Invite Member'",
            "Enter the person's email",
            "Choose the permission level (Admin or Member)",
            "Send the invite — the person will receive an email",
            "They will need to accept the invite and create an account",
          ],
          tips: [
            "Start by adding members as 'Member' — you can promote them later",
            "Only Owners can manage the subscription and payments",
            "Each additional user on the PRO plan has an extra cost — see pricing",
          ],
        },
        {
          title: "Data visibility",
          content: "What each level can see:",
          steps: [
            "Owner and Admin — See all deals from all salespeople",
            "Member — Sees only their own deals (automatic filter)",
            "Contacts are shared across the entire organization",
            "Analytics shows consolidated data for Admin/Owner, individual for Member",
          ],
        },
        {
          title: "Best practices",
          content: "Recommendations for team management:",
          tips: [
            "Set one primary Owner and 1–2 backup Admins",
            "Review permissions quarterly",
            "Remove inactive users to reduce costs",
            "Use Member visibility limits to encourage ownership",
          ],
        },
      ],
    },
  },

  {
    title: "Diferenças entre plano FREE e PRO",
    slug: "free-vs-pro",
    category: "Planos e Billing",
    categorySlug: "planos",
    description: "Entenda os recursos disponíveis em cada plano e quando fazer upgrade",
    titleEn: "FREE vs PRO Plan Differences",
    descriptionEn: "Understand the features available in each plan and when to upgrade",
    lastUpdated: "2024-01-23",
    readTime: "4 min",
    content: {
      sections: [
        {
          title: "Visão geral dos planos",
          content: "O Sirius CRM oferece 2 planos: FREE (gratuito para sempre) e PRO (pago, com recursos avançados). Ambos incluem deals ilimitados, contatos ilimitados e o pipeline Kanban visual.",
        },
        {
          title: "O que está incluído no FREE?",
          content: "O plano gratuito é robusto e perfeito para freelancers ou pequenas equipes:",
          steps: [
            "Deals ilimitados",
            "Contatos ilimitados",
            "1 Pipeline com etapas personalizáveis",
            "Kanban board visual",
            "Analytics básico (métricas essenciais)",
            "Integração com WhatsApp",
            "1 usuário (você)",
          ],
        },
        {
          title: "O que você ganha no PRO?",
          content: "O plano PRO desbloqueia recursos para equipes e operações mais sofisticadas:",
          steps: [
            "Tudo do FREE +",
            "Pipelines ilimitados (múltiplos fluxos de venda)",
            "Usuários ilimitados (adicione sua equipe)",
            "Email Automations (automações inteligentes)",
            "Analytics PRO (forecasting, relatórios avançados)",
            "Controle de permissões (Owner/Admin/Member)",
            "Suporte prioritário",
            "Exportação de dados (CSV/Excel)",
          ],
        },
        {
          title: "Quando fazer upgrade para PRO?",
          content: "Considere o PRO quando você:",
          tips: [
            "Tiver mais de 1 pessoa na equipe comercial",
            "Precisar de processos de venda diferentes (múltiplos pipelines)",
            "Quiser automatizar follow-ups e nutrir leads",
            "Precisar de forecasting para bater metas",
            "Quiser controle granular de permissões",
          ],
        },
        {
          title: "Como fazer upgrade?",
          content: "Para mudar para o plano PRO:",
          steps: [
            "Vá em Configurações > Assinatura",
            "Clique em 'Fazer Upgrade para PRO'",
            "Escolha entre pagamento mensal ou anual (desconto de 20% no anual)",
            "Complete o pagamento via cartão de crédito",
            "Pronto! Recursos PRO liberados imediatamente",
          ],
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "Plan overview",
          content: "Sirius CRM offers 2 plans: FREE (free forever) and PRO (paid, with advanced features). Both include unlimited deals, unlimited contacts, and the visual Kanban pipeline.",
        },
        {
          title: "What's included in FREE?",
          content: "The free plan is robust and perfect for freelancers or small teams:",
          steps: [
            "Unlimited deals",
            "Unlimited contacts",
            "1 Pipeline with customizable stages",
            "Visual Kanban board",
            "Basic analytics (essential metrics)",
            "WhatsApp integration",
            "1 user (you)",
          ],
        },
        {
          title: "What you get with PRO?",
          content: "The PRO plan unlocks features for teams and more sophisticated operations:",
          steps: [
            "Everything in FREE +",
            "Unlimited pipelines (multiple sales flows)",
            "Unlimited users (add your team)",
            "Email Automations (smart automations)",
            "PRO Analytics (forecasting, advanced reports)",
            "Permission control (Owner/Admin/Member)",
            "Priority support",
            "Data export (CSV/Excel)",
          ],
        },
        {
          title: "When to upgrade to PRO?",
          content: "Consider PRO when you:",
          tips: [
            "Have more than 1 person on the sales team",
            "Need different sales processes (multiple pipelines)",
            "Want to automate follow-ups and nurture leads",
            "Need forecasting to hit your targets",
            "Want granular permission control",
          ],
        },
        {
          title: "How to upgrade?",
          content: "To switch to the PRO plan:",
          steps: [
            "Go to Settings > Subscription",
            "Click 'Upgrade to PRO'",
            "Choose between monthly or annual billing (20% discount on annual)",
            "Complete payment by credit card",
            "Done! PRO features are unlocked immediately",
          ],
        },
      ],
    },
  },

  {
    title: "Importando contatos via CSV",
    slug: "importar-contatos-csv",
    category: "Contatos",
    categorySlug: "contatos",
    description: "Como importar múltiplos contatos de uma vez usando planilha",
    titleEn: "Importing Contacts via CSV",
    descriptionEn: "How to import multiple contacts at once using a spreadsheet",
    lastUpdated: "2024-01-23",
    readTime: "4 min",
    content: {
      sections: [
        {
          title: "Quando usar importação?",
          content: "Se você já tem uma base de contatos em planilha (Excel, Google Sheets) ou está migrando de outro CRM, a importação via CSV é a forma mais rápida de trazer todos os dados para o Sirius CRM de uma vez.",
        },
        {
          title: "Preparando sua planilha",
          content: "Antes de importar, organize sua planilha com estas colunas:",
          steps: [
            "name (obrigatório) - Nome completo ou razão social",
            "email (obrigatório) - Email do contato",
            "phone - Telefone no formato (11) 99999-9999",
            "company - Nome da empresa (se B2B)",
            "position - Cargo da pessoa",
            "tags - Tags separadas por vírgula (ex: hot-lead, CEO)",
          ],
          tips: [
            "Salve o arquivo como CSV (não XLSX)",
            "Use UTF-8 encoding para evitar problemas com acentos",
            "Primeira linha deve ser o cabeçalho com os nomes das colunas",
            "Remova linhas duplicadas antes de importar",
          ],
        },
        {
          title: "Importando o arquivo",
          content: "Para fazer a importação:",
          steps: [
            "Vá em Contatos > Importar",
            "Faça upload do arquivo CSV",
            "Mapeie as colunas (sistema tenta auto-detectar)",
            "Escolha o que fazer com duplicatas (pular ou atualizar)",
            "Clique em 'Importar'",
            "Aguarde o processamento - você receberá um email quando finalizar",
          ],
          warning: "A importação é irreversível. Faça um teste com 10-20 contatos primeiro antes de importar toda a base.",
        },
        {
          title: "Após a importação",
          content: "Depois que os contatos forem importados, revise:",
          tips: [
            "Verifique se os dados foram mapeados corretamente",
            "Procure por contatos duplicados e faça merge se necessário",
            "Adicione tags ou segmentações adicionais",
            "Comece a criar deals associados a esses contatos",
          ],
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "When to use import?",
          content: "If you already have a contact base in a spreadsheet (Excel, Google Sheets) or are migrating from another CRM, CSV import is the fastest way to bring all your data into Sirius CRM at once.",
        },
        {
          title: "Preparing your spreadsheet",
          content: "Before importing, organize your spreadsheet with these columns:",
          steps: [
            "name (required) — Full name or company name",
            "email (required) — Contact email",
            "phone — Phone number",
            "company — Company name (for B2B)",
            "position — Job title",
            "tags — Comma-separated tags (e.g., hot-lead, CEO)",
          ],
          tips: [
            "Save the file as CSV (not XLSX)",
            "Use UTF-8 encoding to avoid issues with special characters",
            "First row must be the header with column names",
            "Remove duplicate rows before importing",
          ],
        },
        {
          title: "Importing the file",
          content: "To perform the import:",
          steps: [
            "Go to Contacts > Import",
            "Upload the CSV file",
            "Map the columns (the system tries to auto-detect)",
            "Choose what to do with duplicates (skip or update)",
            "Click 'Import'",
            "Wait for processing — you will receive an email when done",
          ],
          warning: "The import is irreversible. Test with 10–20 contacts first before importing your entire base.",
        },
        {
          title: "After the import",
          content: "Once contacts are imported, review:",
          tips: [
            "Check that data was mapped correctly",
            "Look for duplicate contacts and merge if needed",
            "Add additional tags or segmentations",
            "Start creating deals linked to these contacts",
          ],
        },
      ],
    },
  },

  {
    title: "Usando filtros e busca avançada",
    slug: "filtros-busca",
    category: "Pipeline e Negócios",
    categorySlug: "pipeline-negocios",
    description: "Aprenda a filtrar deals por vendedor, período, valor e outros critérios",
    titleEn: "Using Filters and Advanced Search",
    descriptionEn: "Learn how to filter deals by rep, period, value, and other criteria",
    lastUpdated: "2024-01-23",
    readTime: "3 min",
    content: {
      sections: [
        {
          title: "Por que usar filtros?",
          content: "Quando você tem dezenas ou centenas de deals, filtros são essenciais para focar no que importa. Você pode filtrar por vendedor responsável, valor mínimo, período de criação, etapa específica, e muito mais.",
        },
        {
          title: "Filtros disponíveis",
          content: "No topo do Pipeline Kanban, você encontra:",
          steps: [
            "Busca por título - Digite para encontrar deals específicos",
            "Filtro por vendedor - Ver apenas deals de um rep (útil para managers)",
            "Filtro por período - Deals criados em um range de datas",
            "Filtro por valor - Deals acima de um valor mínimo",
            "Filtro por etapa - Focar em uma fase específica",
            "Filtro por pipeline - Alternar entre pipelines (PRO)",
          ],
        },
        {
          title: "Combinando filtros",
          content: "Você pode combinar múltiplos filtros. Por exemplo: 'Deals do vendedor João, criados em Janeiro, com valor acima de R$ 10.000'. Isso permite análises muito específicas.",
          tips: [
            "Use filtros para fazer reviews semanais de cada vendedor",
            "Filtre por período para fechar o mês e bater metas",
            "Combine vendedor + etapa para identificar gargalos individuais",
            "Salve filtros frequentes como favoritos (recurso futuro)",
          ],
        },
        {
          title: "Busca inteligente",
          content: "A busca do Sirius CRM procura em múltiplos campos: título do deal, nome do contato, empresa e observações. Digite qualquer termo relacionado e encontre rapidamente o que precisa.",
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "Why use filters?",
          content: "When you have dozens or hundreds of deals, filters are essential to focus on what matters. You can filter by responsible rep, minimum value, creation date range, specific stage, and much more.",
        },
        {
          title: "Available filters",
          content: "At the top of the Pipeline Kanban, you'll find:",
          steps: [
            "Title search — Type to find specific deals",
            "Rep filter — View only a specific rep's deals (useful for managers)",
            "Date range filter — Deals created within a date range",
            "Value filter — Deals above a minimum value",
            "Stage filter — Focus on a specific pipeline phase",
            "Pipeline filter — Switch between pipelines (PRO)",
          ],
        },
        {
          title: "Combining filters",
          content: "You can combine multiple filters. For example: 'Deals from rep John, created in January, with value above $10,000'. This enables very specific analyses.",
          tips: [
            "Use filters for weekly reviews of each rep's pipeline",
            "Filter by date range to close out the month and hit targets",
            "Combine rep + stage to identify individual bottlenecks",
            "Save frequent filters as favorites (upcoming feature)",
          ],
        },
        {
          title: "Smart search",
          content: "Sirius CRM's search looks across multiple fields: deal title, contact name, company, and notes. Type any related term to quickly find what you need.",
        },
      ],
    },
  },

  {
    title: "Marcando deals como perdidos",
    slug: "deals-perdidos",
    category: "Pipeline e Negócios",
    categorySlug: "pipeline-negocios",
    description: "Como e quando marcar um negócio como perdido e analisar motivos",
    titleEn: "Marking Deals as Lost",
    descriptionEn: "How and when to mark a deal as lost and analyze the reasons",
    lastUpdated: "2024-01-23",
    readTime: "3 min",
    content: {
      sections: [
        {
          title: "Por que marcar como perdido?",
          content: "Nem todo deal fecha. Marcar negócios como 'Perdido' é essencial para manter seu pipeline limpo e suas métricas precisas. Além disso, rastrear os motivos de perda ajuda a identificar padrões e melhorar seu processo.",
        },
        {
          title: "Quando marcar um deal como perdido?",
          content: "Marque um deal como perdido quando:",
          steps: [
            "O cliente explicitamente disse 'não'",
            "O cliente escolheu um concorrente",
            "O budget foi cortado ou o projeto cancelado",
            "O deal está parado há 60+ dias sem resposta",
            "O lead não é mais qualificado (mudou de empresa, por exemplo)",
          ],
          warning: "Não deixe deals fantasmas no pipeline. Isso distorce suas métricas e dá uma falsa sensação de pipeline saudável.",
        },
        {
          title: "Como marcar como perdido",
          content: "Para marcar um deal como perdido:",
          steps: [
            "Abra o card do deal",
            "Clique no menu de ações (três pontos)",
            "Selecione 'Marcar como Perdido'",
            "Escolha o motivo da perda (obrigatório)",
            "Adicione observações adicionais se relevante",
            "Confirme - o deal sairá do pipeline principal",
          ],
        },
        {
          title: "Motivos de perda comuns",
          content: "O sistema rastreia motivos como:",
          steps: [
            "Preço muito alto",
            "Escolheu concorrente",
            "Budget insuficiente",
            "Timing errado",
            "Falta de fit com o produto",
            "Sem resposta / Ghosting",
          ],
          tips: [
            "Analise mensalmente os motivos de perda mais frequentes",
            "Se 'Preço muito alto' aparece muito, revise sua estratégia de precificação",
            "Se 'Ghosting' é comum, melhore seu follow-up",
          ],
        },
        {
          title: "Reativando deals perdidos",
          content: "Você pode reativar um deal perdido se as circunstâncias mudarem. Vá em 'Deals Perdidos', encontre o deal e clique em 'Reativar'. Ele voltará para a primeira etapa do pipeline.",
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "Why mark deals as lost?",
          content: "Not every deal closes. Marking deals as 'Lost' is essential to keep your pipeline clean and your metrics accurate. Tracking loss reasons also helps identify patterns and improve your process.",
        },
        {
          title: "When to mark a deal as lost?",
          content: "Mark a deal as lost when:",
          steps: [
            "The client explicitly said 'no'",
            "The client chose a competitor",
            "The budget was cut or the project was cancelled",
            "The deal has been inactive for 60+ days without a response",
            "The lead is no longer qualified (changed companies, for example)",
          ],
          warning: "Don't leave ghost deals in the pipeline. This distorts your metrics and gives a false sense of a healthy pipeline.",
        },
        {
          title: "How to mark as lost",
          content: "To mark a deal as lost:",
          steps: [
            "Open the deal card",
            "Click the actions menu (three dots)",
            "Select 'Mark as Lost'",
            "Choose the loss reason (required)",
            "Add additional notes if relevant",
            "Confirm — the deal will leave the main pipeline",
          ],
        },
        {
          title: "Common loss reasons",
          content: "The system tracks reasons such as:",
          steps: [
            "Price too high",
            "Chose a competitor",
            "Insufficient budget",
            "Wrong timing",
            "Poor product fit",
            "No response / Ghosting",
          ],
          tips: [
            "Review the most frequent loss reasons monthly",
            "If 'Price too high' appears often, revisit your pricing strategy",
            "If 'Ghosting' is common, improve your follow-up",
          ],
        },
        {
          title: "Reactivating lost deals",
          content: "You can reactivate a lost deal if circumstances change. Go to 'Lost Deals', find the deal, and click 'Reactivate'. It will return to the first stage of the pipeline.",
        },
      ],
    },
  },

  {
    title: "Configurando notificações",
    slug: "configurar-notificacoes",
    category: "Equipe e Configurações",
    categorySlug: "equipe",
    description: "Personalize quais notificações você quer receber e por qual canal",
    titleEn: "Configuring Notifications",
    descriptionEn: "Customize which notifications you want to receive and through which channel",
    lastUpdated: "2024-01-23",
    readTime: "3 min",
    content: {
      sections: [
        {
          title: "Tipos de notificações",
          content: "O Sirius CRM envia notificações para mantê-lo informado sobre eventos importantes. Você tem controle total sobre quais notificações receber e por qual canal (email, in-app, push).",
        },
        {
          title: "Notificações disponíveis",
          content: "Você pode ser notificado sobre:",
          steps: [
            "Novo deal criado na sua conta",
            "Deal movido para outra etapa",
            "Deal atribuído a você",
            "Comentário em um deal seu",
            "Deal próximo do vencimento (due date)",
            "Automação de email disparada",
            "Novo membro adicionado à equipe (apenas Admins)",
          ],
        },
        {
          title: "Configurando suas preferências",
          content: "Para personalizar notificações:",
          steps: [
            "Vá em Configurações > Notificações",
            "Veja a lista de tipos de notificação",
            "Para cada tipo, marque os canais desejados: Email, In-App ou Push",
            "Salve as alterações",
          ],
          tips: [
            "Desative notificações menos críticas para reduzir ruído",
            "Mantenha Email ativado para notificações importantes (deals atribuídos)",
            "Push notifications são ótimas para alertas em tempo real",
            "Ajuste conforme seu workflow evolui",
          ],
        },
        {
          title: "Modo 'Não Perturbe'",
          content: "Se você precisa de foco total, ative temporariamente o modo 'Não Perturbe' nas configurações. Isso pausa todas as notificações por um período definido (1h, 4h, até amanhã).",
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "Types of notifications",
          content: "Sirius CRM sends notifications to keep you informed about important events. You have full control over which notifications to receive and through which channel (email, in-app, push).",
        },
        {
          title: "Available notifications",
          content: "You can be notified about:",
          steps: [
            "New deal created in your account",
            "Deal moved to another stage",
            "Deal assigned to you",
            "Comment on one of your deals",
            "Deal approaching its due date",
            "Email automation triggered",
            "New member added to the team (Admins only)",
          ],
        },
        {
          title: "Setting your preferences",
          content: "To customize notifications:",
          steps: [
            "Go to Settings > Notifications",
            "See the list of notification types",
            "For each type, check the desired channels: Email, In-App, or Push",
            "Save your changes",
          ],
          tips: [
            "Turn off less critical notifications to reduce noise",
            "Keep Email enabled for important notifications (assigned deals)",
            "Push notifications are great for real-time alerts",
            "Adjust as your workflow evolves",
          ],
        },
        {
          title: "'Do Not Disturb' mode",
          content: "If you need full focus, temporarily activate 'Do Not Disturb' mode in settings. This pauses all notifications for a defined period (1h, 4h, until tomorrow).",
        },
      ],
    },
  },

  {
    title: "Usando a API do Sirius CRM",
    slug: "usando-api",
    category: "Integrações",
    categorySlug: "integracoes",
    description: "Como gerar chaves de API e integrar o Sirius com sistemas externos",
    titleEn: "Using the Sirius CRM API",
    descriptionEn: "How to generate API keys and integrate Sirius with external systems",
    lastUpdated: "2024-01-23",
    readTime: "5 min",
    content: {
      sections: [
        {
          title: "O que é a API?",
          content: "A API (Application Programming Interface) do Sirius CRM permite que você integre o CRM com outros sistemas, automatize tarefas e crie aplicações customizadas. É uma forma de fazer o Sirius conversar com suas outras ferramentas programaticamente.",
        },
        {
          title: "Gerando uma API Key",
          content: "Para começar a usar a API:",
          steps: [
            "Vá em Configurações > API",
            "Clique em 'Gerar Nova Chave'",
            "Dê um nome descritivo (ex: 'Integração Zapier', 'Script de relatórios')",
            "Copie a chave gerada - ela só será mostrada uma vez!",
            "Guarde a chave em local seguro (não comite no Git!)",
          ],
          warning: "Trate sua API key como uma senha. Quem tiver acesso a ela pode fazer ações em nome da sua conta. Revogue chaves comprometidas imediatamente.",
        },
        {
          title: "Endpoints principais",
          content: "A API REST do Sirius oferece endpoints para:",
          steps: [
            "GET /api/deals - Listar todos os deals",
            "POST /api/deals - Criar um novo deal",
            "PATCH /api/deals/:id - Atualizar um deal",
            "GET /api/contacts - Listar contatos",
            "POST /api/contacts - Criar novo contato",
            "GET /api/pipelines - Listar pipelines",
          ],
          tips: [
            "Toda requisição precisa incluir o header: Authorization: Bearer {sua-api-key}",
            "Respeite rate limits: 100 requisições por minuto",
            "Use pagination para listar grandes volumes de dados",
            "Veja a documentação completa em /docs/api",
          ],
        },
        {
          title: "Casos de uso comuns",
          content: "O que você pode fazer com a API:",
          tips: [
            "Criar deals automaticamente quando alguém preenche formulário no site",
            "Sincronizar contatos com sua ferramenta de email marketing",
            "Exportar deals para análise em Business Intelligence",
            "Integrar com Zapier, Make (Integromat) ou N8N",
            "Construir dashboards customizados",
          ],
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "What is the API?",
          content: "The Sirius CRM API (Application Programming Interface) lets you integrate the CRM with other systems, automate tasks, and build custom applications. It is the way to make Sirius communicate with your other tools programmatically.",
        },
        {
          title: "Generating an API key",
          content: "To start using the API:",
          steps: [
            "Go to Settings > API",
            "Click 'Generate New Key'",
            "Give it a descriptive name (e.g., 'Zapier Integration', 'Reporting Script')",
            "Copy the generated key — it will only be shown once!",
            "Store the key somewhere safe (never commit it to Git!)",
          ],
          warning: "Treat your API key like a password. Anyone with access to it can take actions on behalf of your account. Revoke compromised keys immediately.",
        },
        {
          title: "Main endpoints",
          content: "The Sirius REST API provides endpoints for:",
          steps: [
            "GET /api/deals — List all deals",
            "POST /api/deals — Create a new deal",
            "PATCH /api/deals/:id — Update a deal",
            "GET /api/contacts — List contacts",
            "POST /api/contacts — Create a new contact",
            "GET /api/pipelines — List pipelines",
          ],
          tips: [
            "Every request must include the header: Authorization: Bearer {your-api-key}",
            "Respect rate limits: 100 requests per minute",
            "Use pagination to list large data volumes",
            "See full documentation at /docs/api",
          ],
        },
        {
          title: "Common use cases",
          content: "What you can do with the API:",
          tips: [
            "Auto-create deals when someone fills out a form on your website",
            "Sync contacts with your email marketing tool",
            "Export deals for Business Intelligence analysis",
            "Integrate with Zapier, Make (Integromat), or N8N",
            "Build custom dashboards",
          ],
        },
      ],
    },
  },

  {
    title: "Integrando com N8N (automação low-code)",
    slug: "integracao-n8n",
    category: "Integrações",
    categorySlug: "integracoes",
    description: "Como conectar o Sirius CRM com N8N para criar workflows avançados",
    titleEn: "Integrating with N8N (Low-Code Automation)",
    descriptionEn: "How to connect Sirius CRM with N8N to create advanced workflows",
    lastUpdated: "2024-01-23",
    readTime: "6 min",
    content: {
      sections: [
        {
          title: "O que é N8N?",
          content: "N8N é uma ferramenta de automação low-code, similar ao Zapier mas open-source e auto-hospedável. Com ela, você pode criar workflows complexos conectando o Sirius CRM a centenas de outras ferramentas sem escrever código.",
        },
        {
          title: "Configurando a integração",
          content: "Para conectar o Sirius ao N8N:",
          steps: [
            "Crie uma conta no N8N (cloud ou self-hosted)",
            "No Sirius, vá em Configurações > Integrações > N8N",
            "Gere uma API key (ou use uma existente)",
            "No N8N, crie um novo workflow",
            "Adicione um node 'HTTP Request' ou 'Webhook'",
            "Configure a URL base: https://siriuscrm.com.br/api",
            "Adicione o header de autenticação com sua API key",
          ],
        },
        {
          title: "Exemplos de workflows",
          content: "O que você pode automatizar com N8N:",
          tips: [
            "Criar deal automaticamente quando formulário do Typeform é preenchido",
            "Enviar notificação no Slack quando deal fecha",
            "Adicionar contato ao Mailchimp quando entra no CRM",
            "Criar tarefa no Todoist para follow-up de deals",
            "Gerar documento no Google Docs com dados do deal",
            "Enviar SMS via Twilio quando deal muda de etapa",
          ],
        },
        {
          title: "Webhook triggers",
          content: "O Sirius pode disparar webhooks para o N8N quando eventos acontecem:",
          steps: [
            "Vá em Configurações > Integrações > N8N > Webhooks",
            "Crie um novo webhook",
            "Escolha o evento trigger (ex: 'Deal criado', 'Deal movido')",
            "Cole a URL do webhook do N8N",
            "Teste o webhook",
            "Ative - agora o N8N receberá dados em tempo real",
          ],
          tips: [
            "Use webhooks para automações em tempo real",
            "Use polling (HTTP Request agendado) para sincronizações periódicas",
            "Sempre valide e trate erros no N8N",
          ],
        },
        {
          title: "Recursos avançados",
          content: "Com N8N você pode:",
          tips: [
            "Criar loops condicionais (if/else)",
            "Transformar e enriquecer dados entre sistemas",
            "Fazer chamadas paralelas para múltiplos serviços",
            "Implementar retries e tratamento de erros",
            "Construir workflows complexos sem escrever código",
          ],
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "What is N8N?",
          content: "N8N is a low-code automation tool, similar to Zapier but open-source and self-hostable. With it, you can build complex workflows connecting Sirius CRM to hundreds of other tools without writing code.",
        },
        {
          title: "Setting up the integration",
          content: "To connect Sirius to N8N:",
          steps: [
            "Create an N8N account (cloud or self-hosted)",
            "In Sirius, go to Settings > Integrations > N8N",
            "Generate an API key (or use an existing one)",
            "In N8N, create a new workflow",
            "Add an 'HTTP Request' or 'Webhook' node",
            "Set the base URL: https://siriuscrm.com.br/api",
            "Add the authentication header with your API key",
          ],
        },
        {
          title: "Workflow examples",
          content: "What you can automate with N8N:",
          tips: [
            "Auto-create a deal when a Typeform form is submitted",
            "Send a Slack notification when a deal closes",
            "Add a contact to Mailchimp when they enter the CRM",
            "Create a Todoist task for deal follow-ups",
            "Generate a Google Docs document with deal data",
            "Send an SMS via Twilio when a deal changes stage",
          ],
        },
        {
          title: "Webhook triggers",
          content: "Sirius can trigger webhooks to N8N when events occur:",
          steps: [
            "Go to Settings > Integrations > N8N > Webhooks",
            "Create a new webhook",
            "Choose the trigger event (e.g., 'Deal created', 'Deal moved')",
            "Paste the N8N webhook URL",
            "Test the webhook",
            "Activate — N8N will now receive data in real time",
          ],
          tips: [
            "Use webhooks for real-time automations",
            "Use polling (scheduled HTTP Request) for periodic syncs",
            "Always validate and handle errors in N8N",
          ],
        },
        {
          title: "Advanced features",
          content: "With N8N you can:",
          tips: [
            "Create conditional loops (if/else)",
            "Transform and enrich data between systems",
            "Make parallel calls to multiple services",
            "Implement retries and error handling",
            "Build complex workflows without writing code",
          ],
        },
      ],
    },
  },

  {
    title: "Exportando dados para análise",
    slug: "exportar-dados",
    category: "Analytics e Relatórios",
    categorySlug: "analytics",
    description: "Como exportar seus deals e contatos para Excel ou CSV (PRO)",
    titleEn: "Exporting Data for Analysis",
    descriptionEn: "How to export your deals and contacts to Excel or CSV (PRO)",
    lastUpdated: "2024-01-23",
    readTime: "3 min",
    content: {
      sections: [
        {
          title: "Por que exportar dados?",
          content: "Embora o Sirius tenha analytics integrado, às vezes você precisa fazer análises mais profundas em ferramentas especializadas como Excel, Power BI ou Google Sheets. A exportação de dados (recurso PRO) permite isso.",
        },
        {
          title: "O que pode ser exportado?",
          content: "Você pode exportar:",
          steps: [
            "Todos os deals (ativos, fechados e perdidos)",
            "Todos os contatos com campos completos",
            "Histórico de movimentações de deals",
            "Dados de email automations (envios, aberturas, cliques)",
            "Métricas de performance por vendedor",
          ],
        },
        {
          title: "Como exportar",
          content: "Para exportar dados:",
          steps: [
            "Vá para a seção que deseja exportar (ex: Deals, Contatos)",
            "Aplique filtros se quiser exportar apenas um subset",
            "Clique no botão 'Exportar' (ícone de download)",
            "Escolha o formato: CSV ou Excel (XLSX)",
            "Aguarde o processamento",
            "Faça download do arquivo gerado",
          ],
          tips: [
            "Exporte dados regularmente para backup",
            "Use filtros antes de exportar para datasets menores e focados",
            "Excel preserva formatação, CSV é universal",
          ],
        },
        {
          title: "Análises comuns com dados exportados",
          content: "O que fazer com os dados exportados:",
          tips: [
            "Criar dashboards customizados no Power BI ou Tableau",
            "Análises de coorte (performance por período de entrada)",
            "Previsões com modelos estatísticos avançados",
            "Relatórios personalizados para board ou investidores",
            "Combinar com dados de outras fontes (financeiro, suporte)",
          ],
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "Why export data?",
          content: "While Sirius has built-in analytics, sometimes you need deeper analysis in specialized tools like Excel, Power BI, or Google Sheets. Data export (PRO feature) enables exactly that.",
        },
        {
          title: "What can be exported?",
          content: "You can export:",
          steps: [
            "All deals (active, closed, and lost)",
            "All contacts with complete fields",
            "Deal movement history",
            "Email automation data (sends, opens, clicks)",
            "Performance metrics by rep",
          ],
        },
        {
          title: "How to export",
          content: "To export data:",
          steps: [
            "Go to the section you want to export (e.g., Deals, Contacts)",
            "Apply filters if you only want a subset",
            "Click the 'Export' button (download icon)",
            "Choose the format: CSV or Excel (XLSX)",
            "Wait for processing",
            "Download the generated file",
          ],
          tips: [
            "Export data regularly as a backup",
            "Use filters before exporting for smaller, focused datasets",
            "Excel preserves formatting; CSV is universal",
          ],
        },
        {
          title: "Common analyses with exported data",
          content: "What to do with your exported data:",
          tips: [
            "Build custom dashboards in Power BI or Tableau",
            "Cohort analyses (performance by entry period)",
            "Advanced statistical forecasting models",
            "Custom reports for board or investors",
            "Combine with data from other sources (finance, support)",
          ],
        },
      ],
    },
  },

  {
    title: "Configurando seu perfil e preferências",
    slug: "configurar-perfil",
    category: "Equipe e Configurações",
    categorySlug: "equipe",
    description: "Personalize suas informações de perfil e preferências do sistema",
    titleEn: "Setting Up Your Profile and Preferences",
    descriptionEn: "Customize your profile information and system preferences",
    lastUpdated: "2024-01-23",
    readTime: "2 min",
    content: {
      sections: [
        {
          title: "Acessando seu perfil",
          content: "Para editar suas informações pessoais, clique no seu avatar no canto superior direito e selecione 'Perfil' ou vá em Configurações > Perfil.",
        },
        {
          title: "Informações editáveis",
          content: "Você pode atualizar:",
          steps: [
            "Nome completo - aparece em notificações e como autor de ações",
            "Email - usado para login e notificações",
            "Telefone - opcional, para contato interno",
            "Avatar - foto de perfil (recomendado para identificação rápida)",
            "Cargo - ajuda a identificar função na equipe",
          ],
          tips: [
            "Use uma foto real - facilita colaboração em equipes",
            "Mantenha email atualizado - é crítico para recuperação de senha",
          ],
        },
        {
          title: "Alterando senha",
          content: "Para mudar sua senha, vá em Configurações > Perfil > Segurança > Alterar Senha. Digite sua senha atual e a nova senha (mínimo 8 caracteres).",
        },
        {
          title: "Preferências de idioma e fuso horário",
          content: "Configure o idioma da interface (Português/English) e seu fuso horário para que datas e horários sejam exibidos corretamente.",
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "Accessing your profile",
          content: "To edit your personal information, click your avatar in the top-right corner and select 'Profile', or go to Settings > Profile.",
        },
        {
          title: "Editable information",
          content: "You can update:",
          steps: [
            "Full name — appears in notifications and as author of actions",
            "Email — used for login and notifications",
            "Phone — optional, for internal contact",
            "Avatar — profile photo (recommended for quick identification)",
            "Job title — helps identify your role in the team",
          ],
          tips: [
            "Use a real photo — it improves collaboration in teams",
            "Keep email up to date — it is critical for password recovery",
          ],
        },
        {
          title: "Changing password",
          content: "To change your password, go to Settings > Profile > Security > Change Password. Enter your current password and the new password (minimum 8 characters).",
        },
        {
          title: "Language and timezone preferences",
          content: "Set the interface language (Portuguese/English) and your timezone so that dates and times are displayed correctly.",
        },
      ],
    },
  },

  {
    title: "Analytics PRO: Forecasting de vendas",
    slug: "forecasting-vendas",
    category: "Analytics e Relatórios",
    categorySlug: "analytics",
    description: "Como usar o forecasting para prever faturamento e bater metas (PRO)",
    titleEn: "PRO Analytics: Sales Forecasting",
    descriptionEn: "How to use forecasting to predict revenue and hit your targets (PRO)",
    lastUpdated: "2024-01-23",
    readTime: "5 min",
    content: {
      sections: [
        {
          title: "O que é Forecasting?",
          content: "Forecasting é a previsão de receita baseada nos deals atuais no pipeline. O Sirius CRM analisa seus deals, aplica probabilidades de fechamento por etapa, e calcula quanto você provavelmente vai faturar no mês/trimestre. Este é um recurso exclusivo do plano PRO.",
        },
        {
          title: "Como funciona o cálculo?",
          content: "O forecast considera:",
          steps: [
            "Valor de cada deal no pipeline",
            "Probabilidade de fechamento baseada na etapa atual",
            "Histórico de conversão da sua equipe",
            "Tempo médio de fechamento",
            "Sazonalidade (se houver dados suficientes)",
          ],
          tips: [
            "Quanto mais dados históricos, mais preciso o forecast",
            "Mantenha o pipeline atualizado para previsões confiáveis",
            "Revise e ajuste probabilidades customizadas por etapa se necessário",
          ],
        },
        {
          title: "Interpretando os números",
          content: "Na página Analytics PRO, você vê 3 cenários:",
          steps: [
            "Pessimista - Assume que só os deals em estágio final fecham (80% de probabilidade)",
            "Realista - Calcula baseado nas probabilidades médias de cada etapa",
            "Otimista - Assume que todos os deals qualificados podem fechar (até 30% de probabilidade)",
          ],
        },
        {
          title: "Usando forecast para gestão de metas",
          content: "Compare o forecast realista com sua meta mensal:",
          tips: [
            "Se forecast < meta: acelere prospecção para preencher o topo do funil",
            "Se forecast ≈ meta: mantenha o ritmo, mas acompanhe de perto",
            "Se forecast > meta: ótimo! Mas não pare de prospectar",
            "Revise o forecast semanalmente e ajuste estratégia",
          ],
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "What is Forecasting?",
          content: "Forecasting is revenue prediction based on current pipeline deals. Sirius CRM analyzes your deals, applies closing probabilities by stage, and calculates how much you will likely bill this month or quarter. This is an exclusive PRO plan feature.",
        },
        {
          title: "How is the forecast calculated?",
          content: "The forecast considers:",
          steps: [
            "Value of each deal in the pipeline",
            "Closing probability based on the current stage",
            "Historical conversion rate for your team",
            "Average closing time",
            "Seasonality (when sufficient data is available)",
          ],
          tips: [
            "The more historical data you have, the more accurate the forecast",
            "Keep the pipeline up to date for reliable predictions",
            "Review and adjust custom probabilities per stage if needed",
          ],
        },
        {
          title: "Interpreting the numbers",
          content: "On the PRO Analytics page, you see 3 scenarios:",
          steps: [
            "Pessimistic — Assumes only deals in late stages close (80% probability)",
            "Realistic — Calculated using average probabilities for each stage",
            "Optimistic — Assumes all qualified deals could close (up to 30% probability)",
          ],
        },
        {
          title: "Using forecast for target management",
          content: "Compare the realistic forecast with your monthly target:",
          tips: [
            "Forecast < target: accelerate prospecting to fill the top of the funnel",
            "Forecast ≈ target: maintain pace but monitor closely",
            "Forecast > target: great! But keep prospecting",
            "Review the forecast weekly and adjust strategy",
          ],
        },
      ],
    },
  },

  {
    title: "Personalizando etapas do pipeline",
    slug: "personalizar-etapas",
    category: "Pipeline e Negócios",
    categorySlug: "pipeline-negocios",
    description: "Como criar, editar e reordenar etapas do seu pipeline",
    titleEn: "Customizing Pipeline Stages",
    descriptionEn: "How to create, edit, and reorder your pipeline stages",
    lastUpdated: "2024-01-23",
    readTime: "4 min",
    content: {
      sections: [
        {
          title: "Por que personalizar etapas?",
          content: "Todo negócio tem um processo de venda único. As etapas padrão do Sirius são um bom ponto de partida, mas você pode (e deve!) ajustá-las para refletir seu fluxo real. Isso torna o CRM mais intuitivo e os dados mais precisos.",
        },
        {
          title: "Acessando configurações de pipeline",
          content: "Para editar etapas:",
          steps: [
            "Vá em Configurações > Pipelines",
            "Selecione o pipeline que quer editar",
            "Você verá a lista de etapas atuais",
            "Use as ações disponíveis: Adicionar, Editar, Reordenar ou Excluir",
          ],
        },
        {
          title: "Adicionando uma nova etapa",
          content: "Para criar uma etapa:",
          steps: [
            "Clique em '+ Nova Etapa'",
            "Dê um nome claro e descritivo (ex: 'Demo Agendada')",
            "Defina a probabilidade de fechamento (0-100%)",
            "Escolha a cor visual (opcional, ajuda a identificar rapidamente)",
            "Salve",
          ],
          tips: [
            "Use nomes que fazem sentido para toda a equipe",
            "Probabilidades ajudam no forecasting - seja realista",
            "Mantenha entre 4-7 etapas - menos é mais",
          ],
        },
        {
          title: "Reordenando etapas",
          content: "Arraste e solte as etapas na ordem que representa seu processo de venda. A ordem afeta como os deals fluem visualmente no Kanban e influencia métricas de conversão.",
        },
        {
          title: "Excluindo etapas",
          content: "Ao excluir uma etapa, você precisará escolher para onde mover os deals existentes nela. Escolha uma etapa similar ou a anterior no processo.",
          warning: "Não exclua etapas com muitos deals ativos. Primeiro mova os deals manualmente para ter controle total do processo.",
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "Why customize stages?",
          content: "Every business has a unique sales process. Sirius's default stages are a good starting point, but you can (and should!) adjust them to reflect your real flow. This makes the CRM more intuitive and your data more accurate.",
        },
        {
          title: "Accessing pipeline settings",
          content: "To edit stages:",
          steps: [
            "Go to Settings > Pipelines",
            "Select the pipeline you want to edit",
            "You will see the current list of stages",
            "Use available actions: Add, Edit, Reorder, or Delete",
          ],
        },
        {
          title: "Adding a new stage",
          content: "To create a stage:",
          steps: [
            "Click '+ New Stage'",
            "Give it a clear, descriptive name (e.g., 'Demo Scheduled')",
            "Set the closing probability (0–100%)",
            "Choose a display color (optional, helps identify quickly)",
            "Save",
          ],
          tips: [
            "Use names that make sense to the whole team",
            "Probabilities help with forecasting — be realistic",
            "Keep it to 4–7 stages — less is more",
          ],
        },
        {
          title: "Reordering stages",
          content: "Drag and drop stages in the order that represents your sales process. The order affects how deals flow visually in the Kanban and influences conversion metrics.",
        },
        {
          title: "Deleting stages",
          content: "When deleting a stage, you will need to choose where to move the existing deals in it. Pick a similar stage or the previous one in the process.",
          warning: "Do not delete stages with many active deals. First move the deals manually to maintain full control over the process.",
        },
      ],
    },
  },

  {
    title: "Gerenciando assinatura e pagamentos",
    slug: "gerenciar-assinatura",
    category: "Planos e Billing",
    categorySlug: "planos",
    description: "Como atualizar forma de pagamento, mudar plano e cancelar assinatura",
    titleEn: "Managing Subscription and Payments",
    descriptionEn: "How to update payment method, change plan, and cancel subscription",
    lastUpdated: "2024-01-23",
    readTime: "4 min",
    content: {
      sections: [
        {
          title: "Acessando billing",
          content: "Apenas o Owner da conta pode gerenciar billing. Vá em Configurações > Assinatura para ver detalhes do seu plano atual, próximo vencimento, e histórico de faturas.",
        },
        {
          title: "Atualizando forma de pagamento",
          content: "Para trocar o cartão de crédito:",
          steps: [
            "Vá em Configurações > Assinatura > Forma de Pagamento",
            "Clique em 'Atualizar Cartão'",
            "Digite os dados do novo cartão",
            "Salve - a próxima cobrança usará o novo cartão",
          ],
          tips: [
            "Atualize o cartão antes do vencimento para evitar suspensão",
            "O Sirius não armazena dados do cartão - tudo via Stripe (PCI compliant)",
          ],
        },
        {
          title: "Mudando de plano",
          content: "Para fazer upgrade ou downgrade:",
          steps: [
            "Em Configurações > Assinatura, clique em 'Mudar Plano'",
            "Escolha o novo plano (Mensal, Anual, ou downgrade para FREE)",
            "Se upgrade: mudança é imediata, você paga proporcional até o fim do ciclo",
            "Se downgrade: mudança acontece no fim do ciclo atual (você não perde dias pagos)",
            "Confirme a mudança",
          ],
        },
        {
          title: "Cancelando assinatura",
          content: "Para cancelar o plano PRO e voltar ao FREE:",
          steps: [
            "Vá em Configurações > Assinatura",
            "Role até o final e clique em 'Cancelar Assinatura'",
            "Informe o motivo (opcional, mas nos ajuda a melhorar)",
            "Confirme o cancelamento",
            "Seu plano PRO continua ativo até o fim do período pago",
            "Após o vencimento, você volta automaticamente ao FREE",
          ],
          warning: "No plano FREE, você perde: múltiplos pipelines, email automations, usuários adicionais e analytics PRO. Seus dados são preservados.",
        },
        {
          title: "Histórico de faturas",
          content: "Acesse todas as suas faturas passadas em Configurações > Assinatura > Faturas. Você pode fazer download de cada fatura em PDF para contabilidade.",
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "Accessing billing",
          content: "Only the account Owner can manage billing. Go to Settings > Subscription to see your current plan details, next renewal date, and invoice history.",
        },
        {
          title: "Updating payment method",
          content: "To change your credit card:",
          steps: [
            "Go to Settings > Subscription > Payment Method",
            "Click 'Update Card'",
            "Enter the new card details",
            "Save — the next charge will use the new card",
          ],
          tips: [
            "Update the card before the renewal date to avoid suspension",
            "Sirius does not store card data — everything is handled via Stripe (PCI compliant)",
          ],
        },
        {
          title: "Changing plan",
          content: "To upgrade or downgrade:",
          steps: [
            "In Settings > Subscription, click 'Change Plan'",
            "Choose the new plan (Monthly, Annual, or downgrade to FREE)",
            "If upgrading: change is immediate, you pay prorated to end of cycle",
            "If downgrading: change takes effect at the end of the current cycle (no lost paid days)",
            "Confirm the change",
          ],
        },
        {
          title: "Cancelling subscription",
          content: "To cancel the PRO plan and return to FREE:",
          steps: [
            "Go to Settings > Subscription",
            "Scroll to the bottom and click 'Cancel Subscription'",
            "Provide a reason (optional, but it helps us improve)",
            "Confirm the cancellation",
            "Your PRO plan remains active until the end of the paid period",
            "After expiry, you automatically return to FREE",
          ],
          warning: "On the FREE plan, you lose: multiple pipelines, email automations, additional users, and PRO analytics. Your data is preserved.",
        },
        {
          title: "Invoice history",
          content: "Access all past invoices at Settings > Subscription > Invoices. You can download each invoice as a PDF for accounting.",
        },
      ],
    },
  },

  {
    title: "Adicionando tags e custom fields",
    slug: "tags-custom-fields",
    category: "Pipeline e Negócios",
    categorySlug: "pipeline-negocios",
    description: "Como usar tags e campos customizados para organizar seus deals",
    titleEn: "Adding Tags and Custom Fields",
    descriptionEn: "How to use tags and custom fields to organize your deals",
    lastUpdated: "2024-01-23",
    readTime: "4 min",
    content: {
      sections: [
        {
          title: "O que são tags?",
          content: "Tags são etiquetas que você pode adicionar a deals e contatos para categorizá-los de forma flexível. Por exemplo: 'hot-lead', 'enterprise', 'retorno', 'indicação'. Tags são úteis para filtros e segmentações rápidas.",
        },
        {
          title: "Adicionando tags a deals",
          content: "Para adicionar tags:",
          steps: [
            "Abra o card do deal",
            "Na seção 'Tags', clique em 'Adicionar Tag'",
            "Digite o nome da tag (ou selecione uma existente)",
            "Pressione Enter",
            "A tag aparece no card e você pode filtrar por ela",
          ],
          tips: [
            "Crie um padrão de nomenclatura (ex: prioridade-alta, origem-indicacao)",
            "Use cores diferentes para categorias diferentes",
            "Não abuse - 2-3 tags por deal é suficiente",
            "Tags são compartilhadas com toda a organização",
          ],
        },
        {
          title: "Custom fields (campos customizados)",
          content: "Custom fields permitem adicionar informações extras aos deals além dos campos padrão. Por exemplo: 'Número de funcionários', 'Indústria', 'Fonte de lead', etc.",
        },
        {
          title: "Criando um custom field",
          content: "Para adicionar um campo customizado:",
          steps: [
            "Vá em Configurações > Custom Fields",
            "Clique em '+ Novo Campo'",
            "Defina o nome do campo (ex: 'Indústria')",
            "Escolha o tipo: Texto, Número, Data, Dropdown, etc.",
            "Se dropdown, defina as opções (ex: Tecnologia, Varejo, Saúde)",
            "Salve - o campo aparece em todos os deals",
          ],
          tips: [
            "Use dropdowns para dados estruturados (facilita filtros e analytics)",
            "Campos de texto livre para observações",
            "Não crie muitos custom fields - foque no essencial",
          ],
        },
        {
          title: "Filtrando por tags e custom fields",
          content: "Depois de adicionar tags e custom fields, use-os nos filtros do pipeline para segmentar seus deals e fazer análises específicas.",
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "What are tags?",
          content: "Tags are labels you can add to deals and contacts to categorize them flexibly. For example: 'hot-lead', 'enterprise', 'returning', 'referral'. Tags are useful for quick filters and segmentations.",
        },
        {
          title: "Adding tags to deals",
          content: "To add tags:",
          steps: [
            "Open the deal card",
            "In the 'Tags' section, click 'Add Tag'",
            "Type the tag name (or select an existing one)",
            "Press Enter",
            "The tag appears on the card and you can filter by it",
          ],
          tips: [
            "Create a naming convention (e.g., priority-high, source-referral)",
            "Use different colors for different categories",
            "Don't overdo it — 2–3 tags per deal is enough",
            "Tags are shared across the whole organization",
          ],
        },
        {
          title: "Custom fields",
          content: "Custom fields let you add extra information to deals beyond the default fields. For example: 'Number of employees', 'Industry', 'Lead source', etc.",
        },
        {
          title: "Creating a custom field",
          content: "To add a custom field:",
          steps: [
            "Go to Settings > Custom Fields",
            "Click '+ New Field'",
            "Set the field name (e.g., 'Industry')",
            "Choose the type: Text, Number, Date, Dropdown, etc.",
            "If dropdown, define the options (e.g., Technology, Retail, Healthcare)",
            "Save — the field appears in all deals",
          ],
          tips: [
            "Use dropdowns for structured data (makes filtering and analytics easier)",
            "Free-text fields for open notes",
            "Don't create too many custom fields — focus on the essentials",
          ],
        },
        {
          title: "Filtering by tags and custom fields",
          content: "After adding tags and custom fields, use them in the pipeline filters to segment your deals and run specific analyses.",
        },
      ],
    },
  },

  {
    title: "Atalhos de teclado do Sirius CRM",
    slug: "atalhos-teclado",
    category: "Primeiros Passos",
    categorySlug: "primeiros-passos",
    description: "Aumente sua produtividade com atalhos de teclado essenciais",
    titleEn: "Sirius CRM Keyboard Shortcuts",
    descriptionEn: "Boost your productivity with essential keyboard shortcuts",
    lastUpdated: "2024-01-23",
    readTime: "2 min",
    content: {
      sections: [
        {
          title: "Por que usar atalhos?",
          content: "Atalhos de teclado aceleram tarefas repetitivas e melhoram significativamente sua produtividade no CRM. Vendedores experientes usam atalhos constantemente para criar deals, navegar e atualizar informações rapidamente.",
        },
        {
          title: "Atalhos principais",
          content: "Memorize estes atalhos essenciais:",
          steps: [
            "N - Criar novo deal (de qualquer tela)",
            "C - Criar novo contato",
            "/ ou Ctrl+K - Abrir busca global",
            "Esc - Fechar modal/dialog atual",
            "? - Mostrar lista completa de atalhos",
            "G então D - Ir para Dashboard",
            "G então C - Ir para Contatos",
            "G então A - Ir para Analytics",
          ],
          tips: [
            "Pratique os atalhos por uma semana - depois vira segunda natureza",
            "Use 'N' para criar deals rapidamente sem tirar as mãos do teclado",
            "Ctrl+K abre busca universal - encontre deals, contatos ou navegue",
          ],
        },
        {
          title: "Navegação no pipeline",
          content: "Enquanto navega pelo Kanban:",
          steps: [
            "Setas ← → - Navegar entre etapas",
            "Setas ↑ ↓ - Navegar entre deals na mesma etapa",
            "Enter - Abrir deal selecionado",
            "Tab - Alternar foco entre filtros e pipeline",
          ],
        },
        {
          title: "Editando deals",
          content: "Dentro de um deal aberto:",
          steps: [
            "Ctrl+S - Salvar mudanças",
            "Ctrl+Enter - Salvar e fechar",
            "E - Editar modo rápido",
            "Delete - Marcar como perdido (com confirmação)",
          ],
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "Why use shortcuts?",
          content: "Keyboard shortcuts speed up repetitive tasks and significantly improve your productivity in the CRM. Experienced salespeople use shortcuts constantly to create deals, navigate, and update information quickly.",
        },
        {
          title: "Main shortcuts",
          content: "Memorize these essential shortcuts:",
          steps: [
            "N — Create a new deal (from any screen)",
            "C — Create a new contact",
            "/ or Ctrl+K — Open global search",
            "Esc — Close current modal/dialog",
            "? — Show full list of shortcuts",
            "G then D — Go to Dashboard",
            "G then C — Go to Contacts",
            "G then A — Go to Analytics",
          ],
          tips: [
            "Practice shortcuts for a week — after that it becomes second nature",
            "Use 'N' to create deals quickly without taking your hands off the keyboard",
            "Ctrl+K opens universal search — find deals, contacts, or navigate",
          ],
        },
        {
          title: "Pipeline navigation",
          content: "While browsing the Kanban:",
          steps: [
            "← → arrows — Navigate between stages",
            "↑ ↓ arrows — Navigate between deals in the same stage",
            "Enter — Open selected deal",
            "Tab — Switch focus between filters and pipeline",
          ],
        },
        {
          title: "Editing deals",
          content: "Inside an open deal:",
          steps: [
            "Ctrl+S — Save changes",
            "Ctrl+Enter — Save and close",
            "E — Quick edit mode",
            "Delete — Mark as lost (with confirmation)",
          ],
        },
      ],
    },
  },

  {
    title: "Melhores práticas de gestão de vendas",
    slug: "melhores-praticas-vendas",
    category: "Primeiros Passos",
    categorySlug: "primeiros-passos",
    description: "Dicas e estratégias para maximizar resultados com o Sirius CRM",
    titleEn: "Sales Management Best Practices",
    descriptionEn: "Tips and strategies to maximize results with Sirius CRM",
    lastUpdated: "2024-01-23",
    readTime: "6 min",
    content: {
      sections: [
        {
          title: "Introdução",
          content: "Um CRM é apenas uma ferramenta. O que realmente gera resultados é como você usa. Aqui estão as melhores práticas compiladas de centenas de equipes de vendas bem-sucedidas usando o Sirius CRM.",
        },
        {
          title: "1. Atualize o pipeline diariamente",
          content: "Pipeline desatualizado = decisões erradas. Comprometa-se a atualizar seus deals todos os dias, preferencialmente no final do expediente.",
          tips: [
            "Reserve 15 minutos no fim do dia para atualizar todos os deals",
            "Mova deals que progrediram",
            "Marque como perdido deals parados há 60+ dias",
            "Adicione observações sobre interações importantes",
          ],
        },
        {
          title: "2. Siga um processo consistente",
          content: "Personalize as etapas do pipeline para refletir seu processo real, e então siga esse processo religiosamente para todos os deals. Isso gera dados confiáveis e processos previsíveis.",
        },
        {
          title: "3. Qualifique antes de prospectar muito",
          content: "Qualidade > Quantidade. É melhor ter 20 deals altamente qualificados do que 200 leads frios. Use frameworks como BANT ou MEDDIC para qualificar antes de investir tempo.",
          tips: [
            "Pergunte sobre Budget, Authority, Need e Timeline logo cedo",
            "Desqualifique rápido - não perca tempo com leads ruins",
            "Foque energia nos deals com maior probabilidade de fechar",
          ],
        },
        {
          title: "4. Use automações estrategicamente",
          content: "Automatize follow-ups básicos, mas mantenha toque humano nas interações críticas. Email de confirmação de proposta? Automatize. Negociação final? Ligação pessoal.",
        },
        {
          title: "5. Analise métricas semanalmente",
          content: "Reserve 1 hora toda segunda-feira para revisar:",
          steps: [
            "Taxa de conversão por etapa - onde está o gargalo?",
            "Tempo médio em cada etapa - alguma etapa travando?",
            "Valor total no pipeline - suficiente para bater a meta?",
            "Deals parados - quais precisam de ação urgente?",
            "Performance individual (se gestor) - quem precisa de coaching?",
          ],
        },
        {
          title: "6. Colabore em equipe",
          content: "CRM não é só para rastrear deals - é para colaboração. Use comentários internos, mencione colegas (@nome), compartilhe aprendizados sobre clientes.",
        },
        {
          title: "7. Integre com suas outras ferramentas",
          content: "Não crie silos. Integre o Sirius com email, calendário, WhatsApp, automações (N8N). Quanto mais conectado, menos trabalho manual e mais tempo vendendo.",
        },
        {
          title: "8. Revise deals perdidos mensalmente",
          content: "Analise os motivos de perda mais comuns. Se 'Preço muito alto' aparece com frequência, talvez seu posicionamento precisa melhorar. Se 'Ghosting' é comum, trabalhe em follow-up.",
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "Introduction",
          content: "A CRM is just a tool. What really generates results is how you use it. Here are the best practices compiled from hundreds of successful sales teams using Sirius CRM.",
        },
        {
          title: "1. Update the pipeline daily",
          content: "An outdated pipeline means wrong decisions. Commit to updating your deals every day, ideally at the end of the workday.",
          tips: [
            "Reserve 15 minutes at the end of the day to update all deals",
            "Move deals that have progressed",
            "Mark deals stalled for 60+ days as lost",
            "Add notes about important interactions",
          ],
        },
        {
          title: "2. Follow a consistent process",
          content: "Customize pipeline stages to reflect your real process, then follow that process consistently for all deals. This produces reliable data and predictable processes.",
        },
        {
          title: "3. Qualify before over-prospecting",
          content: "Quality > Quantity. It is better to have 20 highly qualified deals than 200 cold leads. Use frameworks like BANT or MEDDIC to qualify before investing time.",
          tips: [
            "Ask about Budget, Authority, Need, and Timeline early",
            "Disqualify fast — don't waste time on bad leads",
            "Focus energy on deals with the highest probability of closing",
          ],
        },
        {
          title: "4. Use automations strategically",
          content: "Automate basic follow-ups, but keep the human touch for critical interactions. Proposal confirmation email? Automate. Final negotiation? Personal call.",
        },
        {
          title: "5. Analyze metrics weekly",
          content: "Reserve 1 hour every Monday to review:",
          steps: [
            "Conversion rate by stage — where is the bottleneck?",
            "Average time in each stage — any stage getting stuck?",
            "Total pipeline value — enough to hit target?",
            "Stalled deals — which ones need urgent action?",
            "Individual performance (if manager) — who needs coaching?",
          ],
        },
        {
          title: "6. Collaborate as a team",
          content: "CRM is not just for tracking deals — it is for collaboration. Use internal comments, mention colleagues (@name), share learnings about clients.",
        },
        {
          title: "7. Integrate with your other tools",
          content: "Don't create silos. Integrate Sirius with email, calendar, WhatsApp, and automations (N8N). The more connected, the less manual work and more time selling.",
        },
        {
          title: "8. Review lost deals monthly",
          content: "Analyze the most common loss reasons. If 'Price too high' appears often, maybe your positioning needs work. If 'Ghosting' is common, improve your follow-up.",
        },
      ],
    },
  },

  {
    title: "Troubleshooting: problemas comuns e soluções",
    slug: "troubleshooting",
    category: "Primeiros Passos",
    categorySlug: "primeiros-passos",
    description: "Soluções para os problemas mais comuns no Sirius CRM",
    titleEn: "Troubleshooting: Common Problems and Solutions",
    descriptionEn: "Solutions for the most common issues in Sirius CRM",
    lastUpdated: "2024-01-23",
    readTime: "4 min",
    content: {
      sections: [
        {
          title: "Problema: Não consigo fazer login",
          content: "Se você não consegue acessar sua conta:",
          steps: [
            "Verifique se está usando o email correto (mesmo usado no cadastro)",
            "Tente redefinir a senha clicando em 'Esqueci minha senha'",
            "Verifique sua caixa de spam - o email pode ter ido para lá",
            "Limpe o cache do navegador (Ctrl+Shift+Delete)",
            "Tente em navegador diferente ou modo anônimo",
            "Se ainda não funcionar, contate suporte@siriuscrm.com.br",
          ],
        },
        {
          title: "Problema: Deals não estão aparecendo",
          content: "Se você não vê seus deals no pipeline:",
          steps: [
            "Verifique os filtros ativos no topo - pode estar filtrando sem perceber",
            "Se você é Member, só vê seus próprios deals - fale com Admin para ver todos",
            "Verifique se está no pipeline correto (use seletor de pipeline)",
            "Atualize a página (F5)",
            "Verifique sua conexão de internet",
          ],
        },
        {
          title: "Problema: Erro ao criar deal",
          content: "Se der erro ao salvar um deal:",
          tips: [
            "Verifique se preencheu todos os campos obrigatórios (título e contato)",
            "O valor deve ser um número válido",
            "Se o erro persistir, tente criar sem custom fields primeiro",
            "Reporte o erro para o suporte com screenshot",
          ],
        },
        {
          title: "Problema: Notificações não chegam",
          content: "Se você não está recebendo notificações:",
          steps: [
            "Vá em Configurações > Notificações e verifique se estão ativadas",
            "Verifique a caixa de spam do seu email",
            "Para notificações push, confirme permissão no navegador",
            "Teste com uma ação simples (crie um deal) e veja se notifica",
          ],
        },
        {
          title: "Problema: Integração não funciona",
          content: "Para problemas com integrações (WhatsApp, Google Calendar, API):",
          steps: [
            "Revogue e reconecte a integração",
            "Verifique se deu todas as permissões necessárias",
            "Para API, confirme que a API key está correta e ativa",
            "Veja logs de integração em Configurações > Integrações > Logs",
            "Contate suporte se o problema persistir",
          ],
        },
        {
          title: "Problema: Performance lenta",
          content: "Se o CRM está lento:",
          tips: [
            "Limpe cache do navegador",
            "Desative extensões de navegador temporariamente",
            "Verifique sua conexão de internet",
            "Se tem milhares de deals, use filtros para reduzir dados carregados",
            "Tente em outro navegador (Chrome recomendado)",
          ],
        },
        {
          title: "Ainda com problemas?",
          content: "Se nenhuma solução acima resolver, entre em contato com nosso suporte: suporte@siriuscrm.com.br ou abra um chat dentro do sistema. Inclua screenshots e descrição detalhada do problema.",
        },
      ],
    },
    contentEn: {
      sections: [
        {
          title: "Problem: Cannot log in",
          content: "If you cannot access your account:",
          steps: [
            "Check that you are using the correct email (same one used to sign up)",
            "Try resetting your password by clicking 'Forgot my password'",
            "Check your spam folder — the email may have landed there",
            "Clear browser cache (Ctrl+Shift+Delete)",
            "Try a different browser or incognito mode",
            "If it still does not work, contact support@siriuscrm.com.br",
          ],
        },
        {
          title: "Problem: Deals are not showing",
          content: "If you cannot see your deals in the pipeline:",
          steps: [
            "Check active filters at the top — you may be filtering without realizing it",
            "If you are a Member, you only see your own deals — ask an Admin to see all",
            "Check that you are on the correct pipeline (use the pipeline selector)",
            "Refresh the page (F5)",
            "Check your internet connection",
          ],
        },
        {
          title: "Problem: Error creating a deal",
          content: "If you get an error saving a deal:",
          tips: [
            "Check that all required fields are filled in (title and contact)",
            "The value must be a valid number",
            "If the error persists, try creating without custom fields first",
            "Report the error to support with a screenshot",
          ],
        },
        {
          title: "Problem: Notifications not arriving",
          content: "If you are not receiving notifications:",
          steps: [
            "Go to Settings > Notifications and check they are enabled",
            "Check your email spam folder",
            "For push notifications, confirm browser permission is granted",
            "Test with a simple action (create a deal) and see if it notifies",
          ],
        },
        {
          title: "Problem: Integration not working",
          content: "For issues with integrations (WhatsApp, Google Calendar, API):",
          steps: [
            "Revoke and reconnect the integration",
            "Check that you granted all necessary permissions",
            "For API issues, confirm the API key is correct and active",
            "Check integration logs at Settings > Integrations > Logs",
            "Contact support if the problem persists",
          ],
        },
        {
          title: "Problem: Slow performance",
          content: "If the CRM is slow:",
          tips: [
            "Clear browser cache",
            "Temporarily disable browser extensions",
            "Check your internet connection",
            "If you have thousands of deals, use filters to reduce loaded data",
            "Try another browser (Chrome recommended)",
          ],
        },
        {
          title: "Still having issues?",
          content: "If none of the above resolves the issue, contact our support at support@siriuscrm.com.br or open a chat inside the system. Include screenshots and a detailed description of the problem.",
        },
      ],
    },
  },
];

// Helper functions
export function getArticle(categorySlug: string, articleSlug: string): HelpArticle | undefined {
  return helpArticles.find(
    article => article.categorySlug === categorySlug && article.slug === articleSlug
  );
}

export function getArticlesByCategory(categorySlug: string): HelpArticle[] {
  return helpArticles.filter(article => article.categorySlug === categorySlug);
}

export function getAllCategories(): { slug: string; name: string; count: number }[] {
  const categories = new Map<string, { name: string; count: number }>();

  helpArticles.forEach(article => {
    if (!categories.has(article.categorySlug)) {
      categories.set(article.categorySlug, { name: article.category, count: 0 });
    }
    const category = categories.get(article.categorySlug)!;
    category.count++;
  });

  return Array.from(categories.entries()).map(([slug, data]) => ({
    slug,
    name: data.name,
    count: data.count,
  }));
}
