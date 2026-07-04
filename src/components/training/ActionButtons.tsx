'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ActionButtonsProps {
  onAction: (action: string) => void
  disabled: boolean
  street: string
}

const PREFLOP_ACTIONS = [
  {
    id: 'fold', label: 'Fold', shortcut: 'F',
    className: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 hover:shadow-red-500/40',
  },
  {
    id: 'call', label: 'Call', shortcut: 'C',
    className: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40',
  },
  {
    id: 'raise', label: '3-Bet', shortcut: 'R',
    className: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/40',
  },
]

const POSTFLOP_ACTIONS = [
  {
    id: 'fold', label: 'Fold', shortcut: 'F',
    className: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 hover:shadow-red-500/40',
  },
  {
    id: 'check', label: 'Check', shortcut: 'K',
    className: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40',
  },
  {
    id: 'call', label: 'Call', shortcut: 'C',
    className: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40',
  },
  {
    id: 'raise', label: 'Raise', shortcut: 'R',
    className: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/40',
  },
  {
    id: 'all-in', label: 'All-in', shortcut: 'A',
    className: 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25 hover:shadow-purple-500/40',
  },
]

export function ActionButtons({ onAction, disabled, street }: ActionButtonsProps) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)

  const actions = street === 'preflop' ? PREFLOP_ACTIONS : POSTFLOP_ACTIONS

  return (
    <div className="flex gap-2.5 justify-center flex-wrap">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          disabled={disabled}
          onMouseEnter={() => setHoveredAction(action.id)}
          onMouseLeave={() => setHoveredAction(null)}
          className={cn(
            'relative flex flex-col items-center gap-1 px-6 py-4 rounded-xl font-bold text-sm transition-all duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
            'hover:-translate-y-0.5 active:translate-y-0 active:scale-95',
            action.className,
            hoveredAction === action.id && 'scale-105 -translate-y-1'
          )}
        >
          <span className="text-base">{action.label}</span>
          <span className="text-[10px] opacity-70 font-mono">[{action.shortcut}]</span>
        </button>
      ))}
    </div>
  )
}
