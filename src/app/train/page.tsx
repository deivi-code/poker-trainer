'use client'

import { useEffect, useCallback, useState } from 'react'
import { useTrainingStore } from '@/store/training-store'
import { useAuth } from '@/lib/auth-context'
import { SpotDisplay } from '@/components/training/SpotDisplay'
import { PokerTableView } from '@/components/training/PokerTableView'
import { ActionButtons } from '@/components/training/ActionButtons'
import { FeedbackOverlay } from '@/components/training/FeedbackOverlay'
import { SessionHUD } from '@/components/training/SessionHUD'
import { Timer } from '@/components/training/Timer'
import { RangeReference } from '@/components/training/RangeReference'
import { SessionSummaryView } from '@/components/session/SessionSummary'
import { cn } from '@/lib/utils'
import { Zap, Sparkles, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import type { TrainingMode } from '@/engine/types'

const SESSION_SIZES = [
  { count: 20, label: 'Quick', desc: '20 decisions · ~5 min', icon: Zap },
  { count: 50, label: 'Standard', desc: '50 decisions · ~12 min', icon: Sparkles },
  { count: 100, label: 'Deep', desc: '100 decisions · ~25 min', icon: ArrowRight },
]

export default function TrainPage() {
  const { user } = useAuth()
  const {
    currentSpot,
    previousResult,
    isSessionActive,
    isComplete,
    summary,
    decisionStartTime,
    startSession,
    nextSpot,
    submitDecision,
    endSession,
    clearFeedback,
    sessionManager,
  } = useTrainingStore()

  const [showSetup, setShowSetup] = useState(true)
  const [showRange, setShowRange] = useState(true)
  const [selectedSize, setSelectedSize] = useState<number | null>(null)
  const [trainingMode, setTrainingMode] = useState<TrainingMode>('both')
  const [tableView, setTableView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('poker-trainer-view') !== 'text'
    }
    return true
  })

  useEffect(() => {
    localStorage.setItem('poker-trainer-view', tableView ? 'table' : 'text')
  }, [tableView])

  const handleStart = useCallback((count: number) => {
    startSession({ totalDecisions: count, mistakeBoost: true, mistakeRatio: 0.3, timeLimit: null, trainingMode }, user?.id)
    setShowSetup(false)
  }, [startSession, user])

  const handleAction = useCallback((action: string) => {
    if (!isSessionActive || previousResult) return
    submitDecision(action)
  }, [isSessionActive, previousResult, submitDecision])

  const handleFeedbackDismiss = useCallback(() => {
    clearFeedback()
    nextSpot()
  }, [clearFeedback, nextSpot])

  const handleNewSession = useCallback(() => {
    setShowSetup(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSessionActive || previousResult) return
      const keyMap: Record<string, string> = {
        'f': 'fold',
        'c': 'call',
        'r': 'raise',
        'k': 'check',
        'a': 'all-in',
        '1': 'fold',
        '2': 'call',
        '3': 'raise',
      }
      const action = keyMap[e.key.toLowerCase()]
      if (action) {
        e.preventDefault()
        handleAction(action)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSessionActive, previousResult, handleAction])

  if (isComplete && summary) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <SessionSummaryView summary={summary} onNewSession={handleNewSession} />
      </div>
    )
  }

  if (showSetup) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-sm w-full space-y-6 animate-fade-in-up">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary mb-1 ring-1 ring-primary/20">
              <Zap className="size-6" />
            </div>
            <h1 className="text-2xl font-bold">Poker Trainer</h1>
            <p className="text-sm text-muted-foreground">
              Train your preflop and postflop decisions with rapid-fire repetition
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-card p-1.5" role="group" aria-label="Exercise type">
            {([
              ['preflop', 'Preflop'],
              ['postflop', 'Postflop'],
              ['both', 'Both'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTrainingMode(mode)}
                className={cn(
                  'rounded-lg px-2 py-2 text-xs font-semibold transition-colors',
                  trainingMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                )}
                aria-pressed={trainingMode === mode}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">Choose which spots to practice</p>

          <div className="space-y-2.5">
            {SESSION_SIZES.map((s, i) => {
              const Icon = s.icon
              const isSelected = selectedSize === s.count
              return (
                <button
                  key={s.count}
                  onClick={() => {
                    setSelectedSize(s.count)
                    handleStart(s.count)
                  }}
                  style={{ animationDelay: `${(i + 1) * 100}ms` }}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all animate-fade-in-up',
                    'hover:-translate-y-0.5 active:scale-[0.99]',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                      : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-lg',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </div>
                  <ArrowRight className={cn(
                    'size-4 transition-all',
                    isSelected ? 'text-primary translate-x-0.5' : 'text-muted-foreground'
                  )} />
                </button>
              )
            })}
          </div>

          {!user && (
            <div className="text-center text-xs text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              Training locally —{' '}
              <a href="/auth/login" className="text-primary hover:underline font-medium">sign in</a>
              {' '}to save your progress.
            </div>
          )}

          <div className="text-center text-xs text-muted-foreground space-y-1 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <p><span className="font-mono text-primary">F C R</span> or <span className="font-mono text-primary">1 2 3</span> = Fold Call Raise</p>
            <p>Spots re-enter from mistakes via spaced repetition</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentSpot) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full p-4 gap-4 animate-fade-in-up">
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <SessionHUD />

        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            {sessionManager?.getCurrentSession()?.attempts.filter(a => a.isCorrect).length ?? 0} correct
          </span>
          <Timer startTime={decisionStartTime} isActive={isSessionActive && !previousResult} />
        </div>

        <div className="flex gap-1.5 items-center">
          <button
            onClick={() => setTableView(false)}
            className={cn(
              'text-xs px-2.5 py-1 rounded-md font-medium transition-all',
              !tableView
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            Text
          </button>
          <button
            onClick={() => setTableView(true)}
            className={cn(
              'text-xs px-2.5 py-1 rounded-md font-medium transition-all',
              tableView
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            Table
          </button>
        </div>

        {tableView ? (
          <PokerTableView spot={currentSpot} />
        ) : (
          <SpotDisplay spot={currentSpot} />
        )}

        <button
          onClick={() => setShowRange(v => !v)}
          className={cn(
            'lg:hidden text-xs flex items-center justify-center gap-1 py-1.5 rounded-md transition-all',
            showRange
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {showRange ? <><ChevronUp className="size-3" /> Hide Range Reference</> : <><ChevronDown className="size-3" /> Show Range Reference</>}
        </button>

        <div className="flex-1 flex items-end pb-4">
          <ActionButtons
            onAction={handleAction}
            disabled={!isSessionActive || !!previousResult}
            street={currentSpot.actionState.street}
          />
        </div>

        <button
          onClick={endSession}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 text-center transition-colors"
        >
          End Session Early
        </button>

        {previousResult && (
          <FeedbackOverlay
            result={previousResult}
            onDismiss={handleFeedbackDismiss}
          />
        )}
      </div>

      <div className={cn(
        'w-full lg:w-72 shrink-0',
        !showRange && 'hidden lg:block'
      )}>
        <div className="lg:sticky lg:top-20">
          <RangeReference spot={currentSpot} isOpen={showRange} />
        </div>
      </div>
    </div>
  )
}
