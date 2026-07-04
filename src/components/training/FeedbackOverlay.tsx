'use client'

import { useEffect, useCallback } from 'react'
import { DecisionResult } from '@/engine/types'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react'

interface FeedbackOverlayProps {
  result: DecisionResult
  onDismiss: () => void
  autoDismissMs?: number
}

export function FeedbackOverlay({ result, onDismiss, autoDismissMs = 1500 }: FeedbackOverlayProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onDismiss()
    }
  }, [onDismiss])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    const timeout = setTimeout(onDismiss, autoDismissMs)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timeout)
    }
  }, [handleKeyDown, onDismiss, autoDismissMs])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in-up">
      <div className={cn(
        'flex flex-col items-center gap-4 p-8 rounded-2xl shadow-2xl border-2 max-w-sm text-center',
        'animate-scale-in',
        result.isCorrect
          ? 'bg-green-950/90 border-success text-green-100 dark:bg-green-950/90'
          : 'bg-red-950/90 border-destructive text-red-100 dark:bg-red-950/90'
      )}>
        {result.isCorrect ? (
          <div className="size-14 rounded-full bg-success/20 flex items-center justify-center animate-scale-in">
            <CheckCircle2 className="size-8 text-success" />
          </div>
        ) : (
          <div className="size-14 rounded-full bg-destructive/20 flex items-center justify-center animate-scale-in">
            <XCircle className="size-8 text-destructive" />
          </div>
        )}

        <div className="text-2xl font-bold flex items-center gap-2">
          {result.isCorrect ? 'Correct!' : 'Incorrect'}
          {result.isCorrect && <Sparkles className="size-5 text-accent" />}
        </div>

        {!result.isCorrect && (
          <div className="flex items-center gap-2 text-lg">
            <span className="text-green-300/70">Correct:</span>
            <span className="font-bold uppercase text-green-300">{result.correctAction}</span>
            {result.frequency && result.frequency < 1 && (
              <span className="text-sm opacity-80 ml-1">
                ({Math.round(result.frequency * 100)}%)
              </span>
            )}
          </div>
        )}

        {result.frequency && result.frequency < 1 && (
          <div className="text-xs px-3 py-1 rounded-full bg-foreground/10">
            Mixed strategy spot
          </div>
        )}

        {result.explanation && (
          <div className="text-sm opacity-80 max-w-xs leading-relaxed">
            {result.explanation}
          </div>
        )}

        <div className="text-xs opacity-50 mt-1 flex items-center gap-1">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-foreground/10 text-[10px] font-mono">Space</kbd>
          <span>or</span>
          <kbd className="px-1.5 py-0.5 rounded bg-foreground/10 text-[10px] font-mono">Enter</kbd>
          <span>to continue</span>
        </div>
      </div>
    </div>
  )
}
