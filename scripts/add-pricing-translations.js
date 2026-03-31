const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..');

const en = JSON.parse(fs.readFileSync(path.join(base, 'messages/en/marketing.json'), 'utf8'));
const ptBR = JSON.parse(fs.readFileSync(path.join(base, 'messages/pt-BR/marketing.json'), 'utf8'));

en.pricing = {
  badge: "Free trial — unlimited time",
  tagline: "Transparent Pricing",
  title: "Pay only when you scale",
  subtitle: "Start free today and upgrade when your team grows. No surprises, no hidden fees.",
  founders: {
    badge: "Founders Program — up to 42% OFF for life!",
    details: "Starter R$39 · Pro R$87 · Business R$234/month forever. Limited spots.",
    cta: "View offer"
  },
  tiers: {
    free: {
      name: "Free",
      price_monthly: "Free",
      price_annual: "Free",
      description: "To test and organize your sales.",
      features: ["Up to 2 Users","250 Contacts","100 Active Deals","1 Kanban Pipeline","Community Support"]
    },
    starter: {
      name: "Starter",
      price_monthly: "R$ 67",
      price_annual: "R$ 53.60",
      description: "For small businesses that want to grow.",
      features: ["Up to 5 Users","1,000 Contacts","500 Active Deals","5 Kanban Pipelines","1 WhatsApp instance","75 prospecting credits/month","1 Autonomous AI Agent (Sofia)","200 autonomous actions/month","Email support"]
    },
    pro: {
      name: "Pro",
      price_monthly: "R$ 147",
      price_annual: "R$ 117.60",
      description: "For growing teams that need more.",
      features: ["Up to 15 Users","5,000 Contacts","2,500 Active Deals","15 Kanban Pipelines","3 WhatsApp instances","300 prospecting credits/month","3 Autonomous AI Agents (Sofia)","1,000 autonomous actions/month","Advanced Analytics","Webhooks + Public API","Priority support"]
    },
    business: {
      name: "Business",
      price_monthly: "R$ 397",
      price_annual: "R$ 317.60",
      description: "For large operations with maximum scale.",
      features: ["Up to 50 Users","Unlimited Contacts","Unlimited Deals","50 Kanban Pipelines","5 WhatsApp instances","1,500 prospecting credits/month","5 Autonomous AI Agents (Sofia)","3,000 autonomous actions/month","Lead round-robin","Custom reports","SSO & Audit Log","Dedicated account manager"]
    }
  },
  mostPopular: "⚡ Most Popular",
  perMonth: "/month",
  billedAnnually: "Billed annually",
  getStarted: "Get Started",
  guarantee: "7-day guarantee — 100% money back",
  enterprise: {
    name: "Enterprise",
    description: "Need more? Custom limits, dedicated SLA, assisted onboarding and white-glove support.",
    cta: "Talk to Sales"
  },
  roi: {
    title: "Calculate your ROI",
    subtitle: "See how much you save in time and increase in revenue",
    stat1Value: "3h",
    stat1Label: "Saved per salesperson/week",
    stat2Value: "+25%",
    stat2Label: "Increase in conversion rate",
    stat3Value: "R$ 147",
    stat3Label: "Monthly investment (Pro)",
    note: "With 5 salespeople: 15h saved/week = ~R$ 3,000/month in productivity"
  },
  calculators: {
    title: "Calculate ROI for your segment",
    subtitle: "Free tools to project the return of Sirius CRM in your business"
  },
  faq: {
    title: "Frequently Asked Questions",
    q1: "Can I change plans later?",
    a1: "Yes! You can upgrade or downgrade at any time. We adjust the amount proportionally.",
    q2: "How does the free plan work?",
    a2: "100% functional, with no expiration date. Perfect for validating the CRM before scaling your team.",
    q3: "Do I need a card to start?",
    a3: "No! The Free plan is free forever, no card needed. We only ask for one when you want to upgrade.",
    q4: "Can I cancel whenever I want?",
    a4: "Yes, no fines or fees. Cancel at any time and keep access until the end of the paid period.",
    q5: "How does the 7-day guarantee work?",
    a5: "Try any paid plan risk-free! If you do not like it in the first 7 days, we return 100% of your money, no questions asked.",
    q6: "How do the AI agents (Sofia) work?",
    a6: "Sofia agents operate your CRM autonomously: qualify leads, follow up, schedule meetings and move deals in the pipeline. You supervise and approve actions via the /IA panel. Available from the Starter plan.",
    q7: "Is my data safe?",
    a7: "Completely. We use end-to-end encryption and host on certified servers.",
    q8: "Is there English support?",
    a8: "Yes! We offer support in English and Portuguese. Pro and Business plans get priority."
  },
  finalCta: {
    title: "Still have questions?",
    subtitle: "Talk to our sales team and get all your questions answered",
    btnPrimary: "Get Started Free",
    btnSecondary: "Talk to Sales"
  }
};

ptBR.pricing = {
  badge: "Teste grátis por tempo ilimitado",
  tagline: "Preços Transparentes",
  title: "Pague apenas quando escalar",
  subtitle: "Comece grátis hoje e faça upgrade quando seu time crescer. Sem surpresas, sem taxas escondidas.",
  founders: {
    badge: "Programa de Fundadores — até 42% OFF vitalício!",
    details: "Starter R$39 · Pro R$87 · Business R$234/mês para sempre. Vagas limitadas.",
    cta: "Ver oferta"
  },
  tiers: {
    free: {
      name: "Gratuito",
      price_monthly: "Grátis",
      price_annual: "Grátis",
      description: "Para testar e organizar suas vendas.",
      features: ["Até 2 Usuários","250 Contatos","100 Negócios ativos","1 Pipeline Kanban","Suporte via Comunidade"]
    },
    starter: {
      name: "Starter",
      price_monthly: "R$ 67",
      price_annual: "R$ 53,60",
      description: "Para pequenas empresas que querem crescer.",
      features: ["Até 5 Usuários","1.000 Contatos","500 Negócios ativos","5 Pipelines Kanban","1 instância WhatsApp","75 créditos de prospecção/mês","1 Agente IA autônomo (Sofia)","200 ações autônomas/mês","Suporte por e-mail"]
    },
    pro: {
      name: "Pro",
      price_monthly: "R$ 147",
      price_annual: "R$ 117,60",
      description: "Para equipes em crescimento que precisam de mais.",
      features: ["Até 15 Usuários","5.000 Contatos","2.500 Negócios ativos","15 Pipelines Kanban","3 instâncias WhatsApp","300 créditos de prospecção/mês","3 Agentes IA autônomos (Sofia)","1.000 ações autônomas/mês","Analytics avançado","Webhooks + API pública","Suporte prioritário"]
    },
    business: {
      name: "Business",
      price_monthly: "R$ 397",
      price_annual: "R$ 317,60",
      description: "Para grandes operações com máxima escala.",
      features: ["Até 50 Usuários","Contatos Ilimitados","Negócios Ilimitados","50 Pipelines Kanban","5 instâncias WhatsApp","1.500 créditos de prospecção/mês","5 Agentes IA autônomos (Sofia)","3.000 ações autônomas/mês","Round-Robin de leads","Relatórios personalizados","SSO & Audit Log","Gerente de conta dedicado"]
    }
  },
  mostPopular: "⚡ Mais Popular",
  perMonth: "/mês",
  billedAnnually: "Cobrado anualmente",
  getStarted: "Começar Agora",
  guarantee: "Garantia de 7 dias - 100% do seu dinheiro de volta",
  enterprise: {
    name: "Enterprise",
    description: "Precisa de mais? Limites customizados, SLA dedicado, onboarding assistido e suporte white-glove.",
    cta: "Fale com Vendas"
  },
  roi: {
    title: "Calcule seu ROI",
    subtitle: "Veja quanto você economiza em tempo e aumenta em receita",
    stat1Value: "3h",
    stat1Label: "Economizadas por vendedor/semana",
    stat2Value: "+25%",
    stat2Label: "Aumento em taxa de conversão",
    stat3Value: "R$ 147",
    stat3Label: "Investimento mensal (Pro)",
    note: "Com 5 vendedores: 15h economizadas/semana = ~R$ 3.000/mês em produtividade"
  },
  calculators: {
    title: "Calcule o ROI para o seu segmento",
    subtitle: "Ferramentas gratuitas para projetar o retorno do Sirius CRM no seu negócio"
  },
  faq: {
    title: "Perguntas Frequentes",
    q1: "Posso trocar de plano depois?",
    a1: "Sim! Você pode fazer upgrade ou downgrade a qualquer momento. Ajustamos o valor proporcionalmente.",
    q2: "Como funciona o plano gratuito?",
    a2: "100% funcional, sem prazo de expiração. Perfeito para validar o CRM antes de escalar seu time.",
    q3: "Preciso de cartão para começar?",
    a3: "Não! O plano Gratuito é para sempre, sem cartão. Só pedimos quando você quiser fazer upgrade.",
    q4: "Posso cancelar quando quiser?",
    a4: "Sem multas ou taxas. Cancele a qualquer momento e mantenha acesso até o fim do período pago.",
    q5: "Como funciona a garantia de 7 dias?",
    a5: "Teste qualquer plano pago sem risco! Se não gostar nos primeiros 7 dias, devolvemos 100% do seu dinheiro, sem perguntas.",
    q6: "Como funcionam os agentes IA (Sofia)?",
    a6: "Os agentes Sofia operam seu CRM autonomamente: qualificam leads, fazem follow-up, agendam reuniões e movem deals no pipeline. Você supervisiona e aprova as ações pelo painel /IA. Disponível a partir do plano Starter.",
    q7: "Meus dados ficam seguros?",
    a7: "Totalmente. Usamos criptografia de ponta a ponta e hospedamos em servidores certificados no Brasil.",
    q8: "Tem suporte em português?",
    a8: "Sim! Todo o suporte é em português, com times brasileiros. Planos Pro e Business têm prioridade."
  },
  finalCta: {
    title: "Ainda tem dúvidas?",
    subtitle: "Fale com nosso time de vendas e tire todas as suas dúvidas",
    btnPrimary: "Começar Grátis",
    btnSecondary: "Falar com Vendas"
  }
};

fs.writeFileSync(path.join(base, 'messages/en/marketing.json'), JSON.stringify(en, null, 2));
fs.writeFileSync(path.join(base, 'messages/pt-BR/marketing.json'), JSON.stringify(ptBR, null, 2));
console.log('Pricing translations added to both locales.');
