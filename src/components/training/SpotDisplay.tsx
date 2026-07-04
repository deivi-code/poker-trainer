'use client'

import { Spot } from '@/engine/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SpotDisplayProps {
  spot: Spot
}

function suitSymbol(suit: string): string {
  const symbols: Record<string, string> = { h: '♥', d: '♦', c: '♣', s: '♠' }
  return symbols[suit] || suit
}

function suitClass(suit: string): string {
  return suit === 'h' || suit === 'd' ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'
}

export function SpotDisplay({ spot }: SpotDisplayProps) {
  const { heroHand, heroPosition, villainPosition, actionState, stackSize } = spot

  const [c1, c2] = heroHand.cards

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Format</span>
          <p className="font-semibold text-sm">{spot.format === 'cash' ? 'Cash Game' : 'Tournament'}</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {stackSize}bb
        </Badge>
      </div>

      <div className="text-center space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Action State</div>
        <div className="font-medium text-sm">
          {villainPosition && (
            <span className="text-muted-foreground">{villainPosition} opens </span>
          )}
          <span className="text-primary font-bold">{heroPosition}</span>
        </div>
      </div>

      <div className="flex justify-center gap-3 py-4">
        <div className={`inline-flex items-center gap-1 px-4 py-3 rounded-xl border-2 border-foreground/10 bg-card shadow-sm text-2xl font-bold ${suitClass(c1.suit)}`}>
          <span>{c1.rank}</span>
          <span>{suitSymbol(c1.suit)}</span>
        </div>
        <div className={`inline-flex items-center gap-1 px-4 py-3 rounded-xl border-2 border-foreground/10 bg-card shadow-sm text-2xl font-bold ${suitClass(c2.suit)}`}>
          <span>{c2.rank}</span>
          <span>{suitSymbol(c2.suit)}</span>
        </div>
      </div>

      <div className="text-center">
        <span className="text-sm font-mono text-muted-foreground">{heroHand.notation}</span>
      </div>

      {actionState.board && actionState.board.length > 0 && (
        <div className="flex justify-center gap-1.5">
          {actionState.board.map((card, i) => (
            <span key={i} className={`text-lg font-bold ${suitClass(card.suit)}`}>
              {card.rank}{suitSymbol(card.suit)}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <div className="bg-card p-2.5 rounded-lg ring-1 ring-border">
          <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Pot</div>
          <div className="font-mono font-semibold text-foreground">{actionState.pot.toFixed(1)}bb</div>
        </div>
        <div className="bg-card p-2.5 rounded-lg ring-1 ring-border">
          <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Stack</div>
          <div className="font-mono font-semibold text-foreground">
            {(stackSize - (actionState.lastBetSize ?? 0)).toFixed(0)}bb
          </div>
        </div>
        <div className="bg-card p-2.5 rounded-lg ring-1 ring-border">
          <div className="text-muted-foreground text-[10px] uppercase tracking-wider">SPR</div>
          <div className="font-mono font-semibold text-foreground">
            {actionState.stackToPot.toFixed(1)}
          </div>
        </div>
      </div>
    </Card>
  )
}
