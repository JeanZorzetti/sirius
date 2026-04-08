'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'
import type { TaskUserLite } from './task-types'

interface TaskAssigneeAvatarProps {
  user: TaskUserLite | null | undefined
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-7 w-7 text-xs',
  lg: 'h-9 w-9 text-sm',
}

export function TaskAssigneeAvatar({ user, size = 'md', className }: TaskAssigneeAvatarProps) {
  if (!user) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full border border-dashed border-border bg-muted/30 text-muted-foreground',
          sizeClasses[size],
          className
        )}
      >
        <User className="h-3 w-3" />
      </div>
    )
  }

  const initials = (user.name || user.email)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Avatar className={cn(sizeClasses[size], 'ring-2 ring-background', className)}>
            <AvatarImage src={undefined} alt={user.name || user.email} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs font-medium">{user.name || user.email}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
