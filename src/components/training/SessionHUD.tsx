'use client'

import { useTrainingStore } from '@/store/training-store'
import { Flame, Target } from 'lucide-react'

export function SessionHUD() {
  const { currentIndex, totalDecisions, sessionManager } = useTrainingStore()
  const session = sessionManager?.getCurrentSession()

  const attempts = session?.attempts ?? []
  const recentCorrect = attempts.filter(a => a.isCorrect).length
  const streak = getStreak(attempts)
  const accuracy = attempts.length > 0 ? Math.round(recentCorrect / attempts.length * 100) : 100
  const progress = totalDecisions > 0 ? (currentIndex / totalDecisions) * 100 : 0

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-1 text-sm">
        <div className="flex items-center gap-4">
          <span className="font-mono text-muted-foreground tabular-nums">
            {currentIndex + 1}<span className="text-muted-foreground/50">/{totalDecisions}</span>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Target className="size-3" />
            <span className={accuracy > 70 ? 'text-success' : accuracy > 40 ? 'text-accent' : 'text-destructive'}>
              {accuracy}%
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          {streak >= 3 && (
            <Flame className="size-4 text-orange-500 animate-pulse" />
          )}
          <span className={cn(
            'font-mono tabular-nums',
            streak >= 5 ? 'text-accent font-bold' : streak >= 3 ? 'text-orange-400' : 'text-muted-foreground'
          )}>
            {streak}
          </span>
          <span className="text-xs text-muted-foreground/60">streak</span>
        </div>
      </div>
    </div>
  )
}

function getStreak(attempts: { isCorrect: boolean }[]): number {
  let streak = 0
  for (let i = attempts.length - 1; i >= 0; i--) {
    if (attempts[i].isCorrect) streak++
    else break
  }
  return streak
}

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
