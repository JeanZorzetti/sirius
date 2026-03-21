'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BarChart3, LineChart } from 'lucide-react'

interface AnalyticsTabNavProps {
  activeTab: 'overview' | 'pro'
  isPro: boolean
}

export function AnalyticsTabNav({ activeTab, isPro }: AnalyticsTabNavProps) {
  return (
    <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800 mb-6">
      <Link
        href="/dashboard/analytics"
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
          activeTab === 'overview'
            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
            : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
        )}
      >
        <BarChart3 className="w-4 h-4" />
        Visão Geral
      </Link>
      <Link
        href="/dashboard/analytics?tab=pro"
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
          activeTab === 'pro'
            ? 'border-purple-500 text-purple-600 dark:text-purple-400'
            : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
        )}
      >
        <LineChart className="w-4 h-4" />
        Analytics Avançado
        {!isPro && (
          <span className="ml-1 text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-1.5 py-0.5 rounded-full">
            PRO
          </span>
        )}
      </Link>
    </div>
  )
}
