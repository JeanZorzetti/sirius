'use client'

import { CheckCircle2, Circle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface OnboardingProgressProps {
  completedSteps: string[]
  totalSteps: number
  className?: string
}

export function OnboardingProgress({
  completedSteps,
  totalSteps,
  className
}: OnboardingProgressProps) {
  const completedCount = completedSteps.length
  const progressPercentage = (completedCount / totalSteps) * 100

  return (
    <div className={cn('space-y-3', className)}>
      {/* Progress Ring */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          {/* Background Circle */}
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-zinc-200 dark:text-zinc-800"
            />
            {/* Progress Circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${progressPercentage * 1.76} 176`}
              className="transition-all duration-500 ease-out"
            />
            {/* Gradient Definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-zinc-900 dark:text-white">
                {completedCount}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-500 -mt-1">
                de {totalSteps}
              </div>
            </div>
          </div>
        </div>

        {/* Text Info */}
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Progresso do Onboarding
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">
            {completedCount === totalSteps
              ? '🎉 Parabéns! Você completou todas as etapas!'
              : `Faltam ${totalSteps - completedCount} etapas para completar`}
          </p>
          <Progress value={progressPercentage} className="h-1.5" />
        </div>
      </div>

      {/* Steps Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = index < completedCount
          return (
            <div
              key={index}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200',
                isCompleted
                  ? 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500'
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
              Etapa {index + 1}
            </div>
          )
        })}
      </div>
    </div>
  )
}
