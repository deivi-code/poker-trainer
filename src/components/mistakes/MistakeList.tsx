'use client'

import { useState } from 'react'
import { Mistake } from '@/engine/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, Crosshair } from 'lucide-react'

interface MistakeListProps {
  mistakes: Mistake[]
  onReview: (mistake: Mistake) => void
}

export function MistakeList({ mistakes, onReview }: MistakeListProps) {
  const [now] = useState(() => Date.now())

  if (mistakes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3 animate-fade-in-up">
        <div className="size-12 rounded-full bg-success/10 flex items-center justify-center">
          <Crosshair className="size-6 text-success" />
        </div>
        <p className="text-sm">No mistakes yet. Keep up the good work!</p>
      </div>
    )
  }

  const sorted = [...mistakes].sort((a, b) => b.priorityScore - a.priorityScore)

  return (
    <div className="space-y-2">
      {sorted.map((mistake, i) => {
        const spot = mistake.spotSnapshot
        const isDue = mistake.nextReviewAt <= now

        return (
          <Card
            key={mistake.id}
            className="p-4 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all hover:-translate-y-0.5 duration-200 animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
            onClick={() => onReview(mistake)}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{spot.heroHand.notation}</span>
                  <Badge variant={mistake.errorType === 'wrong-action' ? 'destructive' : 'secondary'} className="text-[10px]">
                    {mistake.errorType === 'wrong-action' ? 'Wrong Action' : mistake.errorType}
                  </Badge>
                  {isDue && (
                    <Badge variant="outline" className="text-[10px] border-accent text-accent">
                      <Clock className="size-2.5 mr-0.5" />
                      Due
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Crosshair className="size-3" />
                  {spot.heroPosition} vs {spot.villainPosition} &middot; {spot.format} &middot; {spot.stackSize}bb
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="size-3" />
                  Priority
                </div>
                <div className={cn(
                  'font-mono text-sm font-bold',
                  mistake.priorityScore > 0.7 ? 'text-destructive' : mistake.priorityScore > 0.4 ? 'text-accent' : 'text-muted-foreground'
                )}>
                  {Math.round(mistake.priorityScore * 100)}%
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
