const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, '..');

const en = JSON.parse(fs.readFileSync(path.join(base, 'messages/en/marketing.json'), 'utf8'));
const ptBR = JSON.parse(fs.readFileSync(path.join(base, 'messages/pt-BR/marketing.json'), 'utf8'));

ptBR.founders = {
  meta: {
    title: 'Programa de Fundadores | Sirius CRM — 42% OFF vitalício',
    description: 'Seja um dos fundadores do Sirius CRM. Starter R$39, Pro R$87 ou Business R$234/mês para sempre. Até 42% de desconto vitalício em qualquer plano.',
    ogTitle: 'Programa de Fundadores | Sirius CRM — 42% OFF vitalício',
    ogDescription: 'Starter R$39, Pro R$87 ou Business R$234/mês para sempre. Vagas limitadas.'
  },
  hero: {
    badge: 'Programa de Fundadores — Vagas Limitadas',
    title: 'Seja Fundador do Sirius CRM',
    subtitle_bold: 'Até 42% de desconto vitalício',
    subtitle_text: 'em qualquer plano. Seu preço nunca muda — mesmo quando os planos subirem.',
    social_proof: 'pessoas já garantiram seu desconto vitalício · Vagas esgotando rapidamente'
  },
  tiers: {
    starter: {
      name: 'Fundador Starter', short_name: 'Starter',
      price_label: '/mês para sempre', discount_badge: '~41% OFF vitalício',
      spots_label: 'Vagas preenchidas', spots_remaining: 'vagas restantes', sold_out: 'Esgotado',
      badge: '⚡ Mais Popular',
      features: ['1.000 Contatos','500 Negócios ativos','5 Pipelines Kanban','Até 5 usuários','1 instância WhatsApp','75 créditos de prospecção/mês','1 Agente IA autônomo','200 ações autônomas/mês','Suporte por e-mail']
    },
    pro: {
      name: 'Fundador Pro', short_name: 'Pro',
      price_label: '/mês para sempre', discount_badge: '~41% OFF vitalício',
      spots_label: 'Vagas preenchidas', spots_remaining: 'vagas restantes', sold_out: 'Esgotado',
      badge: '⚡ Mais Popular',
      features: ['5.000 Contatos','2.500 Negócios ativos','15 Pipelines Kanban','Até 15 usuários','3 instâncias WhatsApp','300 créditos de prospecção/mês','3 Agentes IA autônomos','1.000 ações autônomas/mês','Webhooks + API pública','Analytics avançado','Suporte prioritário']
    },
    business: {
      name: 'Fundador Business', short_name: 'Business',
      price_label: '/mês para sempre', discount_badge: '~41% OFF vitalício',
      spots_label: 'Vagas preenchidas', spots_remaining: 'vagas restantes', sold_out: 'Esgotado',
      badge: '⚡ Mais Popular',
      features: ['Contatos Ilimitados','Negócios Ilimitados','50 Pipelines Kanban','Até 50 usuários','5 instâncias WhatsApp','1.500 créditos de prospecção/mês','5 Agentes IA autônomos','3.000 ações autônomas/mês','Round-Robin de leads','Relatórios personalizados','SSO & Audit Log','Gerente de conta dedicado']
    }
  },
  security: 'Pagamento seguro via Mercado Pago · PIX, cartão (12x) ou boleto · Cancele a qualquer momento',
  perks: {
    title: 'Benefícios exclusivos do Fundador',
    perk1: 'Badge exclusivo "Fundador #N" no dashboard',
    perk2: 'Preço nunca aumenta — garantido para sempre',
    perk3: 'Acesso antecipado a todas as novas funcionalidades',
    perk4: 'Canal direto com os fundadores da ROI Labs no WhatsApp',
    perk5: 'Prioridade máxima no roadmap e feature requests'
  },
  comparison: {
    title: 'Comparação de Preço',
    header_plan: 'Plano', header_regular: 'Preço Regular',
    header_founder: 'Preço Fundador', header_savings: 'Economia/ano'
  },
  faq: {
    title: 'Perguntas Frequentes',
    q1: 'O desconto é realmente para sempre?',
    a1: 'Sim. Como Fundador, seu preço nunca muda — independente do quanto o plano suba no futuro. O desconto vitalício é garantido contratualmente.',
    q2: 'Posso mudar de plano fundador depois?',
    a2: 'Não é possível fazer downgrade após a compra, mas você pode fazer upgrade para um tier fundador superior enquanto ainda tiver vagas disponíveis.',
    q3: 'O que acontece quando as vagas esgotam?',
    a3: 'O programa encerra para aquele tier e o preço volta ao regular. Não haverá exceções após o encerramento.',
    q4: 'Tenho acesso imediato?',
    a4: 'Sim. Após o pagamento ser aprovado, sua conta é atualizada instantaneamente e você recebe o badge de Fundador.',
    q5: 'Posso cancelar quando quiser?',
    a5: 'Sim, sem multas ou fidelidade. Se cancelar e quiser retornar, o preço será o regular vigente naquele momento.'
  },
  cta: { doubt: 'Ainda em dúvida? Vagas são limitadas.', button: 'Ver planos disponíveis' }
};

en.founders = {
  meta: {
    title: 'Founders Program | Sirius CRM — 42% OFF for life',
    description: 'Become a founder of Sirius CRM. Starter R$39, Pro R$87, or Business R$234/month forever. Up to 42% lifetime discount on any plan.',
    ogTitle: 'Founders Program | Sirius CRM — 42% OFF for life',
    ogDescription: 'Starter R$39, Pro R$87, or Business R$234/month forever. Limited spots.'
  },
  hero: {
    badge: 'Founders Program — Limited Spots',
    title: 'Become a Founder of Sirius CRM',
    subtitle_bold: 'Up to 42% lifetime discount',
    subtitle_text: 'on any plan. Your price never changes — even when plans increase.',
    social_proof: 'people have already locked in their lifetime discount · Spots filling up fast'
  },
  tiers: {
    starter: {
      name: 'Founder Starter', short_name: 'Starter',
      price_label: '/month forever', discount_badge: '~41% OFF for life',
      spots_label: 'Spots filled', spots_remaining: 'spots remaining', sold_out: 'Sold Out',
      badge: '⚡ Most Popular',
      features: ['1,000 Contacts','500 Active Deals','5 Kanban Pipelines','Up to 5 Users','1 WhatsApp Instance','75 Prospecting Credits/Month','1 Autonomous AI Agent','200 Autonomous Actions/Month','Email Support']
    },
    pro: {
      name: 'Founder Pro', short_name: 'Pro',
      price_label: '/month forever', discount_badge: '~41% OFF for life',
      spots_label: 'Spots filled', spots_remaining: 'spots remaining', sold_out: 'Sold Out',
      badge: '⚡ Most Popular',
      features: ['5,000 Contacts','2,500 Active Deals','15 Kanban Pipelines','Up to 15 Users','3 WhatsApp Instances','300 Prospecting Credits/Month','3 Autonomous AI Agents','1,000 Autonomous Actions/Month','Webhooks + Public API','Advanced Analytics','Priority Support']
    },
    business: {
      name: 'Founder Business', short_name: 'Business',
      price_label: '/month forever', discount_badge: '~41% OFF for life',
      spots_label: 'Spots filled', spots_remaining: 'spots remaining', sold_out: 'Sold Out',
      badge: '⚡ Most Popular',
      features: ['Unlimited Contacts','Unlimited Deals','50 Kanban Pipelines','Up to 50 Users','5 WhatsApp Instances','1,500 Prospecting Credits/Month','5 Autonomous AI Agents','3,000 Autonomous Actions/Month','Lead Round-Robin','Custom Reports','SSO & Audit Log','Dedicated Account Manager']
    }
  },
  security: 'Secure payment via Mercado Pago · PIX, credit card (12x), or bank transfer · Cancel anytime',
  perks: {
    title: 'Exclusive Founder Benefits',
    perk1: 'Exclusive "Founder #N" badge on dashboard',
    perk2: 'Price never increases — guaranteed for life',
    perk3: 'Early access to all new features',
    perk4: 'Direct channel with ROI Labs founders on WhatsApp',
    perk5: 'Maximum priority on roadmap and feature requests'
  },
  comparison: {
    title: 'Price Comparison',
    header_plan: 'Plan', header_regular: 'Regular Price',
    header_founder: 'Founder Price', header_savings: 'Savings/Year'
  },
  faq: {
    title: 'Frequently Asked Questions',
    q1: 'Is the discount really for life?',
    a1: 'Yes. As a Founder, your price never changes — no matter how much the plan increases in the future. The lifetime discount is contractually guaranteed.',
    q2: 'Can I change founder plans later?',
    a2: 'You cannot downgrade after purchase, but you can upgrade to a higher founder tier as long as spots are available.',
    q3: 'What happens when spots run out?',
    a3: 'The program closes for that tier and pricing returns to regular. There will be no exceptions after closure.',
    q4: 'Do I have immediate access?',
    a4: 'Yes. Once payment is approved, your account is updated instantly and you receive your Founder badge.',
    q5: 'Can I cancel anytime?',
    a5: 'Yes, with no penalties or commitment. If you cancel and want to return later, you will pay the regular price at that time.'
  },
  cta: { doubt: 'Still unsure? Spots are limited.', button: 'View available plans' }
};

fs.writeFileSync(path.join(base, 'messages/en/marketing.json'), JSON.stringify(en, null, 2));
fs.writeFileSync(path.join(base, 'messages/pt-BR/marketing.json'), JSON.stringify(ptBR, null, 2));
console.log('Founders translations added.');
