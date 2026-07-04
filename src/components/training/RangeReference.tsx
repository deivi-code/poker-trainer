'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Spot } from '@/engine/types'
import { getRangeMap, getScenarioLabel } from '@/engine/evaluation/evaluator'
import { classifyScenario } from '@/engine/evaluation/preflop-strategy'
import type { ScenarioKey } from '@/engine/evaluation/preflop-strategy'

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const
type Rank = typeof RANKS[number]

function rankIndex(r: Rank): number {
  return RANKS.indexOf(r)
}

const ACTION_COLORS: Record<string, string> = {
  'fold': 'bg-red-500/15 text-red-400',
  'call': 'bg-blue-500/20 text-blue-400',
  'raise-2bet': 'bg-emerald-500/20 text-emerald-400',
  'raise-3bet': 'bg-purple-500/20 text-purple-400',
  'raise-4bet': 'bg-orange-500/20 text-orange-400',
}

function getScenarioFromSpot(spot: Spot): ScenarioKey {
  return classifyScenario(spot.heroPosition, spot.villainPosition!, spot.actionState)
}

interface RangeReferenceProps {
  spot: Spot
  isOpen: boolean
}

export function RangeReference({ spot, isOpen }: RangeReferenceProps) {
  const scenario = useMemo(() => getScenarioFromSpot(spot), [spot])
  const rangeMap = useMemo(() => getRangeMap(scenario), [scenario])
  const label = getScenarioLabel(scenario)

  if (!isOpen) return null

  const contextLabels: Record<string, string> = {
    'open-': 'Open raise (2bet)',
    'vs-open-': '3bet or call vs open',
    'vs-3bet-': '4bet or call vs 3bet',
    'blind-': 'Defend or 3bet vs steal',
  }
  const contextKey = Object.keys(contextLabels).find(k => scenario.startsWith(k))
  const subtitle = contextKey ? contextLabels[contextKey] : ''

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-muted/50">
        <div className="text-sm font-semibold">{label}</div>
        {subtitle && <div className="text-[10px] text-muted-foreground">{subtitle}</div>}
      </div>

      <div className="overflow-x-auto">
        <div className="inline-grid grid-cols-[auto_repeat(13,minmax(22px,1fr))] gap-[1px] bg-border text-[9px] select-none w-full">
          <div className="bg-muted p-0.5" />

          {RANKS.map(col => (
            <div key={col} className="bg-muted p-0.5 text-center font-bold">{col}</div>
          ))}

          {RANKS.map((row, i) => (
            <div key={row} className="contents">
              <div className="bg-muted p-0.5 text-center font-bold">{row}</div>
              {RANKS.map((col, j) => {
                const isPair = i === j
                const suited = i < j
                const high = rankIndex(row) <= rankIndex(col) ? row : col
                const low = rankIndex(row) <= rankIndex(col) ? col : row
                const cellKey = isPair ? `${row}${row}` : suited ? `${high}${low}s` : `${high}${low}o`
                const action = rangeMap[cellKey]
                const color = action ? ACTION_COLORS[action] : ''

                return (
                  <div
                    key={cellKey}
                    className={cn(
                      'p-0.5 text-center font-mono leading-tight',
                      color || 'text-muted-foreground/40',
                      isPair && 'font-bold',
                      !color && 'bg-muted/30'
                    )}
                  >
                    {cellKey}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-3 py-1.5 border-t border-border text-[9px] text-muted-foreground">
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-red-500/15" /> Fold</div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-blue-500/20" /> Call</div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-emerald-500/20" /> 2bet</div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-purple-500/20" /> 3bet</div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-orange-500/20" /> 4bet</div>
      </div>
    </div>
  )
}
