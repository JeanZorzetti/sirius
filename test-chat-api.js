/**
 * Test script to debug chat-with-ui API
 * Run: node test-chat-api.js
 */

const API_URL = 'https://siriuscrm.com.br/api/agi/chat-with-ui'

async function testChatAPI() {
    console.log('🔍 Testing Chat API...\n')

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'Hello, this is a test' }
                ],
                sessionId: 'test-session-' + Date.now(),
            }),
        })

        console.log('Status:', response.status, response.statusText)
        console.log('Headers:', Object.fromEntries(response.headers.entries()))

        if (!response.ok) {
            const errorText = await response.text()
            console.error('\n❌ Error Response:')
            console.error(errorText)
            return
        }

        console.log('\n✅ Response OK - Streaming...\n')

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
            console.error('No reader available')
            return
        }

        let chunkCount = 0
        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            chunkCount++
            const text = decoder.decode(value)
            console.log(`Chunk ${chunkCount}:`, text.substring(0, 100))
        }

        console.log(`\n✅ Received ${chunkCount} chunks`)

    } catch (error) {
        console.error('\n❌ Network Error:')
        console.error(error.message)
    }
}

testChatAPI()
