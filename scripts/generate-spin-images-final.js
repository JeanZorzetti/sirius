const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '../public/images/blog');

// 7. Perguntas Situação Exemplo
const perguntasSituacao = `
<svg width="900" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="900" height="600" fill="#dbeafe"/>

  <text x="450" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#1e40af" text-anchor="middle">
    Perguntas de Situação - Exemplo CRM
  </text>

  <g transform="translate(50, 120)">
    <rect width="800" height="100" fill="white" rx="8" stroke="#3b82f6" stroke-width="2"/>
    <text x="30" y="35" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#2563eb">1.</text>
    <text x="70" y="35" font-family="Arial, sans-serif" font-size="18" fill="#1e293b">Qual CRM vocês usam atualmente?</text>
    <text x="70" y="65" font-family="Arial, sans-serif" font-size="15" fill="#64748b" font-style="italic">✅ Entende ferramenta atual</text>
  </g>

  <g transform="translate(50, 240)">
    <rect width="800" height="100" fill="white" rx="8" stroke="#3b82f6" stroke-width="2"/>
    <text x="30" y="35" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#2563eb">2.</text>
    <text x="70" y="35" font-family="Arial, sans-serif" font-size="18" fill="#1e293b">Quantos vendedores têm no time comercial?</text>
    <text x="70" y="65" font-family="Arial, sans-serif" font-size="15" fill="#64748b" font-style="italic">✅ Dimensiona operação</text>
  </g>

  <g transform="translate(50, 360)">
    <rect width="800" height="100" fill="white" rx="8" stroke="#3b82f6" stroke-width="2"/>
    <text x="30" y="35" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#2563eb">3.</text>
    <text x="70" y="35" font-family="Arial, sans-serif" font-size="18" fill="#1e293b">Como funciona o processo de vendas hoje?</text>
    <text x="70" y="65" font-family="Arial, sans-serif" font-size="15" fill="#64748b" font-style="italic">✅ Mapeia workflow atual</text>
  </g>

  <text x="450" y="550" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1e40af" text-anchor="middle">
    ⏱ Meta: 3-5 perguntas em 5-10 minutos
  </text>
</svg>
`;
fs.writeFileSync(path.join(imagesDir, 'spin-perguntas-situacao-exemplo.png'), perguntasSituacao);
console.log('✅ 7/17: spin-perguntas-situacao-exemplo.png');

// 8. Problem Chain
const problemChain = `
<svg width="1000" height="700" xmlns="http://www.w3.org/2000/svg">
  <rect width="1000" height="700" fill="#fff7ed"/>

  <text x="500" y="50" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#9a3412" text-anchor="middle">
    Problem Chain - 3 Camadas
  </text>

  <!-- Layer 1: Surface -->
  <g>
    <ellipse cx="500" cy="200" rx="200" ry="80" fill="#fed7aa" stroke="#f97316" stroke-width="3"/>
    <text x="500" y="190" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#9a3412" text-anchor="middle">
      CAMADA 1: Superficial
    </text>
    <text x="500" y="215" font-family="Arial, sans-serif" font-size="16" fill="#7c2d12" text-anchor="middle">
      "A equipe não usa o CRM"
    </text>
  </g>

  <path d="M 500 280 L 500 320" stroke="#f97316" stroke-width="4" marker-end="url(#arrow4)"/>

  <!-- Layer 2: Root Cause -->
  <g>
    <ellipse cx="500" cy="400" rx="250" ry="80" fill="#fdba74" stroke="#ea580c" stroke-width="3"/>
    <text x="500" y="380" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#9a3412" text-anchor="middle">
      CAMADA 2: Causa Raiz
    </text>
    <text x="500" y="405" font-family="Arial, sans-serif" font-size="16" fill="#7c2d12" text-anchor="middle">
      "É complicado demais, trava,"
    </text>
    <text x="500" y="425" font-family="Arial, sans-serif" font-size="16" fill="#7c2d12" text-anchor="middle">
      perde dados"
    </text>
  </g>

  <path d="M 500 480 L 500 520" stroke="#ea580c" stroke-width="4" marker-end="url(#arrow4)"/>

  <!-- Layer 3: Business Impact -->
  <g>
    <ellipse cx="500" cy="600" rx="300" ry="80" fill="#fb923c" stroke="#c2410c" stroke-width="3"/>
    <text x="500" y="580" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#9a3412" text-anchor="middle">
      CAMADA 3: Impacto no Negócio
    </text>
    <text x="500" y="605" font-family="Arial, sans-serif" font-size="16" fill="#7c2d12" text-anchor="middle">
      "Eu perco visibilidade do pipeline e não consigo"
    </text>
    <text x="500" y="625" font-family="Arial, sans-serif" font-size="16" fill="#7c2d12" text-anchor="middle">
      fazer forecast pro board"
    </text>
  </g>

  <defs>
    <marker id="arrow4" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#f97316" />
    </marker>
  </defs>
</svg>
`;
fs.writeFileSync(path.join(imagesDir, 'spin-problem-chain-tecnica.png'), problemChain);
console.log('✅ 8/17: spin-problem-chain-tecnica.png');

// 9. Cálculo Implicação
const calculoImplicacao = `
<svg width="900" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="900" height="600" fill="#fef3c7"/>

  <text x="450" y="60" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="#78350f" text-anchor="middle">
    Fórmula de Cálculo da Implicação
  </text>

  <g transform="translate(150, 150)">
    <rect width="600" height="300" fill="white" rx="12" stroke="#f59e0b" stroke-width="4"/>

    <text x="300" y="60" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#92400e" text-anchor="middle">
      Frequência × Impacto × Tempo = Custo Total
    </text>

    <line x1="50" y1="90" x2="550" y2="90" stroke="#f59e0b" stroke-width="2"/>

    <text x="50" y="130" font-family="Arial, sans-serif" font-size="18" fill="#78350f">
      • <tspan font-weight="bold">Frequência:</tspan> "Quantas vezes por semana/mês?"
    </text>

    <text x="50" y="170" font-family="Arial, sans-serif" font-size="18" fill="#78350f">
      • <tspan font-weight="bold">Impacto:</tspan> "Quanto tempo perde por ocorrência?"
    </text>

    <text x="50" y="210" font-family="Arial, sans-serif" font-size="18" fill="#78350f">
      • <tspan font-weight="bold">Tempo:</tspan> "Há quanto tempo isso acontece?"
    </text>

    <rect x="50" y="230" width="500" height="50" fill="#fed7aa" rx="6"/>
    <text x="300" y="262" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#9a3412" text-anchor="middle">
      Exemplo: 3x/sem × 2h × 52sem = 312 horas/ano perdidas
    </text>
  </g>

  <text x="450" y="520" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#78350f" text-anchor="middle">
    💡 Sempre quantifique o problema em termos de tempo e dinheiro
  </text>
</svg>
`;
fs.writeFileSync(path.join(imagesDir, 'spin-calculo-implicacao-formula.png'), calculoImplicacao);
console.log('✅ 9/17: spin-calculo-implicacao-formula.png');

// 10. Vision Building
const visionBuilding = `
<svg width="1000" height="700" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#d1fae5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#a7f3d0;stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect width="1000" height="700" fill="url(#grad4)"/>

  <text x="500" y="60" font-family="Arial, sans-serif" font-size="38" font-weight="bold" fill="#064e3b" text-anchor="middle">
    Vision Building Technique
  </text>

  <text x="500" y="100" font-family="Arial, sans-serif" font-size="20" fill="#065f46" text-anchor="middle">
    Fazer o cliente co-criar a solução ideal
  </text>

  <!-- Question 1 -->
  <g transform="translate(100, 150)">
    <rect width="800" height="120" fill="white" rx="10" stroke="#10b981" stroke-width="3"/>
    <text x="30" y="40" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#10b981">❓</text>
    <text x="80" y="40" font-family="Arial, sans-serif" font-size="20" fill="#1e293b">
      "Se você tivesse uma varinha mágica e pudesse criar
    </text>
    <text x="80" y="70" font-family="Arial, sans-serif" font-size="20" fill="#1e293b">
      o CRM perfeito, como ele seria?"
    </text>
    <text x="80" y="100" font-family="Arial, sans-serif" font-size="15" fill="#10b981" font-style="italic">
      → Cliente descreve solução ideal
    </text>
  </g>

  <!-- Question 2 -->
  <g transform="translate(100, 300)">
    <rect width="800" height="120" fill="white" rx="10" stroke="#10b981" stroke-width="3"/>
    <text x="30" y="40" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#10b981">❓</text>
    <text x="80" y="40" font-family="Arial, sans-serif" font-size="20" fill="#1e293b">
      "O que você poderia fazer com isso que não
    </text>
    <text x="80" y="70" font-family="Arial, sans-serif" font-size="20" fill="#1e293b">
      consegue fazer hoje?"
    </text>
    <text x="80" y="100" font-family="Arial, sans-serif" font-size="15" fill="#10b981" font-style="italic">
      → Cliente visualiza benefícios concretos
    </text>
  </g>

  <!-- Question 3 -->
  <g transform="translate(100, 450)">
    <rect width="800" height="120" fill="white" rx="10" stroke="#10b981" stroke-width="3"/>
    <text x="30" y="40" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#10b981">❓</text>
    <text x="80" y="40" font-family="Arial, sans-serif" font-size="20" fill="#1e293b">
      "Quanto isso valeria para você e seu time?"
    </text>
    <text x="80" y="80" font-family="Arial, sans-serif" font-size="15" fill="#10b981" font-style="italic">
      → Cliente quantifica valor da solução
    </text>
  </g>

  <rect x="200" y="610" width="600" height="60" fill="#10b981" rx="8"/>
  <text x="500" y="648" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">
    ✅ Resultado: Cliente "compra" antes de você vender
  </text>
</svg>
`;
fs.writeFileSync(path.join(imagesDir, 'spin-vision-building-tecnica.png'), visionBuilding);
console.log('✅ 10/17: spin-vision-building-tecnica.png');

// 11. Discovery Timeline
const discoveryTimeline = `
<svg width="1200" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="400" fill="#f1f5f9"/>

  <text x="600" y="40" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#1e293b" text-anchor="middle">
    Timeline Discovery Meeting - 45 minutos
  </text>

  <!-- Timeline Bar -->
  <rect x="100" y="100" width="1000" height="80" fill="white" rx="8" stroke="#cbd5e1" stroke-width="2"/>

  <!-- Situação -->
  <rect x="100" y="100" width="200" height="80" fill="#3b82f6" rx="8"/>
  <text x="200" y="135" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">
    SITUAÇÃO
  </text>
  <text x="200" y="160" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">
    5-10 min
  </text>

  <!-- Problema -->
  <rect x="300" y="100" width="400" height="80" fill="#ef4444"/>
  <text x="500" y="135" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">
    PROBLEMA
  </text>
  <text x="500" y="160" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">
    15-20 min
  </text>

  <!-- Implicação -->
  <rect x="700" y="100" width="250" height="80" fill="#f59e0b"/>
  <text x="825" y="135" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">
    IMPLICAÇÃO
  </text>
  <text x="825" y="160" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">
    10-15 min
  </text>

  <!-- Necessidade -->
  <rect x="950" y="100" width="150" height="80" fill="#10b981" rx="8"/>
  <text x="1025" y="130" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="white" text-anchor="middle">
    NECESSIDADE
  </text>
  <text x="1025" y="160" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">
    8-12 min
  </text>

  <!-- Time markers -->
  <text x="100" y="220" font-family="Arial, sans-serif" font-size="14" fill="#64748b">0 min</text>
  <text x="300" y="220" font-family="Arial, sans-serif" font-size="14" fill="#64748b">10 min</text>
  <text x="500" y="220" font-family="Arial, sans-serif" font-size="14" fill="#64748b">20 min</text>
  <text x="700" y="220" font-family="Arial, sans-serif" font-size="14" fill="#64748b">30 min</text>
  <text x="950" y="220" font-family="Arial, sans-serif" font-size="14" fill="#64748b">40 min</text>
  <text x="1060" y="220" font-family="Arial, sans-serif" font-size="14" fill="#64748b">45 min</text>

  <!-- Legend -->
  <g transform="translate(100, 280)">
    <text x="0" y="20" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1e293b">
      💡 Dica: Invista mais tempo em PROBLEMA (explorar dores) do que em SITUAÇÃO (dados superficiais)
    </text>
  </g>

  <text x="600" y="360" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
    ⚠️ Evite ultrapassar 50 minutos - mantenha o ritmo e foco
  </text>
</svg>
`;
fs.writeFileSync(path.join(imagesDir, 'spin-discovery-timeline-45min.png'), discoveryTimeline);
console.log('✅ 11/17: spin-discovery-timeline-45min.png');

console.log('\n✅ Criadas imagens 7-11 (5/11 restantes)');
console.log('Continuando...\n');
