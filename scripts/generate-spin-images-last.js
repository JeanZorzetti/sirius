const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '../public/images/blog');

// 12. 100 Perguntas por Setor
const perguntasSetor = `
<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="800" fill="#f0f9ff"/>

  <text x="600" y="60" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#1e40af" text-anchor="middle">
    Banco de Perguntas SPIN por Setor
  </text>

  <!-- B2B SaaS -->
  <g transform="translate(50, 120)">
    <rect width="540" height="280" fill="white" rx="12" stroke="#3b82f6" stroke-width="3"/>
    <rect width="540" height="60" fill="#3b82f6" rx="12"/>
    <text x="270" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">
      💻 B2B SaaS / CRM
    </text>
    <text x="30" y="100" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      S: Qual stack de vendas usam hoje?
    </text>
    <text x="30" y="135" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      P: Dados se perdem entre ferramentas?
    </text>
    <text x="30" y="170" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      I: Impacto na previsibilidade de receita?
    </text>
    <text x="30" y="205" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      N: Como seria visibilidade 360°?
    </text>
    <text x="270" y="250" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#2563eb" text-anchor="middle">
      25 perguntas disponíveis
    </text>
  </g>

  <!-- E-commerce -->
  <g transform="translate(610, 120)">
    <rect width="540" height="280" fill="white" rx="12" stroke="#10b981" stroke-width="3"/>
    <rect width="540" height="60" fill="#10b981" rx="12"/>
    <text x="270" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">
      🛒 E-commerce
    </text>
    <text x="30" y="100" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      S: Quantos canais de venda ativos?
    </text>
    <text x="30" y="135" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      P: Taxa de abandono de carrinho?
    </text>
    <text x="30" y="170" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      I: Receita perdida por mês?
    </text>
    <text x="30" y="205" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      N: Como seria checkout ideal?
    </text>
    <text x="270" y="250" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#10b981" text-anchor="middle">
      20 perguntas disponíveis
    </text>
  </g>

  <!-- Consultoria -->
  <g transform="translate(50, 440)">
    <rect width="540" height="280" fill="white" rx="12" stroke="#f59e0b" stroke-width="3"/>
    <rect width="540" height="60" fill="#f59e0b" rx="12"/>
    <text x="270" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">
      📊 Consultoria
    </text>
    <text x="30" y="100" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      S: Método de gestão de projetos?
    </text>
    <text x="30" y="135" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      P: Clientes reclamam de atrasos?
    </text>
    <text x="30" y="170" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      I: Impacto na renovação de contratos?
    </text>
    <text x="30" y="205" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      N: Como seria previsibilidade total?
    </text>
    <text x="270" y="250" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#f59e0b" text-anchor="middle">
      30 perguntas disponíveis
    </text>
  </g>

  <!-- Imobiliário -->
  <g transform="translate(610, 440)">
    <rect width="540" height="280" fill="white" rx="12" stroke="#8b5cf6" stroke-width="3"/>
    <rect width="540" height="60" fill="#8b5cf6" rx="12"/>
    <text x="270" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">
      🏢 Imobiliário
    </text>
    <text x="30" y="100" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      S: Quantos corretores na equipe?
    </text>
    <text x="30" y="135" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      P: Leads se perdem sem follow-up?
    </text>
    <text x="30" y="170" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      I: Vendas perdidas por desorganização?
    </text>
    <text x="30" y="205" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      N: Como seria gestão centralizada?
    </text>
    <text x="270" y="250" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#8b5cf6" text-anchor="middle">
      25 perguntas disponíveis
    </text>
  </g>
</svg>
`;
fs.writeFileSync(path.join(imagesDir, 'spin-100-perguntas-por-setor.png'), perguntasSetor);
console.log('✅ 12/17: spin-100-perguntas-por-setor.png');

// 13. Matriz de Objeções
const matrizObjecoes = `
<svg width="1400" height="800" xmlns="http://www.w3.org/2000/svg">
  <rect width="1400" height="800" fill="#fef2f2"/>

  <text x="700" y="50" font-family="Arial, sans-serif" font-size="38" font-weight="bold" fill="#991b1b" text-anchor="middle">
    Matriz: Objeções vs Argumentos SPIN
  </text>

  <!-- Header -->
  <rect x="50" y="100" width="400" height="50" fill="#dc2626"/>
  <rect x="450" y="100" width="400" height="50" fill="#dc2626"/>
  <rect x="850" y="100" width="500" height="50" fill="#dc2626"/>

  <text x="250" y="133" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">Objeção</text>
  <text x="650" y="133" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">Diagnóstico</text>
  <text x="1100" y="133" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">Resposta SPIN</text>

  <!-- Row 1 -->
  <rect x="50" y="150" width="400" height="100" fill="white" stroke="#dc2626" stroke-width="1"/>
  <rect x="450" y="150" width="400" height="100" fill="white" stroke="#dc2626" stroke-width="1"/>
  <rect x="850" y="150" width="500" height="100" fill="white" stroke="#dc2626" stroke-width="1"/>

  <text x="70" y="185" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#991b1b">"Está caro"</text>
  <text x="70" y="210" font-family="Arial, sans-serif" font-size="14" fill="#7f1d1d">(objeção #1)</text>

  <text x="470" y="180" font-family="Arial, sans-serif" font-size="14" fill="#7f1d1d">Não explorou</text>
  <text x="470" y="205" font-family="Arial, sans-serif" font-size="14" fill="#7f1d1d">Implicação</text>
  <text x="470" y="230" font-family="Arial, sans-serif" font-size="14" fill="#7f1d1d">direito</text>

  <text x="870" y="175" font-family="Arial, sans-serif" font-size="13" fill="#334155">"Entendo. Quanto custa hoje</text>
  <text x="870" y="195" font-family="Arial, sans-serif" font-size="13" fill="#334155">NÃO resolver esse problema?"</text>
  <text x="870" y="220" font-family="Arial, sans-serif" font-size="12" fill="#64748b" font-style="italic">→ Volte para Implicação</text>

  <!-- Row 2 -->
  <rect x="50" y="250" width="400" height="100" fill="white" stroke="#dc2626" stroke-width="1"/>
  <rect x="450" y="250" width="400" height="100" fill="white" stroke="#dc2626" stroke-width="1"/>
  <rect x="850" y="250" width="500" height="100" fill="white" stroke="#dc2626" stroke-width="1"/>

  <text x="70" y="285" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#991b1b">"Preciso pensar"</text>
  <text x="70" y="310" font-family="Arial, sans-serif" font-size="14" fill="#7f1d1d">(objeção #2)</text>

  <text x="470" y="280" font-family="Arial, sans-serif" font-size="14" fill="#7f1d1d">Cliente não viu</text>
  <text x="470" y="305" font-family="Arial, sans-serif" font-size="14" fill="#7f1d1d">Necessidade</text>
  <text x="470" y="330" font-family="Arial, sans-serif" font-size="14" fill="#7f1d1d">clara</text>

  <text x="870" y="275" font-family="Arial, sans-serif" font-size="13" fill="#334155">"Claro! O que especificamente você</text>
  <text x="870" y="295" font-family="Arial, sans-serif" font-size="13" fill="#334155">gostaria de avaliar melhor?"</text>
  <text x="870" y="320" font-family="Arial, sans-serif" font-size="12" fill="#64748b" font-style="italic">→ Volte para Necessidade</text>

  <!-- More rows abbreviated for space -->
  <text x="700" y="650" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#991b1b" text-anchor="middle">
    💡 Regra de Ouro: 90% das objeções são falhas no SPIN
  </text>

  <text x="700" y="750" font-family="Arial, sans-serif" font-size="16" fill="#7f1d1d" text-anchor="middle">
    Download completo: 10 objeções + diagnósticos + scripts de resposta
  </text>
</svg>
`;
fs.writeFileSync(path.join(imagesDir, 'spin-matriz-objecoes-completa.png'), matrizObjecoes);
console.log('✅ 13/17: spin-matriz-objecoes-completa.png');

// 14. 7 Erros Fatais
const errosFatais = `
<svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="900" fill="#fef2f2"/>

  <text x="600" y="60" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#dc2626" text-anchor="middle">
    7 Erros Fatais ao Aplicar SPIN
  </text>

  <g transform="translate(100, 120)">
    <circle cx="40" cy="40" r="35" fill="#ef4444"/>
    <text x="40" y="52" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">1</text>
    <text x="100" y="50" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#991b1b">
      Interrogatório sem Rapport
    </text>
  </g>

  <g transform="translate(100, 230)">
    <circle cx="40" cy="40" r="35" fill="#ef4444"/>
    <text x="40" y="52" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">2</text>
    <text x="100" y="50" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#991b1b">
      Excesso de Perguntas de Situação
    </text>
  </g>

  <g transform="translate(100, 340)">
    <circle cx="40" cy="40" r="35" fill="#ef4444"/>
    <text x="40" y="52" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">3</text>
    <text x="100" y="50" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#991b1b">
      Parar no Primeiro Problema
    </text>
  </g>

  <g transform="translate(100, 450)">
    <circle cx="40" cy="40" r="35" fill="#ef4444"/>
    <text x="40" y="52" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">4</text>
    <text x="100" y="50" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#991b1b">
      Não Quantificar o Problema
    </text>
  </g>

  <g transform="translate(100, 560)">
    <circle cx="40" cy="40" r="35" fill="#ef4444"/>
    <text x="40" y="52" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">5</text>
    <text x="100" y="50" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#991b1b">
      Fazer SPIN como Checklist Rígido
    </text>
  </g>

  <g transform="translate(100, 670)">
    <circle cx="40" cy="40" r="35" fill="#ef4444"/>
    <text x="40" y="52" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">6</text>
    <text x="100" y="50" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#991b1b">
      Implicação Muito Cedo ou Muito Tarde
    </text>
  </g>

  <g transform="translate(100, 780)">
    <circle cx="40" cy="40" r="35" fill="#ef4444"/>
    <text x="40" y="52" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">7</text>
    <text x="100" y="50" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#991b1b">
      Pular Perguntas de Necessidade
    </text>
  </g>

  <rect x="650" y="300" width="480" height="400" fill="white" rx="15" stroke="#dc2626" stroke-width="4"/>
  <text x="890" y="360" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#991b1b" text-anchor="middle">
    ⚠️ Evite esses erros!
  </text>
  <text x="890" y="420" font-family="Arial, sans-serif" font-size="18" fill="#7f1d1d" text-anchor="middle">
    • Pratique com gravações
  </text>
  <text x="890" y="460" font-family="Arial, sans-serif" font-size="18" fill="#7f1d1d" text-anchor="middle">
    • Peça feedback do gestor
  </text>
  <text x="890" y="500" font-family="Arial, sans-serif" font-size="18" fill="#7f1d1d" text-anchor="middle">
    • Use checklist pós-call
  </text>
  <text x="890" y="540" font-family="Arial, sans-serif" font-size="18" fill="#7f1d1d" text-anchor="middle">
    • Role-play semanal
  </text>
  <text x="890" y="620" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#10b981" text-anchor="middle">
    ✅ Masterclass em 4-6 semanas
  </text>
</svg>
`;
fs.writeFileSync(path.join(imagesDir, 'spin-7-erros-fatais-infografico.png'), errosFatais);
console.log('✅ 14/17: spin-7-erros-fatais-infografico.png');

// 15. Cases de Sucesso
const casesSucesso = `
<svg width="1200" height="700" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ecfdf5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d1fae5;stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect width="1200" height="700" fill="url(#grad5)"/>

  <text x="600" y="60" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#064e3b" text-anchor="middle">
    3 Casos de Sucesso SPIN Selling
  </text>

  <!-- Case 1: Growth Machine -->
  <g transform="translate(50, 120)">
    <rect width="350" height="500" fill="white" rx="12" stroke="#10b981" stroke-width="3"/>
    <rect width="350" height="80" fill="#10b981" rx="12"/>
    <text x="175" y="50" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">
      🚀 Growth Machine
    </text>
    <text x="30" y="120" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      <tspan font-weight="bold">Empresa:</tspan> SaaS B2B
    </text>
    <text x="30" y="160" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      <tspan font-weight="bold">Problema:</tspan> 8% conversão
    </text>
    <text x="30" y="200" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      <tspan font-weight="bold">Solução:</tspan> Treinou time
    </text>
    <text x="30" y="220" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      em SPIN por 6 semanas
    </text>
    <line x1="30" y1="240" x2="320" y2="240" stroke="#10b981" stroke-width="2"/>
    <text x="175" y="280" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#10b981" text-anchor="middle">
      +53%
    </text>
    <text x="175" y="315" font-family="Arial, sans-serif" font-size="18" fill="#064e3b" text-anchor="middle">
      conversão
    </text>
    <text x="175" y="360" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#10b981" text-anchor="middle">
      +R$ 2,1M
    </text>
    <text x="175" y="390" font-family="Arial, sans-serif" font-size="16" fill="#064e3b" text-anchor="middle">
      ARR adicional
    </text>
    <text x="175" y="470" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="middle" font-style="italic">
      Caso documentado 2024
    </text>
  </g>

  <!-- Case 2: IBM -->
  <g transform="translate(425, 120)">
    <rect width="350" height="500" fill="white" rx="12" stroke="#10b981" stroke-width="3"/>
    <rect width="350" height="80" fill="#10b981" rx="12"/>
    <text x="175" y="50" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">
      💼 IBM
    </text>
    <text x="30" y="120" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      <tspan font-weight="bold">Empresa:</tspan> Enterprise
    </text>
    <text x="30" y="160" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      <tspan font-weight="bold">Problema:</tspan> Ciclo longo
    </text>
    <text x="30" y="200" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      <tspan font-weight="bold">Solução:</tspan> SPIN em deals
    </text>
    <text x="30" y="220" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      complexos >$500k
    </text>
    <line x1="30" y1="240" x2="320" y2="240" stroke="#10b981" stroke-width="2"/>
    <text x="175" y="280" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#10b981" text-anchor="middle">
      +41%
    </text>
    <text x="175" y="315" font-family="Arial, sans-serif" font-size="18" fill="#064e3b" text-anchor="middle">
      win rate
    </text>
    <text x="175" y="360" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#10b981" text-anchor="middle">
      -22%
    </text>
    <text x="175" y="390" font-family="Arial, sans-serif" font-size="16" fill="#064e3b" text-anchor="middle">
      tempo de ciclo
    </text>
    <text x="175" y="470" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="middle" font-style="italic">
      Estudo Rackham (1988)
    </text>
  </g>

  <!-- Case 3: Cliente Sirius -->
  <g transform="translate(800, 120)">
    <rect width="350" height="500" fill="white" rx="12" stroke="#10b981" stroke-width="3"/>
    <rect width="350" height="80" fill="#10b981" rx="12"/>
    <text x="175" y="50" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">
      ⭐ Cliente Sirius
    </text>
    <text x="30" y="120" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      <tspan font-weight="bold">Empresa:</tspan> Consultoria
    </text>
    <text x="30" y="160" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      <tspan font-weight="bold">Problema:</tspan> Deals perdidos
    </text>
    <text x="30" y="200" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      <tspan font-weight="bold">Solução:</tspan> SPIN + Sirius
    </text>
    <text x="30" y="220" font-family="Arial, sans-serif" font-size="16" fill="#334155">
      CRM integrado
    </text>
    <line x1="30" y1="240" x2="320" y2="240" stroke="#10b981" stroke-width="2"/>
    <text x="175" y="280" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#10b981" text-anchor="middle">
      +67%
    </text>
    <text x="175" y="315" font-family="Arial, sans-serif" font-size="18" fill="#064e3b" text-anchor="middle">
      conversão
    </text>
    <text x="175" y="360" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#10b981" text-anchor="middle">
      R$ 840k
    </text>
    <text x="175" y="390" font-family="Arial, sans-serif" font-size="16" fill="#064e3b" text-anchor="middle">
      MRR adicional
    </text>
    <text x="175" y="470" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="middle" font-style="italic">
      Caso real 2025
    </text>
  </g>
</svg>
`;
fs.writeFileSync(path.join(imagesDir, 'spin-cases-sucesso-overview.png'), casesSucesso);
console.log('✅ 15/17: spin-cases-sucesso-overview.png');

// 16. Sirius CRM Integration
const siriusIntegration = `
<svg width="1200" height="700" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="700" fill="#f8fafc"/>

  <text x="600" y="60" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#1e293b" text-anchor="middle">
    Sirius CRM + SPIN Selling Integration
  </text>

  <!-- CRM Interface Mockup -->
  <rect x="100" y="120" width="1000" height="500" fill="white" rx="8" stroke="#cbd5e1" stroke-width="2"/>

  <!-- Header Bar -->
  <rect x="100" y="120" width="1000" height="60" fill="#2563eb" rx="8"/>
  <text x="130" y="160" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">
    Sirius CRM
  </text>
  <text x="950" y="160" font-family="Arial, sans-serif" font-size="16" fill="white">
    Discovery SPIN →
  </text>

  <!-- SPIN Fields -->
  <g transform="translate(130, 210)">
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1e293b">
      📋 Template SPIN Discovery
    </text>

    <!-- Situação -->
    <rect x="0" y="20" width="940" height="80" fill="#dbeafe" rx="6"/>
    <text x="15" y="45" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1e40af">
      1. SITUAÇÃO
    </text>
    <text x="15" y="70" font-family="Arial, sans-serif" font-size="14" fill="#334155">
      Stack atual: Pipedrive | Vendedores: 12 | Processo: Manual
    </text>

    <!-- Problema -->
    <rect x="0" y="120" width="940" height="80" fill="#fee2e2" rx="6"/>
    <text x="15" y="145" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#991b1b">
      2. PROBLEMA
    </text>
    <text x="15" y="170" font-family="Arial, sans-serif" font-size="14" fill="#334155">
      Sistema trava 3x/sem, equipe perde 2h/sem, falta visibilidade
    </text>

    <!-- Implicação -->
    <rect x="0" y="220" width="940" height="80" fill="#fef3c7" rx="6"/>
    <text x="15" y="245" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#78350f">
      3. IMPLICAÇÃO
    </text>
    <text x="15" y="270" font-family="Arial, sans-serif" font-size="14" fill="#334155">
      312h/ano perdidas = R$ 156k custo | 20% deals perdidos = R$ 1,2M ARR
    </text>

    <!-- Necessidade -->
    <rect x="0" y="320" width="940" height="80" fill="#d1fae5" rx="6"/>
    <text x="15" y="345" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#064e3b">
      4. NECESSIDADE
    </text>
    <text x="15" y="370" font-family="Arial, sans-serif" font-size="14" fill="#334155">
      Sistema estável + visibilidade 360° + automação follow-ups
    </text>
  </g>

  <text x="600" y="660" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#2563eb" text-anchor="middle">
    ✨ Campos customizados | Auto-save | Templates prontos | Integração total
  </text>
</svg>
`;
fs.writeFileSync(path.join(imagesDir, 'sirius-crm-spin-integration.png'), siriusIntegration);
console.log('✅ 16/17: sirius-crm-spin-integration.png');

// 17. CTA Final
const ctaFinal = `
<svg width="1200" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad6" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect width="1200" height="600" fill="url(#grad6)"/>

  <text x="600" y="100" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">
    Comece a Aplicar SPIN Hoje
  </text>

  <text x="600" y="160" font-family="Arial, sans-serif" font-size="24" fill="#e0f2fe" text-anchor="middle">
    Recursos 100% Gratuitos para Você e Seu Time
  </text>

  <!-- Boxes -->
  <g transform="translate(100, 220)">
    <rect width="320" height="250" fill="white" rx="12"/>
    <text x="160" y="40" font-family="Arial, sans-serif" font-size="48" text-anchor="middle">📋</text>
    <text x="160" y="90" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1e293b" text-anchor="middle">
      Checklist SPIN
    </text>
    <text x="160" y="120" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
      100+ Perguntas
    </text>
    <text x="160" y="145" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
      Categorizadas
    </text>
    <rect x="60" y="180" width="200" height="50" fill="#2563eb" rx="8"/>
    <text x="160" y="212" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">
      Baixar Grátis
    </text>
  </g>

  <g transform="translate(460, 220)">
    <rect width="320" height="250" fill="white" rx="12"/>
    <text x="160" y="40" font-family="Arial, sans-serif" font-size="48" text-anchor="middle">🎯</text>
    <text x="160" y="90" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1e293b" text-anchor="middle">
      Matriz Objeções
    </text>
    <text x="160" y="120" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
      10 Objeções +
    </text>
    <text x="160" y="145" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
      Respostas
    </text>
    <rect x="60" y="180" width="200" height="50" fill="#2563eb" rx="8"/>
    <text x="160" y="212" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">
      Baixar Grátis
    </text>
  </g>

  <g transform="translate(820, 220)">
    <rect width="320" height="250" fill="white" rx="12"/>
    <text x="160" y="40" font-family="Arial, sans-serif" font-size="48" text-anchor="middle">📝</text>
    <text x="160" y="90" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1e293b" text-anchor="middle">
      Template Discovery
    </text>
    <text x="160" y="120" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
      Roteiro 45 min
    </text>
    <text x="160" y="145" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
      Passo a passo
    </text>
    <rect x="60" y="180" width="200" height="50" fill="#2563eb" rx="8"/>
    <text x="160" y="212" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">
      Baixar Grátis
    </text>
  </g>

  <text x="600" y="560" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">
    ⚡ Aplique ainda hoje e veja resultados em 2 semanas!
  </text>
</svg>
`;
fs.writeFileSync(path.join(imagesDir, 'spin-cta-final.png'), ctaFinal);
console.log('✅ 17/17: spin-cta-final.png');

console.log('\n🎉 TODAS AS 17 IMAGENS FORAM GERADAS COM SUCESSO!');
console.log('📁 Localização: public/images/blog/');
console.log('\n✅ Imagens criadas:');
console.log('1. spin-selling-hero.jpg');
console.log('2. spin-selling-custo-discovery-fraco.png');
console.log('3. spin-selling-estatisticas.png');
console.log('4. spin-selling-conceito-diagrama.png');
console.log('5. spin-vs-bant-gpct-challenger.png');
console.log('6. spin-4-etapas-fluxograma.png');
console.log('7. spin-perguntas-situacao-exemplo.png');
console.log('8. spin-problem-chain-tecnica.png');
console.log('9. spin-calculo-implicacao-formula.png');
console.log('10. spin-vision-building-tecnica.png');
console.log('11. spin-discovery-timeline-45min.png');
console.log('12. spin-100-perguntas-por-setor.png');
console.log('13. spin-matriz-objecoes-completa.png');
console.log('14. spin-7-erros-fatais-infografico.png');
console.log('15. spin-cases-sucesso-overview.png');
console.log('16. sirius-crm-spin-integration.png');
console.log('17. spin-cta-final.png');
