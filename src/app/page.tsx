'use client'

import Link from 'next/link'
import { useSessionStore } from '@/store/session-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Zap, Goal, Grid3X3, ArrowRight, Keyboard, Sparkles, TrendingUp, Clock } from 'lucide-react'

const features = [
  {
    href: '/train',
    icon: Zap,
    title: 'Train',
    desc: 'Rapid-fire decision training with spaced repetition',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    href: '/mistakes',
    icon: Goal,
    title: 'Mistakes',
    desc: 'Review and reinforce your weakest spots',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  {
    href: '/range-painter',
    icon: Grid3X3,
    title: 'Range Painter',
    desc: 'Build and visualize poker ranges',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
]

export default function HomePage() {
  const { sessionHistory, stats } = useSessionStore()
  const hasSessions = sessionHistory.length > 0

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-8 animate-fade-in-up">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10 text-primary mb-2 ring-1 ring-primary/20">
            <Sparkles className="size-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-primary">♠</span> Poker Trainer
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
            Master your preflop and postflop decisions with rapid-fire repetition and smart spaced review.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-3">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <Link
                key={f.href}
                href={f.href}
                className="group block animate-fade-in-up"
                style={{ animationDelay: `${(i + 1) * 150}ms` }}
              >
                <Card className="p-4 flex items-center gap-4 hover:ring-2 hover:ring-primary/30 transition-all hover:-translate-y-0.5 duration-200">
                  <div className={`p-2.5 rounded-xl ${f.bg} ${f.color}`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{f.title}</div>
                    <div className="text-xs text-muted-foreground">{f.desc}</div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Quick stats */}
        {hasSessions && (
          <Card className="p-4 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="size-3" />
                Your Progress
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold">{sessionHistory.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Sessions</div>
              </div>
              <div>
                <div className="text-xl font-bold">{Math.round(stats.overallAccuracy * 100)}%</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Accuracy</div>
              </div>
              <div>
                <div className="text-xl font-bold">{stats.totalDecisions}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Hands</div>
              </div>
            </div>
          </Card>
        )}

        {/* CTA */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <Link href="/train">
            <Button variant="gold" size="xl" className="w-full gap-2 text-base">
              Start Training
              <Zap className="size-4" />
            </Button>
          </Link>
        </div>

        {/* Keyboard hints */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground animate-fade-in-up" style={{ animationDelay: '700ms' }}>
          <span className="flex items-center gap-1">
            <Keyboard className="size-3" />
            F C R — Fold Call Raise
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            ~3s per decision
          </span>
        </div>
      </div>
    </div>
  )
}
