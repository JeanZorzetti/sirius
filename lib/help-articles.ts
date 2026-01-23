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
  },

  {
    title: "Como cadastrar e gerenciar contatos",
    slug: "cadastrar-contatos",
    category: "Contatos",
    categorySlug: "contatos",
    description: "Aprenda a criar e organizar seus contatos no Sirius CRM",
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
  },

  {
    title: "Criando múltiplos pipelines",
    slug: "multiplos-pipelines",
    category: "Pipeline e Negócios",
    categorySlug: "pipeline-negocios",
    description: "Como gerenciar diferentes fluxos de venda com múltiplos pipelines (recurso PRO)",
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
  },

  {
    title: "Configurando automações de email",
    slug: "automacoes-email",
    category: "Automações",
    categorySlug: "automacoes",
    description: "Aprenda a criar automações inteligentes baseadas nas etapas do pipeline (PRO)",
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
  },

  {
    title: "Entendendo o Analytics básico",
    slug: "analytics-basico",
    category: "Analytics e Relatórios",
    categorySlug: "analytics",
    description: "Aprenda a interpretar as métricas essenciais do seu funil de vendas",
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
  },

  {
    title: "Integração com WhatsApp",
    slug: "integracao-whatsapp",
    category: "Integrações",
    categorySlug: "integracoes",
    description: "Como usar a integração nativa com WhatsApp para contatar seus leads",
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
  },

  {
    title: "Sincronizando com Google Calendar",
    slug: "google-calendar",
    category: "Integrações",
    categorySlug: "integracoes",
    description: "Conecte seu Google Calendar para sincronizar reuniões e follow-ups",
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
  },

  {
    title: "Gerenciando permissões de equipe",
    slug: "permissoes-equipe",
    category: "Equipe e Configurações",
    categorySlug: "equipe",
    description: "Como adicionar usuários e configurar níveis de acesso (PRO)",
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
  },

  {
    title: "Diferenças entre plano FREE e PRO",
    slug: "free-vs-pro",
    category: "Planos e Billing",
    categorySlug: "planos",
    description: "Entenda os recursos disponíveis em cada plano e quando fazer upgrade",
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
  },

  {
    title: "Importando contatos via CSV",
    slug: "importar-contatos-csv",
    category: "Contatos",
    categorySlug: "contatos",
    description: "Como importar múltiplos contatos de uma vez usando planilha",
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
  },

  {
    title: "Usando filtros e busca avançada",
    slug: "filtros-busca",
    category: "Pipeline e Negócios",
    categorySlug: "pipeline-negocios",
    description: "Aprenda a filtrar deals por vendedor, período, valor e outros critérios",
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
  },

  {
    title: "Marcando deals como perdidos",
    slug: "deals-perdidos",
    category: "Pipeline e Negócios",
    categorySlug: "pipeline-negocios",
    description: "Como e quando marcar um negócio como perdido e analisar motivos",
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
  },

  {
    title: "Configurando notificações",
    slug: "configurar-notificacoes",
    category: "Equipe e Configurações",
    categorySlug: "equipe",
    description: "Personalize quais notificações você quer receber e por qual canal",
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
  },

  {
    title: "Usando a API do Sirius CRM",
    slug: "usando-api",
    category: "Integrações",
    categorySlug: "integracoes",
    description: "Como gerar chaves de API e integrar o Sirius com sistemas externos",
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
  },

  {
    title: "Integrando com N8N (automação low-code)",
    slug: "integracao-n8n",
    category: "Integrações",
    categorySlug: "integracoes",
    description: "Como conectar o Sirius CRM com N8N para criar workflows avançados",
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
            "Configure a URL base: https://sirius.roilabs.com.br/api",
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
  },

  {
    title: "Exportando dados para análise",
    slug: "exportar-dados",
    category: "Analytics e Relatórios",
    categorySlug: "analytics",
    description: "Como exportar seus deals e contatos para Excel ou CSV (PRO)",
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
  },

  {
    title: "Configurando seu perfil e preferências",
    slug: "configurar-perfil",
    category: "Equipe e Configurações",
    categorySlug: "equipe",
    description: "Personalize suas informações de perfil e preferências do sistema",
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
  },

  {
    title: "Analytics PRO: Forecasting de vendas",
    slug: "forecasting-vendas",
    category: "Analytics e Relatórios",
    categorySlug: "analytics",
    description: "Como usar o forecasting para prever faturamento e bater metas (PRO)",
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
  },

  {
    title: "Personalizando etapas do pipeline",
    slug: "personalizar-etapas",
    category: "Pipeline e Negócios",
    categorySlug: "pipeline-negocios",
    description: "Como criar, editar e reordenar etapas do seu pipeline",
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
  },

  {
    title: "Gerenciando assinatura e pagamentos",
    slug: "gerenciar-assinatura",
    category: "Planos e Billing",
    categorySlug: "planos",
    description: "Como atualizar forma de pagamento, mudar plano e cancelar assinatura",
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
  },

  {
    title: "Adicionando tags e custom fields",
    slug: "tags-custom-fields",
    category: "Pipeline e Negócios",
    categorySlug: "pipeline-negocios",
    description: "Como usar tags e campos customizados para organizar seus deals",
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
  },

  {
    title: "Atalhos de teclado do Sirius CRM",
    slug: "atalhos-teclado",
    category: "Primeiros Passos",
    categorySlug: "primeiros-passos",
    description: "Aumente sua produtividade com atalhos de teclado essenciais",
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
  },

  {
    title: "Melhores práticas de gestão de vendas",
    slug: "melhores-praticas-vendas",
    category: "Primeiros Passos",
    categorySlug: "primeiros-passos",
    description: "Dicas e estratégias para maximizar resultados com o Sirius CRM",
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
  },

  {
    title: "Troubleshooting: problemas comuns e soluções",
    slug: "troubleshooting",
    category: "Primeiros Passos",
    categorySlug: "primeiros-passos",
    description: "Soluções para os problemas mais comuns no Sirius CRM",
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
            "Se ainda não funcionar, contate suporte@sirius.roilabs.com.br",
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
          content: "Se nenhuma solução acima resolver, entre em contato com nosso suporte: suporte@sirius.roilabs.com.br ou abra um chat dentro do sistema. Inclua screenshots e descrição detalhada do problema.",
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
