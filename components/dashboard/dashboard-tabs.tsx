'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChatInterface } from '@/components/chat/chat-interface'
import { DashboardWithPipelineSelector } from '@/components/dashboard-with-pipeline-selector'
import { toast } from 'sonner'
import { MessageSquare, Layout, Loader2 } from 'lucide-react'

interface DashboardTabsProps {
  pipelines: any[]
  stages: any[]
  contacts: any[]
  dealCount: number
  isPro: boolean
  isMember: boolean
  planLimits: any
  userId: string
  userName: string
  organizationId: string
}

export function DashboardTabs({
  pipelines,
  stages,
  contacts,
  dealCount,
  isPro,
  isMember,
  planLimits,
  userId,
  userName,
  organizationId
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState('pipeline')
  const [chatData, setChatData] = useState<any>(null)
  const [loadingChat, setLoadingChat] = useState(false)

  // Fetch chat data when tab changes to chat
  useEffect(() => {
    if (activeTab === 'chat' && !chatData && !loadingChat) {
      setLoadingChat(true)
      fetch('/api/chat/initial-data')
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            toast.error(data.error)
          } else {
            setChatData(data)
          }
        })
        .catch(error => {
          console.error('Error fetching chat data:', error)
          toast.error('Erro ao carregar chat')
        })
        .finally(() => {
          setLoadingChat(false)
        })
    }
  }, [activeTab, chatData, loadingChat])

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
      <TabsList className="grid w-full sm:w-[300px] grid-cols-2 mb-4">
        <TabsTrigger value="pipeline" className="flex items-center gap-2">
          <Layout className="h-4 w-4" />
          Pipeline
        </TabsTrigger>
        <TabsTrigger value="chat" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          WhatsApp
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pipeline" className="flex-1 m-0 data-[state=inactive]:hidden">
        <DashboardWithPipelineSelector
          pipelines={pipelines}
          allStages={stages}
          contacts={contacts}
          dealCount={dealCount}
          isPro={isPro}
          isMember={isMember}
          planLimits={planLimits}
        />
      </TabsContent>

      <TabsContent value="chat" className="flex-1 m-0 h-[calc(100vh-280px)] data-[state=inactive]:hidden">
        <div className="h-full border rounded-lg overflow-hidden bg-white">
          {loadingChat ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
            </div>
          ) : chatData ? (
            <ChatInterface
              connections={chatData.connections}
              contacts={chatData.contacts}
              userId={chatData.userId}
              userName={chatData.userName}
              organizationId={chatData.organizationId}
              maxInstances={chatData.maxInstances}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4" />
              <p>Erro ao carregar chat. Tente novamente.</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}

