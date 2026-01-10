const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '../public/images/blog');

// 4. SPIN Conceito Diagrama
const conceitoDiagrama = `
<svg width="1000" height="700" xmlns="http://www.w3.org/2000/svg">
  <rect width="1000" height="700" fill="#f8fafc"/>

  <text x="500" y="50" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#1e293b" text-anchor="middle">
    Como Funciona o SPIN Selling
  </text>

  <!-- 4 Quadrantes -->
  <!-- Situação (Top Left) -->
  <g>
    <rect x="50" y="100" width="420" height="250" fill="#dbeafe" rx="12" stroke="#3b82f6" stroke-width="3"/>
    <text x="260" y="140" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#1e40af" text-anchor="middle">
      1. SITUAÇÃO
    </text>
    <text x="260" y="180" font-family="Arial, sans-serif" font-size="16" fill="#1e40af" text-anchor="middle">
      Entenda o contexto atual
    </text>
    <text x="80" y="220" font-family="Arial, sans-serif" font-size="14" fill="#334155">
      • Qual CRM vocês usam?
    </text>
    <text x="80" y="250" font-family="Arial, sans-serif" font-size="14" fill="#334155">
      • Quantos vendedores no time?
    </text>
    <text x="80" y="280" font-family="Arial, sans-serif" font-size="14" fill="#334155">
      • Como funciona o processo hoje?
    </text>
    <text x="80" y="320" font-family="Arial, sans-serif" font-size="13" fill="#64748b" font-style="italic">
      Meta: 3-5 perguntas (5-10 min)
    </text>
  </g>

  <!-- Problema (Top Right) -->
  <g>
    <rect x="530" y="100" width="420" height="250" fill="#fee2e2" rx="12" stroke="#ef4444" stroke-width="3"/>
    <text x="740" y="140" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#991b1b" text-anchor="middle">
      2. PROBLEMA
    </text>
    <text x="740" y="180" font-family="Arial, sans-serif" font-size="16" fill="#991b1b" text-anchor="middle">
      Identifique dificuldades/dores
    </text>
    <text x="560" y="220" font-family="Arial, sans-serif" font-size="14" fill="#334155">
      • O que não funciona bem?
    </text>
    <text x="560" y="250" font-family="Arial, sans-serif" font-size="14" fill="#334155">
      • Quais as maiores dificuldades?
    </text>
    <text x="560" y="280" font-family="Arial, sans-serif" font-size="14" fill="#334155">
      • Com que frequência isso ocorre?
    </text>
    <text x="560" y="320" font-family="Arial, sans-serif" font-size="13" fill="#64748b" font-style="italic">
      Meta: 6-10 perguntas (15-20 min)
    </text>
  </g>

  <!-- Implicação (Bottom Left) -->
  <g>
    <rect x="50" y="400" width="420" height="250" fill="#fef3c7" rx="12" stroke="#f59e0b" stroke-width="3"/>
    <text x="260" y="440" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#78350f" text-anchor="middle">
      3. IMPLICAÇÃO
    </text>
    <text x="260" y="480" font-family="Arial, sans-serif" font-size="16" fill="#78350f" text-anchor="middle">
      Explore consequências e custos
    </text>
    <text x="80" y="520" font-family="Arial, sans-serif" font-size="14" fill="#334155">
      • Qual o impacto na receita?
    </text>
    <text x="80" y="550" font-family="Arial, sans-serif" font-size="14" fill="#334155">
      • Como afeta a produtividade?
    </text>
    <text x="80" y="580" font-family="Arial, sans-serif" font-size="14" fill="#334155">
      • O que acontece se não resolver?
    </text>
    <text x="80" y="620" font-family="Arial, sans-serif" font-size="13" fill="#64748b" font-style="italic">
      Meta: 4-6 perguntas (10-15 min)
    </text>
  </g>

  <!-- Necessidade (Bottom Right) -->
  <g>
    <rect x="530" y="400" width="420" height="250" fill="#d1fae5" rx="12" stroke="#10b981" stroke-width="3"/>
    <text x="740" y="440" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#064e3b" text-anchor="middle">
      4. NECESSIDADE
    </text>
    <text x="740" y="480" font-family="Arial, sans-serif" font-size="16" fill="#064e3b" text-anchor="middle">
      Cliente articula a solução
    </text>
    <text x="560" y="520" font-family="Arial, sans-serif" font-size="14" fill="#334155">
      • Se tivesse X, como mudaria?
    </text>
    <text x="560" y="550" font-family="Arial, sans-serif" font-size="14" fill="#334155">
      • O que seria ideal para você?
    </text>
    <text x="560" y="580" font-family="Arial, sans-serif" font-size="14" fill="#334155">
      • Quanto isso vale para seu time?
    </text>
    <text x="560" y="620" font-family="Arial, sans-serif" font-size="13" fill="#64748b" font-style="italic">
      Meta: 3-5 perguntas (8-12 min)
    </text>
  </g>

  <!-- Arrows -->
  <path d="M 470 225 L 530 225" stroke="#334155" stroke-width="3" fill="none" marker-end="url(#arrowhead)"/>
  <path d="M 260 350 L 260 400" stroke="#334155" stroke-width="3" fill="none" marker-end="url(#arrowhead)"/>
  <path d="M 740 350 L 740 400" stroke="#334155" stroke-width="3" fill="none" marker-end="url(#arrowhead)"/>
  <path d="M 470 525 L 530 525" stroke="#334155" stroke-width="3" fill="none" marker-end="url(#arrowhead)"/>

  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#334155" />
    </marker>
  </defs>
</svg>
`;

fs.writeFileSync(path.join(imagesDir, 'spin-selling-conceito-diagrama.png'), conceitoDiagrama);
console.log('✅ Created: spin-selling-conceito-diagrama.png');

// 5. SPIN vs BANT vs GPCT vs Challenger
const comparativoMetodologias = `
<svg width="1200" height="700" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="700" fill="#ffffff"/>

  <text x="600" y="50" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#1e293b" text-anchor="middle">
    Comparativo: SPIN vs Outras Metodologias
  </text>

  <!-- Header Row -->
  <rect x="50" y="100" width="250" height="60" fill="#1e40af" />
  <rect x="300" y="100" width="225" height="60" fill="#3b82f6" />
  <rect x="525" y="100" width="225" height="60" fill="#3b82f6" />
  <rect x="750" y="100" width="225" height="60" fill="#3b82f6" />
  <rect x="975" y="100" width="175" height="60" fill="#3b82f6" />

  <text x="175" y="140" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">Critério</text>
  <text x="412" y="140" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">SPIN</text>
  <text x="637" y="140" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">BANT</text>
  <text x="862" y="140" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">GPCT</text>
  <text x="1062" y="140" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">Challenger</text>

  <!-- Row 1: Foco -->
  <rect x="50" y="160" width="250" height="80" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="300" y="160" width="225" height="80" fill="white" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="525" y="160" width="225" height="80" fill="white" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="750" y="160" width="225" height="80" fill="white" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="975" y="160" width="175" height="80" fill="white" stroke="#cbd5e1" stroke-width="1"/>

  <text x="175" y="205" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#334155" text-anchor="middle">Foco</text>
  <text x="412" y="195" font-family="Arial, sans-serif" font-size="14" fill="#334155" text-anchor="middle">Discovery</text>
  <text x="412" y="215" font-family="Arial, sans-serif" font-size="14" fill="#334155" text-anchor="middle">profundo</text>
  <text x="637" y="195" font-family="Arial, sans-serif" font-size="14" fill="#334155" text-anchor="middle">Qualificação</text>
  <text x="637" y="215" font-family="Arial, sans-serif" font-size="14" fill="#334155" text-anchor="middle">rápida</text>
  <text x="862" y="195" font-family="Arial, sans-serif" font-size="14" fill="#334155" text-anchor="middle">Goals +</text>
  <text x="862" y="215" font-family="Arial, sans-serif" font-size="14" fill="#334155" text-anchor="middle">Timeline</text>
  <text x="1062" y="195" font-family="Arial, sans-serif" font-size="14" fill="#334155" text-anchor="middle">Ensinar</text>
  <text x="1062" y="215" font-family="Arial, sans-serif" font-size="14" fill="#334155" text-anchor="middle">cliente</text>

  <!-- Row 2: Duração -->
  <rect x="50" y="240" width="250" height="80" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="300" y="240" width="225" height="80" fill="white" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="525" y="240" width="225" height="80" fill="white" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="750" y="240" width="225" height="80" fill="white" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="975" y="240" width="175" height="80" fill="white" stroke="#cbd5e1" stroke-width="1"/>

  <text x="175" y="285" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#334155" text-anchor="middle">Duração</text>
  <text x="412" y="285" font-family="Arial, sans-serif" font-size="16" fill="#334155" text-anchor="middle">40-50 min</text>
  <text x="637" y="285" font-family="Arial, sans-serif" font-size="16" fill="#334155" text-anchor="middle">10-15 min</text>
  <text x="862" y="285" font-family="Arial, sans-serif" font-size="16" fill="#334155" text-anchor="middle">20-30 min</text>
  <text x="1062" y="285" font-family="Arial, sans-serif" font-size="16" fill="#334155" text-anchor="middle">30-40 min</text>

  <!-- Row 3: Quando Usar -->
  <rect x="50" y="320" width="250" height="100" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="300" y="320" width="225" height="100" fill="white" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="525" y="320" width="225" height="100" fill="white" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="750" y="320" width="225" height="100" fill="white" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="975" y="320" width="175" height="100" fill="white" stroke="#cbd5e1" stroke-width="1"/>

  <text x="175" y="350" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#334155" text-anchor="middle">Quando</text>
  <text x="175" y="375" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#334155" text-anchor="middle">Usar</text>

  <text x="412" y="350" font-family="Arial, sans-serif" font-size="13" fill="#334155" text-anchor="middle">Deals</text>
  <text x="412" y="370" font-family="Arial, sans-serif" font-size="13" fill="#334155" text-anchor="middle">complexos</text>
  <text x="412" y="390" font-family="Arial, sans-serif" font-size="13" fill="#334155" text-anchor="middle">com múltiplos</text>
  <text x="412" y="410" font-family="Arial, sans-serif" font-size="13" fill="#334155" text-anchor="middle">stakeholders</text>

  <text x="637" y="350" font-family="Arial, sans-serif" font-size="13" fill="#334155" text-anchor="middle">Lead scoring</text>
  <text x="637" y="370" font-family="Arial, sans-serif" font-size="13" fill="#334155" text-anchor="middle">inicial e</text>
  <text x="637" y="390" font-family="Arial, sans-serif" font-size="13" fill="#334155" text-anchor="middle">triagem de</text>
  <text x="637" y="410" font-family="Arial, sans-serif" font-size="13" fill="#334155" text-anchor="middle">oportunidades</text>

  <text x="862" y="360" font-family="Arial, sans-serif" font-size="13" fill="#334155" text-anchor="middle">Vendas com</text>
  <text x="862" y="380" font-family="Arial, sans-serif" font-size="13" fill="#334155" text-anchor="middle">timelines</text>
  <text x="862" y="400" font-family="Arial, sans-serif" font-size="13" fill="#334155" text-anchor="middle">definidos</text>

  <text x="1062" y="360" font-family="Arial, sans-serif" font-size="13" fill="#334155" text-anchor="middle">Cliente não</text>
  <text x="1062" y="380" font-family="Arial, sans-serif" font-size="13" fill="#334155" text-anchor="middle">sabe que</text>
  <text x="1062" y="400" font-family="Arial, sans-serif" font-size="13" fill="#334155" text-anchor="middle">tem problema</text>

  <!-- Row 4: Taxa de Sucesso -->
  <rect x="50" y="420" width="250" height="80" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="300" y="420" width="225" height="80" fill="#d1fae5" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="525" y="420" width="225" height="80" fill="white" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="750" y="420" width="225" height="80" fill="white" stroke="#cbd5e1" stroke-width="1"/>
  <rect x="975" y="420" width="175" height="80" fill="white" stroke="#cbd5e1" stroke-width="1"/>

  <text x="175" y="450" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#334155" text-anchor="middle">Taxa de</text>
  <text x="175" y="475" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#334155" text-anchor="middle">Sucesso</text>

  <text x="412" y="450" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#10b981" text-anchor="middle">+53%</text>
  <text x="412" y="475" font-family="Arial, sans-serif" font-size="13" fill="#064e3b" text-anchor="middle">conversão</text>

  <text x="637" y="450" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#334155" text-anchor="middle">+20%</text>
  <text x="637" y="475" font-family="Arial, sans-serif" font-size="13" fill="#64748b" text-anchor="middle">qualificação</text>

  <text x="862" y="450" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#334155" text-anchor="middle">+35%</text>
  <text x="862" y="475" font-family="Arial, sans-serif" font-size="13" fill="#64748b" text-anchor="middle">conversão</text>

  <text x="1062" y="450" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#334155" text-anchor="middle">+38%</text>
  <text x="1062" y="475" font-family="Arial, sans-serif" font-size="13" fill="#64748b" text-anchor="middle">conversão</text>

  <!-- Footer -->
  <text x="600" y="560" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#10b981" text-anchor="middle">
    ✅ Recomendação: Use BANT para qualificar + SPIN para discovery
  </text>

  <text x="600" y="650" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="middle">
    Fonte: Análise comparativa baseada em estudos de Miller Heiman Group, Gartner e CEB (agora Gartner)
  </text>
</svg>
`;

fs.writeFileSync(path.join(imagesDir, 'spin-vs-bant-gpct-challenger.png'), comparativoMetodologias);
console.log('✅ Created: spin-vs-bant-gpct-challenger.png');

// 6. Fluxograma 4 Etapas
const fluxograma = `
<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad3" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#f0f9ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e0f2fe;stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect width="1200" height="800" fill="url(#grad3)"/>

  <text x="600" y="60" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#1e40af" text-anchor="middle">
    Fluxograma SPIN Selling (45 minutos)
  </text>

  <!-- Etapa 1: Situação -->
  <g>
    <rect x="100" y="130" width="280" height="140" fill="#3b82f6" rx="12" stroke="#1e40af" stroke-width="3"/>
    <text x="240" y="170" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">
      1. SITUAÇÃO
    </text>
    <text x="240" y="205" font-family="Arial, sans-serif" font-size="16" fill="#dbeafe" text-anchor="middle">
      Contexto & Background
    </text>
    <text x="240" y="240" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">
      ⏱ 5-10 minutos
    </text>
  </g>

  <path d="M 380 200 L 450 200" stroke="#1e40af" stroke-width="4" fill="none" marker-end="url(#arrow3)"/>

  <!-- Etapa 2: Problema -->
  <g>
    <rect x="450" y="130" width="280" height="140" fill="#ef4444" rx="12" stroke="#991b1b" stroke-width="3"/>
    <text x="590" y="170" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">
      2. PROBLEMA
    </text>
    <text x="590" y="205" font-family="Arial, sans-serif" font-size="16" fill="#fee2e2" text-anchor="middle">
      Dificuldades & Dores
    </text>
    <text x="590" y="240" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">
      ⏱ 15-20 minutos
    </text>
  </g>

  <path d="M 730 200 L 800 200" stroke="#991b1b" stroke-width="4" fill="none" marker-end="url(#arrow3)"/>

  <!-- Etapa 3: Implicação -->
  <g>
    <rect x="800" y="130" width="280" height="140" fill="#f59e0b" rx="12" stroke="#78350f" stroke-width="3"/>
    <text x="940" y="170" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">
      3. IMPLICAÇÃO
    </text>
    <text x="940" y="205" font-family="Arial, sans-serif" font-size="16" fill="#fef3c7" text-anchor="middle">
      Consequências & Custos
    </text>
    <text x="940" y="240" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">
      ⏱ 10-15 minutos
    </text>
  </g>

  <path d="M 940 270 L 940 340" stroke="#78350f" stroke-width="4" fill="none" marker-end="url(#arrow3)"/>

  <!-- Etapa 4: Necessidade -->
  <g>
    <rect x="800" y="340" width="280" height="140" fill="#10b981" rx="12" stroke="#064e3b" stroke-width="3"/>
    <text x="940" y="380" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">
      4. NECESSIDADE
    </text>
    <text x="940" y="415" font-family="Arial, sans-serif" font-size="16" fill="#d1fae5" text-anchor="middle">
      Solução Ideal
    </text>
    <text x="940" y="450" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">
      ⏱ 8-12 minutos
    </text>
  </g>

  <!-- Decision Boxes -->
  <g>
    <rect x="100" y="340" width="280" height="140" fill="#ffffff" rx="12" stroke="#64748b" stroke-width="2" stroke-dasharray="5,5"/>
    <text x="240" y="380" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#334155" text-anchor="middle">
      Checkpoint 1:
    </text>
    <text x="240" y="410" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
      Cliente reconhece
    </text>
    <text x="240" y="435" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
      o problema?
    </text>
  </g>

  <g>
    <rect x="450" y="340" width="280" height="140" fill="#ffffff" rx="12" stroke="#64748b" stroke-width="2" stroke-dasharray="5,5"/>
    <text x="590" y="380" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#334155" text-anchor="middle">
      Checkpoint 2:
    </text>
    <text x="590" y="410" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
      Cliente entende
    </text>
    <text x="590" y="435" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
      o custo/urgência?
    </text>
  </g>

  <!-- Result -->
  <g>
    <rect x="300" y="550" width="600" height="180" fill="#10b981" rx="15" stroke="#064e3b" stroke-width="4"/>
    <text x="600" y="600" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">
      ✅ RESULTADO
    </text>
    <text x="600" y="640" font-family="Arial, sans-serif" font-size="20" fill="#d1fae5" text-anchor="middle">
      Cliente articula necessidade de solução
    </text>
    <text x="600" y="675" font-family="Arial, sans-serif" font-size="20" fill="#d1fae5" text-anchor="middle">
      e está pronto para ouvir proposta
    </text>
    <text x="600" y="710" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">
      Próximo passo: Apresentação/Demo personalizada
    </text>
  </g>

  <defs>
    <marker id="arrow3" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto">
      <polygon points="0 0, 12 4, 0 8" fill="#1e40af" />
    </marker>
  </defs>
</svg>
`;

fs.writeFileSync(path.join(imagesDir, 'spin-4-etapas-fluxograma.png'), fluxograma);
console.log('✅ Created: spin-4-etapas-fluxograma.png');

console.log('\n📊 Mais 3 imagens geradas!');
console.log('Total: 6/17 imagens');
