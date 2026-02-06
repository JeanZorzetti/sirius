'use client'

import { useState, useEffect } from 'react'
import { Filter, User, UserX, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface User {
  id: string
  name: string | null
  email: string
}

interface ConversationFiltersProps {
  currentUserId: string
  onFilterChange: (filter: string) => void
}

export function ConversationFilters({ currentUserId, onFilterChange }: ConversationFiltersProps) {
  const [filter, setFilter] = useState<string>('all')
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/whatsapp/users')
        if (res.ok) {
          const data = await res.json()
          setUsers(data)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }
    fetchUsers()
  }, [])

  const handleFilterChange = (value: string) => {
    setFilter(value)
    onFilterChange(value)
  }

  const getFilterLabel = () => {
    if (filter === 'all') return 'Todas'
    if (filter === 'my') return 'Minhas'
    if (filter === 'unassigned') return 'Não atribuídas'
    const user = users.find((u) => u.id === filter)
    return user?.name || user?.email.split('@')[0] || 'Filtrado'
  }

  const hasActiveFilter = filter !== 'all'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 gap-2 text-xs',
            hasActiveFilter && 'bg-[#00a884]/10 text-[#00a884]'
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          {getFilterLabel()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel className="text-xs text-[#667781]">
          Filtrar conversas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={filter} onValueChange={handleFilterChange}>
          <DropdownMenuRadioItem value="all" className="text-xs">
            <Users className="h-3.5 w-3.5 mr-2" />
            Todas
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="my" className="text-xs">
            <User className="h-3.5 w-3.5 mr-2" />
            Minhas conversas
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="unassigned" className="text-xs">
            <UserX className="h-3.5 w-3.5 mr-2" />
            Não atribuídas
          </DropdownMenuRadioItem>
          {users.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] text-[#667781] px-2">
                POR AGENTE
              </DropdownMenuLabel>
              {users.map((user) => (
                <DropdownMenuRadioItem key={user.id} value={user.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#00a884]/20 flex items-center justify-center">
                      <span className="text-[9px] font-semibold text-[#00a884]">
                        {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="truncate">
                      {user.name || user.email.split('@')[0]}
                    </span>
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </>
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
