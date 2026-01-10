const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '../public/images/blog');

// Ensure directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// 1. Hero Image - SPIN Selling 4 etapas
const heroImage = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#grad1)"/>

  <!-- Title -->
  <text x="600" y="80" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">
    SPIN Selling
  </text>
  <text x="600" y="130" font-family="Arial, sans-serif" font-size="24" fill="#e0f2fe" text-anchor="middle">
    Metodologia de Vendas Consultivas B2B
  </text>

  <!-- 4 Steps Circle Layout -->
  <g transform="translate(600, 380)">
    <!-- Center Circle -->
    <circle cx="0" cy="0" r="80" fill="#ffffff" opacity="0.2"/>
    <text x="0" y="10" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">
      SPIN
    </text>

    <!-- S - Situação (Top) -->
    <g transform="translate(0, -200)">
      <circle cx="0" cy="0" r="90" fill="#3b82f6"/>
      <text x="0" y="-30" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">
        S
      </text>
      <text x="0" y="10" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle">
        Situação
      </text>
      <text x="0" y="35" font-family="Arial, sans-serif" font-size="14" fill="#e0f2fe" text-anchor="middle">
        Contexto
      </text>
    </g>

    <!-- P - Problema (Right) -->
    <g transform="translate(200, 0)">
      <circle cx="0" cy="0" r="90" fill="#ef4444"/>
      <text x="0" y="-30" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">
        P
      </text>
      <text x="0" y="10" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle">
        Problema
      </text>
      <text x="0" y="35" font-family="Arial, sans-serif" font-size="14" fill="#fee2e2" text-anchor="middle">
        Dores
      </text>
    </g>

    <!-- I - Implicação (Bottom) -->
    <g transform="translate(0, 200)">
      <circle cx="0" cy="0" r="90" fill="#f59e0b"/>
      <text x="0" y="-30" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">
        I
      </text>
      <text x="0" y="10" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle">
        Implicação
      </text>
      <text x="0" y="35" font-family="Arial, sans-serif" font-size="14" fill="#fef3c7" text-anchor="middle">
        Impacto
      </text>
    </g>

    <!-- N - Necessidade (Left) -->
    <g transform="translate(-200, 0)">
      <circle cx="0" cy="0" r="90" fill="#10b981"/>
      <text x="0" y="-30" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">
        N
      </text>
      <text x="0" y="10" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle">
        Necessidade
      </text>
      <text x="0" y="35" font-family="Arial, sans-serif" font-size="14" fill="#d1fae5" text-anchor="middle">
        Solução
      </text>
    </g>

    <!-- Connecting Lines -->
    <line x1="0" y1="-110" x2="0" y2="-80" stroke="white" stroke-width="3" opacity="0.5"/>
    <line x1="110" y1="0" x2="80" y2="0" stroke="white" stroke-width="3" opacity="0.5"/>
    <line x1="0" y1="110" x2="0" y2="80" stroke="white" stroke-width="3" opacity="0.5"/>
    <line x1="-110" y1="0" x2="-80" y2="0" stroke="white" stroke-width="3" opacity="0.5"/>
  </g>
</svg>
`;

fs.writeFileSync(path.join(imagesDir, 'spin-selling-hero.jpg'), heroImage);
console.log('✅ Created: spin-selling-hero.jpg');

// 2. Custo Discovery Fraco
const custoDiscovery = `
<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="500" fill="#fef2f2"/>

  <text x="400" y="60" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#991b1b" text-anchor="middle">
    Custo de um Discovery Fraco
  </text>

  <!-- Calculator Display -->
  <rect x="150" y="120" width="500" height="280" fill="white" rx="15" stroke="#dc2626" stroke-width="3"/>

  <!-- Calculation -->
  <text x="400" y="170" font-family="Arial, sans-serif" font-size="20" fill="#7f1d1d" text-anchor="middle">
    100 SQLs/mês × 20% perdidos × R$ 5.000 × 12 meses
  </text>

  <line x1="200" y1="190" x2="600" y2="190" stroke="#dc2626" stroke-width="2"/>

  <!-- Result -->
  <text x="400" y="280" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="#dc2626" text-anchor="middle">
    R$ 1.200.000
  </text>

  <text x="400" y="330" font-family="Arial, sans-serif" font-size="24" fill="#991b1b" text-anchor="middle">
    perdidos por ano
  </text>

  <text x="400" y="460" font-family="Arial, sans-serif" font-size="18" fill="#7f1d1d" text-anchor="middle">
    Fonte: Análise Sirius CRM baseada em dados de 500+ empresas B2B
  </text>
</svg>
`;

fs.writeFileSync(path.join(imagesDir, 'spin-selling-custo-discovery-fraco.png'), custoDiscovery);
console.log('✅ Created: spin-selling-custo-discovery-fraco.png');

// 3. Estatísticas SPIN
const estatisticas = `
<svg width="1000" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#dbeafe;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#bfdbfe;stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect width="1000" height="600" fill="url(#grad2)"/>

  <text x="500" y="60" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#1e40af" text-anchor="middle">
    SPIN Selling: Pesquisa Global
  </text>

  <!-- Stat 1 -->
  <g transform="translate(120, 150)">
    <rect width="220" height="180" fill="white" rx="12" opacity="0.9"/>
    <text x="110" y="80" font-family="Arial, sans-serif" font-size="52" font-weight="bold" fill="#2563eb" text-anchor="middle">
      35.000+
    </text>
    <text x="110" y="120" font-family="Arial, sans-serif" font-size="18" fill="#1e40af" text-anchor="middle">
      Calls de vendas
    </text>
    <text x="110" y="145" font-family="Arial, sans-serif" font-size="18" fill="#1e40af" text-anchor="middle">
      analisadas
    </text>
  </g>

  <!-- Stat 2 -->
  <g transform="translate(390, 150)">
    <rect width="220" height="180" fill="white" rx="12" opacity="0.9"/>
    <text x="110" y="80" font-family="Arial, sans-serif" font-size="52" font-weight="bold" fill="#2563eb" text-anchor="middle">
      20
    </text>
    <text x="110" y="120" font-family="Arial, sans-serif" font-size="18" fill="#1e40af" text-anchor="middle">
      Países
    </text>
    <text x="110" y="145" font-family="Arial, sans-serif" font-size="18" fill="#1e40af" text-anchor="middle">
      pesquisados
    </text>
  </g>

  <!-- Stat 3 -->
  <g transform="translate(660, 150)">
    <rect width="220" height="180" fill="white" rx="12" opacity="0.9"/>
    <text x="110" y="80" font-family="Arial, sans-serif" font-size="52" font-weight="bold" fill="#2563eb" text-anchor="middle">
      12
    </text>
    <text x="110" y="120" font-family="Arial, sans-serif" font-size="18" fill="#1e40af" text-anchor="middle">
      Anos de
    </text>
    <text x="110" y="145" font-family="Arial, sans-serif" font-size="18" fill="#1e40af" text-anchor="middle">
      pesquisa
    </text>
  </g>

  <!-- Stat 4 -->
  <g transform="translate(255, 380)">
    <rect width="220" height="180" fill="white" rx="12" opacity="0.9"/>
    <text x="110" y="80" font-family="Arial, sans-serif" font-size="52" font-weight="bold" fill="#10b981" text-anchor="middle">
      +53%
    </text>
    <text x="110" y="120" font-family="Arial, sans-serif" font-size="18" fill="#064e3b" text-anchor="middle">
      Aumento na
    </text>
    <text x="110" y="145" font-family="Arial, sans-serif" font-size="18" fill="#064e3b" text-anchor="middle">
      taxa de conversão
    </text>
  </g>

  <!-- Stat 5 -->
  <g transform="translate(525, 380)">
    <rect width="220" height="180" fill="white" rx="12" opacity="0.9"/>
    <text x="110" y="80" font-family="Arial, sans-serif" font-size="52" font-weight="bold" fill="#10b981" text-anchor="middle">
      +41%
    </text>
    <text x="110" y="120" font-family="Arial, sans-serif" font-size="18" fill="#064e3b" text-anchor="middle">
      Crescimento
    </text>
    <text x="110" y="145" font-family="Arial, sans-serif" font-size="18" fill="#064e3b" text-anchor="middle">
      em receita
    </text>
  </g>

  <text x="500" y="585" font-family="Arial, sans-serif" font-size="14" fill="#1e40af" text-anchor="middle">
    Fonte: Neil Rackham, "SPIN Selling" (1988) + Dados atualizados Miller Heiman Group
  </text>
</svg>
`;

fs.writeFileSync(path.join(imagesDir, 'spin-selling-estatisticas.png'), estatisticas);
console.log('✅ Created: spin-selling-estatisticas.png');

console.log('\n📊 Imagens geradas com sucesso!');
console.log('📁 Localização: public/images/blog/');
console.log('\n⚠️  Nota: As imagens são SVGs. Para melhor qualidade, considere convertê-las para PNG usando uma ferramenta como sharp ou imagemagick.');
