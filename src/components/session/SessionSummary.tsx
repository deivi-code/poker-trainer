'use client'

import { SessionSummary as SessionSummaryType } from '@/engine/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Trophy, RotateCcw, Target, Clock, Zap, AlertCircle } from 'lucide-react'

interface SessionSummaryViewProps {
  summary: SessionSummaryType
  onNewSession: () => void
}

export function SessionSummaryView({ summary, onNewSession }: SessionSummaryViewProps) {
  const accuracyPct = Math.round(summary.accuracy * 100)
  const isGreatScore = accuracyPct >= 80
  const isGoodScore = accuracyPct >= 60

  return (
    <div className="max-w-lg mx-auto space-y-6 p-4 w-full animate-fade-in-up">
      <div className="text-center space-y-2">
        <div className={cn(
          'inline-flex items-center justify-center size-16 rounded-2xl mx-auto mb-2 ring-1',
          isGreatScore ? 'bg-success/10 text-success ring-success/20' : isGoodScore ? 'bg-accent/10 text-accent ring-accent/20' : 'bg-destructive/10 text-destructive ring-destructive/20'
        )}>
          {isGreatScore ? <Trophy className="size-8" /> : <Target className="size-8" />}
        </div>
        <h2 className="text-2xl font-bold">Session Complete</h2>
      </div>

      {/* Main score card */}
      <Card className="p-6 space-y-4 animate-scale-in">
        <div className="text-center">
          <div className="text-6xl font-bold mb-1 tabular-nums">
            {accuracyPct}<span className="text-2xl text-muted-foreground">%</span>
          </div>
          <div className="text-sm text-muted-foreground">Overall Accuracy</div>
        </div>

        <Progress
          value={accuracyPct}
          className="h-3"
          indicatorClassName={cn(
            isGreatScore ? 'bg-success' : isGoodScore ? 'bg-accent' : 'bg-destructive'
          )}
        />

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-xl font-semibold">
              <Zap className="size-4 text-primary" />
              {summary.totalDecisions}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Decisions</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-xl font-semibold">
              <Clock className="size-4 text-accent" />
              {(summary.avgDecisionTimeMs / 1000).toFixed(1)}s
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Time</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-xl font-semibold">
              <Target className="size-4 text-success" />
              {accuracyPct}%
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Accuracy</div>
          </div>
        </div>
      </Card>

      {/* Weakest spots */}
      {summary.weakestSpots.length > 0 && (
        <Card className="p-4 space-y-3 animate-fade-in-up">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="size-3" />
            Weakest Spots
          </h3>
          {summary.weakestSpots.map((spot, i) => (
            <div key={i} className="flex justify-between items-center py-1">
              <span className="text-sm font-mono">{spot.spotType}</span>
              <Badge variant={spot.errorRate > 0.5 ? 'destructive' : spot.errorRate > 0.2 ? 'secondary' : 'success'}>
                {Math.round(spot.errorRate * 100)}% errors
              </Badge>
            </div>
          ))}
        </Card>
      )}

      {/* Percentiles */}
      <div className="grid grid-cols-2 gap-2 text-center text-xs text-muted-foreground">
        <div className="bg-card p-3 rounded-xl ring-1 ring-border">
          <div className="text-foreground font-semibold text-sm">{summary.percentiles.speed}th</div>
          <div>Speed percentile</div>
        </div>
        <div className="bg-card p-3 rounded-xl ring-1 ring-border">
          <div className="text-foreground font-semibold text-sm">{summary.percentiles.accuracy}th</div>
          <div>Accuracy percentile</div>
        </div>
      </div>

      {/* CTA */}
      <Button
        onClick={onNewSession}
        variant="gold"
        size="xl"
        className="w-full gap-2"
      >
        <RotateCcw className="size-4" />
        New Session
      </Button>
    </div>
  )
}

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
