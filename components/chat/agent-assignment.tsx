'use client'

import { useState } from 'react'
import { User, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface User {
  id: string
  name: string | null
  email: string
}

interface AgentAssignmentProps {
  contactId: string
  assignedUserId: string | null
  users: User[]
  onAssignmentChange?: () => void
}

export function AgentAssignment({
  contactId,
  assignedUserId,
  users,
  onAssignmentChange,
}: AgentAssignmentProps) {
  const [loading, setLoading] = useState(false)
  const [currentAssignedId, setCurrentAssignedId] = useState(assignedUserId)

  const assignedUser = users.find((u) => u.id === currentAssignedId)

  const handleAssign = async (userId: string | null) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/whatsapp/conversations/${contactId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedUserId: userId }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao atribuir agente')
      }

      const data = await res.json()
      setCurrentAssignedId(data.assignedUserId)

      if (userId) {
        const user = users.find((u) => u.id === userId)
        toast.success(`Conversa atribuída a ${user?.name || user?.email}`)
      } else {
        toast.success('Atribuição removida')
      }

      onAssignmentChange?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getUserInitials = (user: User) => {
    if (user.name) {
      return user.name
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user.email.slice(0, 2).toUpperCase()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2"
          disabled={loading}
        >
          {assignedUser ? (
            <>
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[9px] bg-[#00a884] text-white">
                  {getUserInitials(assignedUser)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">
                {assignedUser.name || assignedUser.email.split('@')[0]}
              </span>
            </>
          ) : (
            <>
              <User className="h-4 w-4" />
              <span className="text-xs">Atribuir</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel className="text-xs text-[#667781]">
          Atribuir agente
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {currentAssignedId && (
          <>
            <DropdownMenuItem
              onClick={() => handleAssign(null)}
              disabled={loading}
              className="text-xs"
            >
              Remover atribuição
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {users.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => handleAssign(user.id)}
            disabled={loading}
            className="text-xs"
          >
            <div className="flex items-center gap-2 flex-1">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[9px] bg-[#00a884] text-white">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {user.name || user.email.split('@')[0]}
                </p>
                {user.name && (
                  <p className="text-[10px] text-[#667781] truncate">
                    {user.email}
                  </p>
                )}
              </div>
              {currentAssignedId === user.id && (
                <Check className="h-3.5 w-3.5 text-[#00a884]" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
