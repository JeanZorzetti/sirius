import { prisma } from "@/lib/prisma"
import { prismaWa } from "@/lib/prisma-wa"
import { getSession } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  const logs: string[] = []
  
  try {
    logs.push("[1] Iniciando debug...")
    
    // Test 1: Session
    logs.push("[2] Buscando sessão...")
    const session = await getSession()
    logs.push(`[3] Sessão: ${session ? 'OK' : 'NULL'}`)
    
    // Test 2: Database connection
    logs.push("[4] Testando conexão com banco...")
    const orgCount = await prisma.organization.count()
    logs.push(`[5] Organizações no banco: ${orgCount}`)
    
    // Test 3: WhatsAppConnection model
    logs.push("[6] Testando WhatsAppConnection...")
    const connCount = await prismaWa.whatsAppConnection.count()
    logs.push(`[7] Conexões WhatsApp: ${connCount}`)
    
    // Test 4: Contact model with messages
    logs.push("[8] Testando Contact...")
    const contactCount = await prisma.contact.count()
    logs.push(`[9] Contatos: ${contactCount}`)
    
    // Test 5: ChatConversation model
    logs.push("[10] Testando ChatConversation...")
    const chatCount = await prisma.chatConversation.count()
    logs.push(`[11] ChatConversations: ${chatCount}`)
    
    logs.push("[12] Todos os testes passaram!")
    
  } catch (error: any) {
    logs.push(`[ERRO] ${error.message}`)
    logs.push(`[STACK] ${error.stack?.slice(0, 500)}`)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug - Diagnóstico do Sistema</h1>
      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm space-y-1">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
      
      <h2 className="text-xl font-bold mt-8 mb-4">Testar Chat Center</h2>
      <a 
        href="/dashboard/chat" 
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Ir para Chat Center
      </a>
    </div>
  )
}
