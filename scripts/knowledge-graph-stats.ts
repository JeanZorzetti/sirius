/**
 * Knowledge Graph Statistics & Validation
 *
 * Script para validar e exibir estatísticas do grafo de conhecimento.
 * Execução: npx tsx scripts/knowledge-graph-stats.ts
 */

import { COMMON_WIKIDATA_ENTITIES } from '../lib/geo/schema-generator'
import {
  ENTITY_RELATIONSHIPS,
  getGraphStats,
  findRelatedEntities,
  findPath,
  RelationshipType,
} from '../lib/geo/entity-relationships'

console.log('🧠 Knowledge Graph - Estatísticas e Validação\n')
console.log('=' .repeat(60))

// 1. Estatísticas Gerais
const stats = getGraphStats()
console.log('\n📊 ESTATÍSTICAS GERAIS:')
console.log(`   Total de Entidades: ${stats.totalEntities}`)
console.log(`   Total de Relacionamentos: ${stats.totalRelationships}`)
console.log(`   Tipos de Relacionamento: ${stats.uniqueRelationshipTypes}`)
console.log(
  `   Média de Relacionamentos/Entidade: ${stats.avgRelationshipsPerEntity}`
)

// 2. Distribuição por Categoria
console.log('\n📂 ENTIDADES POR CATEGORIA:')
const categories = {
  'Metodologias de Venda': [
    'SPIN_SELLING',
    'CHALLENGER_SALE',
    'CONSULTATIVE_SELLING',
    'SOLUTION_SELLING',
    'VALUE_SELLING',
    'SANDLER_SELLING_SYSTEM',
  ],
  'Software & Tecnologia': [
    'CRM',
    'SOFTWARE_AS_A_SERVICE',
    'ARTIFICIAL_INTELLIGENCE',
    'MACHINE_LEARNING',
    'NATURAL_LANGUAGE_PROCESSING',
    'CHATBOT',
    'AUTOMATION',
  ],
  'Stack Técnico': [
    'TYPESCRIPT',
    'JAVASCRIPT',
    'REACT',
    'NEXTJS',
    'NODEJS',
    'POSTGRESQL',
  ],
  'Negócios & Vendas': [
    'SALES',
    'MARKETING',
    'LEAD_GENERATION',
    'SALES_FUNNEL',
    'PIPELINE_SALES',
  ],
  Geografia: [
    'BRAZIL',
    'SAO_PAULO',
    'RIO_DE_JANEIRO',
    'BELO_HORIZONTE',
    'BRASILIA',
  ],
  'Indústrias & Segmentos': [
    'REAL_ESTATE',
    'SOLAR_ENERGY',
    'CONSULTING',
    'INSURANCE',
    'HEALTHCARE',
  ],
  'Personas & Profissões': [
    'SALES_REPRESENTATIVE',
    'SALES_MANAGER',
    'REAL_ESTATE_BROKER',
    'ENTREPRENEUR',
    'CEO',
  ],
  'Métricas & KPIs': [
    'RETURN_ON_INVESTMENT',
    'CONVERSION_RATE',
    'KEY_PERFORMANCE_INDICATOR',
    'NET_PROMOTER_SCORE',
  ],
  'Ferramentas & Integrações': [
    'GOOGLE_CALENDAR',
    'GMAIL',
    'WHATSAPP',
    'SLACK',
    'ZOOM',
  ],
}

for (const [category, entities] of Object.entries(categories)) {
  console.log(`   ${category}: ${entities.length}`)
}

// 3. Validação de Links
console.log('\n🔗 VALIDAÇÃO DE RELACIONAMENTOS:')
const entityKeys = Object.keys(COMMON_WIKIDATA_ENTITIES)
const invalidRelationships = ENTITY_RELATIONSHIPS.filter((triple) => {
  const subjectExists = Object.values(COMMON_WIKIDATA_ENTITIES).includes(
    triple.subject
  )
  const objectExists = Object.values(COMMON_WIKIDATA_ENTITIES).includes(
    triple.object
  )
  return !subjectExists || !objectExists
})

if (invalidRelationships.length === 0) {
  console.log('   ✅ Todos os relacionamentos apontam para entidades válidas')
} else {
  console.log(
    `   ❌ ${invalidRelationships.length} relacionamentos inválidos encontrados`
  )
  invalidRelationships.forEach((triple) => {
    console.log(`      ${triple.subject} -> ${triple.predicate} -> ${triple.object}`)
  })
}

// 4. Exemplos de Consultas ao Grafo
console.log('\n🔍 EXEMPLOS DE CONSULTAS AO GRAFO:')

// Exemplo 1: O que CRM usa?
const crmUses = findRelatedEntities(
  COMMON_WIKIDATA_ENTITIES.CRM,
  RelationshipType.SUBCLASS_OF
)
console.log(
  `\n   1. CRM é subclasse de: ${crmUses.length > 0 ? crmUses.join(', ') : 'Nenhum'}`
)

// Exemplo 2: Quem usa CRM?
const crmUsers = findRelatedEntities(
  COMMON_WIKIDATA_ENTITIES.CRM,
  RelationshipType.USED_BY
)
console.log(`   2. CRM é usado por: ${crmUsers.length} entidades`)

// Exemplo 3: Caminho entre SPIN Selling e CRM
const pathSpinToCrm = findPath(
  COMMON_WIKIDATA_ENTITIES.SPIN_SELLING,
  COMMON_WIKIDATA_ENTITIES.CRM
)
if (pathSpinToCrm) {
  console.log(
    `\n   3. Caminho SPIN Selling → CRM (${pathSpinToCrm.length} saltos):`
  )
  pathSpinToCrm.forEach((triple, i) => {
    const subjectKey = Object.entries(COMMON_WIKIDATA_ENTITIES).find(
      ([_, v]) => v === triple.subject
    )?.[0]
    const objectKey = Object.entries(COMMON_WIKIDATA_ENTITIES).find(
      ([_, v]) => v === triple.object
    )?.[0]
    console.log(`      ${i + 1}. ${subjectKey} --[${triple.predicate}]--> ${objectKey}`)
  })
} else {
  console.log('   3. Nenhum caminho encontrado entre SPIN Selling e CRM')
}

// 5. Densidade do Grafo
console.log('\n📈 ANÁLISE DE DENSIDADE:')
const maxPossibleEdges = (stats.totalEntities * (stats.totalEntities - 1)) / 2
const density = (stats.totalRelationships / maxPossibleEdges) * 100
console.log(`   Densidade atual: ${density.toFixed(4)}%`)
console.log(
  `   (${stats.totalRelationships} de ${maxPossibleEdges} arestas possíveis)`
)

if (density < 1) {
  console.log(
    '   ⚠️  Grafo esparso - considere adicionar mais relacionamentos'
  )
} else if (density > 10) {
  console.log('   ✅ Grafo denso - boa cobertura de relacionamentos')
} else {
  console.log('   🟡 Densidade moderada - há espaço para expansão')
}

// 6. Recomendações
console.log('\n💡 RECOMENDAÇÕES:')
if (stats.totalEntities >= 100) {
  console.log(
    `   ✅ Meta de 100+ entidades atingida (${stats.totalEntities} entidades)`
  )
} else {
  console.log(
    `   ⚠️  Meta de 100+ entidades não atingida (faltam ${100 - stats.totalEntities})`
  )
}

if (parseFloat(stats.avgRelationshipsPerEntity) < 2) {
  console.log(
    '   ⚠️  Baixa conectividade - adicione mais relacionamentos entre entidades'
  )
} else {
  console.log(
    '   ✅ Conectividade adequada (média de ' +
      stats.avgRelationshipsPerEntity +
      ' relacionamentos/entidade)'
  )
}

console.log('\n' + '='.repeat(60))
console.log('✨ Análise concluída\n')
