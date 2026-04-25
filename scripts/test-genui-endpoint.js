/**
 * Script de Teste - Generative UI Endpoint
 *
 * Testa o endpoint /api/agi/chat-with-ui em produção ou local
 *
 * Usage:
 *   node scripts/test-genui-endpoint.js
 */

const BASE_URL = process.env.TEST_URL || 'https://siriuscrm.com.br'
const SESSION_COOKIE = process.env.SESSION_COOKIE || '' // Pegar do browser

async function testChatWithUI() {
  console.log('🧪 Testando Generative UI Endpoint\n')
  console.log(`📍 URL: ${BASE_URL}/api/agi/chat-with-ui`)
  console.log('─'.repeat(60))

  try {
    const response = await fetch(`${BASE_URL}/api/agi/chat-with-ui`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': SESSION_COOKIE,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Quanto eu economizo com o Sirius CRM? Atualmente gasto R$ 15 mil por mês.'
          }
        ],
      }),
    })

    console.log(`\n📊 Status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Erro:', error)
      return
    }

    console.log('✅ Resposta recebida! Processando stream...\n')
    console.log('─'.repeat(60))

    // Process streaming response
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    let chunkCount = 0
    let textChunks = 0
    let uiChunks = 0
    let thinkingChunks = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value)
      const lines = text.split('\n').filter(line => line.trim())

      for (const line of lines) {
        try {
          const chunk = JSON.parse(line)
          chunkCount++

          console.log(`\n📦 Chunk ${chunkCount}:`)
          console.log(`   Type: ${chunk.type}`)

          switch (chunk.type) {
            case 'text':
              textChunks++
              console.log(`   Content: "${chunk.content.substring(0, 50)}${chunk.content.length > 50 ? '...' : ''}"`)
              break

            case 'ui_component':
              uiChunks++
              console.log(`   Component: ${chunk.name}`)
              console.log(`   Props:`, JSON.stringify(chunk.props, null, 2).split('\n').map(l => `      ${l}`).join('\n'))
              if (chunk.reasoning) {
                console.log(`   Reasoning: "${chunk.reasoning}"`)
              }
              break

            case 'thinking':
              thinkingChunks++
              console.log(`   State: ${chunk.state}`)
              if (chunk.message) {
                console.log(`   Message: "${chunk.message}"`)
              }
              break

            case 'error':
              console.log(`   ❌ Error: ${chunk.message}`)
              console.log(`   Recoverable: ${chunk.recoverable}`)
              break
          }
        } catch (e) {
          console.error('   ⚠️  Failed to parse chunk:', line)
        }
      }
    }

    console.log('\n' + '─'.repeat(60))
    console.log('\n📊 Resumo:')
    console.log(`   Total chunks: ${chunkCount}`)
    console.log(`   Text chunks: ${textChunks}`)
    console.log(`   UI components: ${uiChunks}`)
    console.log(`   Thinking states: ${thinkingChunks}`)
    console.log('\n✅ Teste concluído com sucesso!\n')

  } catch (error) {
    console.error('\n❌ Erro ao testar endpoint:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run test
console.log('🚀 Iniciando teste...\n')
testChatWithUI()
