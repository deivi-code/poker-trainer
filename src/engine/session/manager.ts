import { Spot, Attempt, SessionConfig, TrainingSession, SessionSummary } from '../types'
import { generateSpot } from '../spots/generator'
import { evaluateDecision } from '../evaluation/evaluator'
import { MistakeStore, MistakeInjector, calculatePriorityScore, createMistakeFromAttempt, calculateNextReview } from '../mistakes/spaced-repetition'

export class SessionManager {
  private session: TrainingSession | null = null
  private mistakeStore: MistakeStore
  private injector: MistakeInjector

  constructor(mistakeStore: MistakeStore, injector: MistakeInjector) {
    this.mistakeStore = mistakeStore
    this.injector = injector
  }

  startSession(config: SessionConfig, userId: string = 'local'): TrainingSession {
    this.session = {
      id: `session-${Date.now()}`,
      userId,
      startTime: Date.now(),
      endTime: null,
      config,
      attempts: [],
      accuracy: 0,
      avgTimeMs: 0,
      status: 'active',
    }
    return this.session
  }

  endSession(): TrainingSession | null {
    if (!this.session) return null
    this.session.endTime = Date.now()
    this.session.status = 'completed'
    this.session.accuracy = this.calculateAccuracy()
    this.session.avgTimeMs = this.calculateAvgTime()
    return this.session
  }

  getCurrentSession(): TrainingSession | null {
    return this.session
  }

  generateDecisions(count: number): Spot[] {
    if (!this.session) return []

    const mistakeRatio = this.session.config.mistakeRatio
    const mistakeCount = this.injector.shouldInject(count, mistakeRatio)

    const mistakesSpots = this.injector.injectMistakes(mistakeCount)
    const freshSpots: Spot[] = []
    for (let i = 0; i < count - mistakeCount; i++) {
      freshSpots.push(generateSpot())
    }

    return [...mistakesSpots, ...freshSpots].sort(() => Math.random() - 0.5)
  }

  processDecision(spot: Spot, userAction: string, decisionTimeMs: number): {
    attempt: Attempt
    isCorrect: boolean
    explanation: string
  } {
    const result = evaluateDecision(spot, userAction as any)

    const attempt: Attempt = {
      id: `attempt-${spot.id}-${Date.now()}`,
      userId: this.session!.userId,
      spotId: spot.id,
      userAction: userAction as any,
      correctAction: result.correctAction,
      isCorrect: result.isCorrect,
      decisionTimeMs,
      timestamp: Date.now(),
    }

    if (this.session) {
      this.session.attempts.push(attempt)
    }

    if (!result.isCorrect) {
      const mistake = createMistakeFromAttempt(spot, userAction, 'wrong-action')
      const existing = this.mistakeStore.getAll().find(m => m.spotId === spot.id)
      if (existing) {
        const { nextReviewAt, newPriority } = calculateNextReview(existing, false)
        this.mistakeStore.update(existing.id, {
          frequency: existing.frequency + 1,
          priorityScore: newPriority,
          nextReviewAt,
          lastReviewAt: Date.now(),
        })
      } else {
        this.mistakeStore.add(mistake)
      }
    } else {
      const existing = this.mistakeStore.getAll().find(m => m.spotId === spot.id)
      if (existing) {
        const { nextReviewAt, newPriority } = calculateNextReview(existing, true)
        this.mistakeStore.update(existing.id, {
          frequency: Math.max(existing.frequency - 1, 0),
          priorityScore: newPriority,
          nextReviewAt,
          lastReviewAt: Date.now(),
        })
      }
    }

    return { attempt, isCorrect: result.isCorrect, explanation: result.explanation }
  }

  getSummary(): SessionSummary | null {
    if (!this.session || this.session.attempts.length === 0) return null

    const attempts = this.session.attempts
    const totalDecisions = attempts.length
    const correctCount = attempts.filter(a => a.isCorrect).length
    const accuracy = totalDecisions > 0 ? correctCount / totalDecisions : 0
    const totalTime = attempts.reduce((sum, a) => sum + a.decisionTimeMs, 0)
    const avgTimeMs = totalDecisions > 0 ? totalTime / totalDecisions : 0

    const mistakesByType: Record<string, number> = {}
    const mistakes = this.mistakeStore.getAll()
    mistakes.forEach(m => {
      mistakesByType[m.errorType] = (mistakesByType[m.errorType] || 0) + 1
    })

    const weakestSpots = this.identifyWeakestSpots()

    return {
      sessionId: this.session.id,
      totalDecisions,
      accuracy,
      avgDecisionTimeMs: avgTimeMs,
      mistakesByType,
      weakestSpots,
      percentiles: {
        accuracy: Math.round(accuracy * 100),
        speed: Math.round(Math.max(0, 100 - (avgTimeMs - 1000) / 20)),
      },
    }
  }

  private calculateAccuracy(): number {
    if (!this.session || this.session.attempts.length === 0) return 0
    const correct = this.session.attempts.filter(a => a.isCorrect).length
    return correct / this.session.attempts.length
  }

  private calculateAvgTime(): number {
    if (!this.session || this.session.attempts.length === 0) return 0
    const total = this.session.attempts.reduce((sum, a) => sum + a.decisionTimeMs, 0)
    return total / this.session.attempts.length
  }

  private identifyWeakestSpots(): { spotType: string; errorRate: number }[] {
    const mistakes = this.mistakeStore.getAll()
    const spotCounts: Record<string, { total: number; errors: number }> = {}

    if (this.session) {
      for (const attempt of this.session.attempts) {
        const key = attempt.spotId.split('-').slice(0, 2).join('-')
        if (!spotCounts[key]) spotCounts[key] = { total: 0, errors: 0 }
        spotCounts[key].total++
        if (!attempt.isCorrect) spotCounts[key].errors++
      }
    }

    return Object.entries(spotCounts)
      .map(([spotType, counts]) => ({
        spotType,
        errorRate: counts.total > 0 ? counts.errors / counts.total : 0,
      }))
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5)
  }
}
