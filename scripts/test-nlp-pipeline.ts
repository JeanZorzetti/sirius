/**
 * NLP Pipeline - Test Script
 *
 * Tests entity extraction and graph building with sample content.
 * Run: npx tsx scripts/test-nlp-pipeline.ts
 */

import { processContentNLP } from '../lib/nlp/pipeline'

// Sample content about CRM and SPIN Selling
const SAMPLE_TEXT = `
SPIN Selling: A Metodologia Consultiva que Revolucionou as Vendas

Desenvolvida por Neil Rackham após estudar mais de 35.000 chamadas de vendas,
a metodologia SPIN Selling transformou a forma como profissionais de vendas B2B
abordam clientes de alto valor. SPIN é um acrônimo para Situation, Problem,
Implication, e Need-payoff - quatro tipos de perguntas que guiam o comprador
através de uma jornada de descoberta.

A metodologia é especialmente eficaz quando combinada com ferramentas modernas
de CRM (Customer Relationship Management), como o Sirius CRM. Um sistema de CRM
bem implementado permite que representantes de vendas rastreiem o estágio de cada
negociação no pipeline de vendas, armazenem informações contextuais sobre cada
cliente, e apliquem as técnicas SPIN de forma consistente.

No mercado brasileiro, especialmente em São Paulo, corretores de imóveis e
consultores têm adotado SPIN Selling para aumentar suas taxas de conversão em
até 40%. A combinação de venda consultiva com automação de follow-up através
de CRM cria um processo de vendas altamente eficiente.

Principais Benefícios:
- Aumento de 30-50% na taxa de conversão
- Redução do ciclo de vendas em 25%
- Melhoria na retenção de clientes (Customer Retention)
- Maior satisfação do cliente (Customer Satisfaction)

Para medir o ROI (Return on Investment) de implementar SPIN Selling + CRM,
é essencial rastrear KPIs (Key Performance Indicators) como:
- Conversion Rate (Taxa de Conversão)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Monthly Recurring Revenue (MRR)

Empresas que utilizam metodologias consultivas como SPIN, Sandler, e Challenger
Sale reportam resultados superiores em vendas complexas B2B.
`

async function main() {
  console.log('🧠 NLP Pipeline - Test Script\n')
  console.log('=' .repeat(70))

  try {
    console.log('\n📄 Processing sample content...\n')
    console.log('Sample text (first 200 chars):')
    console.log(SAMPLE_TEXT.slice(0, 200) + '...\n')

    const result = await processContentNLP({
      text: SAMPLE_TEXT,
      contentType: 'blog_post',
      contentId: 'test-spin-selling-article',
      contentUrl: '/blog/spin-selling-metodologia',
    })

    if (!result.success) {
      console.error('❌ Extraction failed:', result.error)
      process.exit(1)
    }

    console.log('\n✅ Extraction completed!\n')
    console.log('=' .repeat(70))

    // Display results
    console.log('\n📊 EXTRACTION RESULTS:\n')

    console.log(`⏱️  Processing Time: ${result.processingTimeMs}ms`)
    console.log(`🆔 Extraction ID: ${result.extractionId}`)
    console.log(`🔢 Tokens Used: ${result.tokensUsed || 'N/A'}\n`)

    if (result.data) {
      console.log('─'.repeat(70))
      console.log('\n🏷️  ENTITIES EXTRACTED:\n')

      result.data.entities.forEach((entity, i) => {
        console.log(`${i + 1}. ${entity.name}`)
        console.log(`   Type: ${entity.type}`)
        console.log(`   Wikidata ID: ${entity.wikidataId || 'Not found'}`)
        console.log(`   Relevance: ${(entity.relevance * 100).toFixed(0)}%`)
        if (entity.description) {
          console.log(`   Description: ${entity.description}`)
        }
        if (entity.context) {
          console.log(`   Context: "${entity.context.slice(0, 80)}..."`)
        }
        console.log('')
      })

      console.log('─'.repeat(70))
      console.log('\n🔗 RELATIONSHIPS EXTRACTED:\n')

      result.data.relationships.forEach((rel, i) => {
        console.log(
          `${i + 1}. ${rel.subject} --[${rel.predicate}]--> ${rel.object}`
        )
        console.log(`   Confidence: ${(rel.confidence * 100).toFixed(0)}%`)
        if (rel.source) {
          console.log(`   Source: "${rel.source.slice(0, 80)}..."`)
        }
        console.log('')
      })

      if (result.data.summary) {
        console.log('─'.repeat(70))
        console.log('\n📝 SUMMARY:\n')
        console.log(result.data.summary)
        console.log('')
      }
    }

    console.log('=' .repeat(70))
    console.log('\n✨ Test completed successfully!\n')

    // Instructions for next steps
    console.log('📌 Next steps:')
    console.log('   1. Check database: SELECT * FROM "Entity";')
    console.log('   2. Check relationships: SELECT * FROM "Relationship";')
    console.log('   3. View extraction: SELECT * FROM "EntityExtraction";')
    console.log('   4. Test API: curl http://localhost:3000/api/nlp/stats')
    console.log('')
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

main()
