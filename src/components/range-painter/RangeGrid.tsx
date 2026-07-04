'use client'

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { RangeAction, RangeScenario, Position, POSITIONS } from '@/engine/types'

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const
type Rank = typeof RANKS[number]

function rankIndex(r: Rank): number {
  return RANKS.indexOf(r)
}

function getCellKey(r1: Rank, r2: Rank, suited: boolean): string {
  if (r1 === r2) return `${r1}${r1}`
  const high = rankIndex(r1) <= rankIndex(r2) ? r1 : r2
  const low = rankIndex(r1) <= rankIndex(r2) ? r2 : r1
  return `${high}${low}${suited ? 's' : 'o'}`
}

const CYCLE: (RangeAction | null)[] = [null, 'fold', 'call', 'raise-2bet', 'raise-3bet']

const ACTION_META: Record<string, { label: string; color: string; order: number }> = {
  'fold':       { label: 'Fold', color: 'bg-red-500/20 text-red-400 border-red-500/30', order: 0 },
  'call':       { label: 'Call', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', order: 1 },
  'raise-2bet': { label: '2bet', color: 'bg-emerald-500/25 text-emerald-400 border-emerald-500/30', order: 2 },
  'raise-3bet': { label: '3bet', color: 'bg-purple-500/25 text-purple-400 border-purple-500/30', order: 3 },
}

interface RangeGridProps {
  scenario: RangeScenario
  range: Record<string, RangeAction | null>
  onCellToggle: (cellKey: string) => void
}

export function RangeGrid({ scenario, range, onCellToggle }: RangeGridProps) {
  const showDiagonal = scenario.context === 'open' || scenario.context === 'blind-defense'

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid grid-cols-[auto_repeat(13,minmax(36px,1fr))] gap-[1px] bg-border rounded-lg overflow-hidden text-xs select-none w-full">
        <div className="bg-muted p-1.5" />

        {RANKS.map(col => (
          <div key={col} className="bg-muted p-1.5 text-center font-bold text-sm">{col}</div>
        ))}

        {RANKS.map((row, i) => (
          <div key={row} className="contents">
            <div className="bg-muted p-1.5 text-center font-bold text-sm">{row}</div>
            {RANKS.map((col, j) => {
              const isPair = i === j
              const suited = i < j
              const key = isPair ? `${row}${row}` : suited
                ? `${row}${col}s`
                : j > i ? `${row}${col}o` : `${col}${row}o`

              const high = rankIndex(row) <= rankIndex(col) ? row : col
              const low = rankIndex(row) <= rankIndex(col) ? col : row
              const cellKey = getCellKey(row, col, suited)
              const state = range[cellKey]
              const meta = state ? ACTION_META[state] : null

              return (
                <div
                  key={cellKey}
                  className={cn(
                    'p-1.5 text-center cursor-pointer transition-all duration-75 font-mono border border-transparent',
                    'hover:ring-1 hover:ring-foreground/20 hover:z-10',
                    meta?.color,
                    isPair && 'font-bold',
                    !meta && 'hover:bg-accent/50 text-muted-foreground',
                    showDiagonal && i === j && 'bg-yellow-500/10'
                  )}
                  onClick={() => onCellToggle(cellKey)}
                  title={cellKey}
                >
                  {isPair ? `${row}${row}` : suited ? `${high}${low}s` : `${high}${low}o`}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export function RangeLegend() {
  return (
    <div className="flex flex-wrap justify-center gap-3 text-xs">
      {Object.entries(ACTION_META).map(([key, meta]) => (
        <div key={key} className="flex items-center gap-1.5">
          <div className={cn('w-4 h-4 rounded border', meta.color.replace('text-', 'border-'))} />
          <span>{meta.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <div className="w-4 h-4 rounded border border-border bg-transparent" />
        <span>Unselected</span>
      </div>
    </div>
  )
}

export function useRangeState() {
  const [range, setRange] = useState<Record<string, RangeAction | null>>({})

  const toggleCell = useCallback((cellKey: string) => {
    setRange(prev => {
      const current = prev[cellKey]
      const idx = CYCLE.indexOf(current ?? null)
      const next = CYCLE[(idx + 1) % CYCLE.length]
      return { ...prev, [cellKey]: next }
    })
  }, [])

  const resetRange = useCallback(() => setRange({}), [])

  return { range, setRange, toggleCell, resetRange }
}

const SCENARIO_GROUPS: { label: string; scenarios: RangeScenario[] }[] = [
  {
    label: 'Opening Ranges',
    scenarios: [
      { context: 'open', heroPosition: 'UTG', label: 'UTG Open' },
      { context: 'open', heroPosition: 'MP', label: 'MP Open' },
      { context: 'open', heroPosition: 'CO', label: 'CO Open' },
      { context: 'open', heroPosition: 'BTN', label: 'BTN Open' },
    ],
  },
  {
    label: 'Vs Open (defending)',
    scenarios: [
      { context: 'vs-open', heroPosition: 'BTN', villainPosition: 'CO', label: 'BTN vs CO Open' },
      { context: 'vs-open', heroPosition: 'BTN', villainPosition: 'MP', label: 'BTN vs MP Open' },
      { context: 'vs-open', heroPosition: 'CO', villainPosition: 'MP', label: 'CO vs MP Open' },
      { context: 'vs-open', heroPosition: 'BB', villainPosition: 'BTN', label: 'BB vs BTN Open' },
    ],
  },
  {
    label: 'Vs 3bet',
    scenarios: [
      { context: 'vs-3bet', heroPosition: 'BTN', villainPosition: 'CO', label: 'BTN vs CO 3bet' },
      { context: 'vs-3bet', heroPosition: 'CO', villainPosition: 'MP', label: 'CO vs MP 3bet' },
    ],
  },
  {
    label: 'Blind Defense',
    scenarios: [
      { context: 'blind-defense', heroPosition: 'BB', villainPosition: 'BTN', label: 'BB vs BTN Steal' },
      { context: 'blind-defense', heroPosition: 'BB', villainPosition: 'SB', label: 'BB vs SB Steal' },
      { context: 'blind-defense', heroPosition: 'SB', villainPosition: 'BTN', label: 'SB vs BTN Steal' },
    ],
  },
]

interface ScenarioSelectorProps {
  selected: RangeScenario
  onSelect: (scenario: RangeScenario) => void
}

export function ScenarioSelector({ selected, onSelect }: ScenarioSelectorProps) {
  return (
    <div className="space-y-2">
      {SCENARIO_GROUPS.map(group => (
        <div key={group.label}>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 px-1">
            {group.label}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {group.scenarios.map(s => {
              const isActive = selected.context === s.context &&
                selected.heroPosition === s.heroPosition &&
                selected.villainPosition === s.villainPosition
              return (
                <button
                  key={s.label}
                  onClick={() => onSelect(s)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
