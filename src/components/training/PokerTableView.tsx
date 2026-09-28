'use client'

import { useMemo } from 'react'
import { Spot } from '@/engine/types'

interface PokerTableViewProps {
  spot: Spot
}

type Seat = {
  position: string
  label: string
  x: number
  y: number
}

const ALL_SEATS: Seat[] = [
  { position: 'UTG', label: 'UTG', x: 50, y: 5 },
  { position: 'MP', label: 'MP', x: 82, y: 16 },
  { position: 'CO', label: 'CO', x: 95, y: 46 },
  { position: 'BTN', label: 'BTN', x: 82, y: 76 },
  { position: 'SB', label: 'SB', x: 18, y: 76 },
  { position: 'BB', label: 'BB', x: 5, y: 46 },
]

function suitSymbol(suit: string): string {
  const symbols: Record<string, string> = { h: '♥', d: '♦', c: '♣', s: '♠' }
  return symbols[suit] || suit
}

function suitColor(suit: string): string {
  return suit === 'h' || suit === 'd' ? 'text-red-700' : 'text-slate-950'
}

export function PokerTableView({ spot }: PokerTableViewProps) {
  const { heroHand, heroPosition, villainPosition, actionState, stackSize } = spot
  const [c1, c2] = heroHand.cards

  const openerLabel = useMemo(() => {
    if (!villainPosition || actionState.street !== 'preflop') return null
    return 'OR'
  }, [villainPosition, actionState.street])

  return (
    <div className="relative w-full aspect-[4/3]">
      {/* Table felt with glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-900 rounded-[50%] border-[6px] border-emerald-950/60 shadow-2xl shadow-emerald-900/30 overflow-hidden">
        {/* Inner rings */}
        <div className="absolute inset-[8%] rounded-[50%] border border-emerald-400/15" />
        <div className="absolute inset-[16%] rounded-[50%] border border-emerald-400/8" />
        <div className="absolute inset-[24%] rounded-[50%] border border-emerald-400/5" />

        {/* Subtle radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" />
      </div>

      {/* Seats */}
      <div className="absolute inset-0">
        {ALL_SEATS.map((seat) => {
          const isHero = seat.position === heroPosition
          const isVillain = seat.position === villainPosition

          return (
            <div
              key={seat.position}
              className="absolute"
              style={{ left: `${seat.x}%`, top: `${seat.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div
                className={`
                  flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-lg
                  ${isHero
                    ? 'bg-white text-gray-900 ring-2 ring-accent shadow-accent/30'
                    : isVillain
                      ? 'bg-white text-gray-900 ring-1 ring-orange-400 shadow-orange-500/15'
                      : 'bg-gray-900/70 text-emerald-200 backdrop-blur-sm'
                  }
                `}
              >
                <span className="text-xs uppercase leading-tight">{seat.label}</span>
                {isHero && (
                  <span className="text-[9px] text-accent uppercase tracking-wider font-bold">Hero</span>
                )}
                {isVillain && openerLabel && (
                  <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">
                    {openerLabel}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Board cards */}
        <div className="flex gap-1.5 mb-2">
          {actionState.board && actionState.board.length > 0 ? (
            actionState.board.map((card, i) => (
              <span
                key={i}
                className={`inline-flex items-center justify-center w-8 h-11 rounded-md bg-slate-50 shadow-md border-2 border-slate-300 text-sm font-bold ${suitColor(card.suit)}`}
              >
                <span className="leading-none drop-shadow-sm">{card.rank}{suitSymbol(card.suit)}</span>
              </span>
            ))
          ) : (
            <div className="flex gap-1.5">
              <span className="inline-flex items-center justify-center w-7 h-10 rounded-md bg-white/10 backdrop-blur-sm text-[10px] text-white/70 font-mono">pre</span>
            </div>
          )}
        </div>

        {/* Hole cards on postflop */}
        {actionState.street !== 'preflop' && (
          <div className="flex gap-1.5 mb-2">
            <span
              className={`inline-flex items-center justify-center w-8 h-11 rounded-md bg-slate-50 shadow-md border-2 border-slate-300 text-sm font-bold ${suitColor(c1.suit)}`}
            >
              <span className="leading-none drop-shadow-sm">{c1.rank}{suitSymbol(c1.suit)}</span>
            </span>
            <span
              className={`inline-flex items-center justify-center w-8 h-11 rounded-md bg-white shadow-md border border-gray-300 text-sm font-bold ${suitColor(c2.suit)}`}
            >
              <span className="leading-none drop-shadow-sm">{c2.rank}{suitSymbol(c2.suit)}</span>
            </span>
          </div>
        )}

        <div className="text-white font-bold text-base drop-shadow-lg">
          Pot: {actionState.pot.toFixed(1)}bb
        </div>
        <div className="text-white/60 text-xs">
          {stackSize}bb eff &middot; {actionState.street}
        </div>
      </div>

      {/* Hole cards on preflop - overlaid on center */}
      {actionState.street === 'preflop' && (
        <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 pointer-events-none">
          <span
            className={`inline-flex items-center justify-center w-9 h-13 rounded-md bg-white shadow-lg border border-gray-300 text-base font-bold ${suitColor(c1.suit)}`}
          >
            <span className="leading-none drop-shadow-sm">{c1.rank}{suitSymbol(c1.suit)}</span>
          </span>
          <span
            className={`inline-flex items-center justify-center w-9 h-13 rounded-md bg-white shadow-lg border border-gray-300 text-base font-bold ${suitColor(c2.suit)}`}
          >
            <span className="leading-none drop-shadow-sm">{c2.rank}{suitSymbol(c2.suit)}</span>
          </span>
        </div>
      )}
    </div>
  )
}
