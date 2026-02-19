'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChatInterface } from '@/components/chat/chat-interface'
import { CreateDealDialog } from '@/components/deals/create-deal-dialog'
import { PipelineSelector } from '@/components/pipelines/pipeline-selector'
import { toast } from 'sonner'
import { MessageSquare, Layout, Loader2 } from 'lucide-react'

// Dynamic import do KanbanBoard (carrega apenas quando necessário)
const KanbanBoard = dynamic(
  () => import('@/components/kanban-board').then(m => ({ default: m.KanbanBoard })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false,
  }
)

interface DashboardTabsProps {
  pipelines: any[]
  stages: any[]
  contacts: any[]
  userId: string
  userName: string
  organizationId: string
}

export function DashboardTabs({
  pipelines,
  stages,
  contacts,
  userId,
  userName,
  organizationId
}: DashboardTabsProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('pipeline')
  const [chatData, setChatData] = useState<any>(null)
  const [loadingChat, setLoadingChat] = useState(false)

  // Pipeline selector state
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(() => {
    const defaultPipeline = pipelines.find((p: any) => p.isDefault)
    return defaultPipeline ? defaultPipeline.id : (pipelines[0]?.id || '')
  })

  // Filter stages by selected pipeline
  const filteredStages = useMemo(() => {
    if (!selectedPipelineId) return stages
    return stages.filter((stage: any) => stage.pipelineId === selectedPipelineId)
  }, [stages, selectedPipelineId])

  const syncWithServer = useCallback(() => {
    router.refresh()
  }, [router])

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
      <div className="flex items-center justify-between mb-4">
        <TabsList className="grid w-full sm:w-[300px] grid-cols-2">
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        {activeTab === 'pipeline' && (
          <div className="flex items-center gap-2">
            <PipelineSelector
              pipelines={pipelines}
              onPipelineChange={setSelectedPipelineId}
            />
            <CreateDealDialog
              stages={filteredStages}
              contacts={contacts}
              onSuccess={syncWithServer}
            />
          </div>
        )}
      </div>

      <TabsContent value="pipeline" className="flex-1 m-0 data-[state=inactive]:hidden">
        <KanbanBoard
          stages={filteredStages as any}
          contacts={contacts}
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
