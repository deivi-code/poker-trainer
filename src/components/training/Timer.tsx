'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TimerProps {
  startTime: number
  isActive: boolean
  onTimeUp?: () => void
  limitMs?: number
}

export function Timer({ startTime, isActive, onTimeUp, limitMs }: TimerProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => {
      const now = Date.now()
      const diff = now - startTime
      setElapsed(diff)
      if (limitMs && diff >= limitMs) {
        onTimeUp?.()
        clearInterval(interval)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [startTime, isActive, limitMs, onTimeUp])

  if (!isActive) return null

  const seconds = Math.floor(elapsed / 1000)
  const tenths = Math.floor((elapsed % 1000) / 100)

  const isUrgent = limitMs ? elapsed > limitMs * 0.75 : false
  const isCritical = limitMs ? elapsed > limitMs * 0.9 : false

  return (
    <span
      className={cn(
        'font-mono text-lg tabular-nums transition-colors duration-300',
        isCritical
          ? 'text-destructive animate-pulse'
          : isUrgent
            ? 'text-accent'
            : 'text-muted-foreground'
      )}
    >
      {seconds}.{tenths}s
    </span>
  )
}
