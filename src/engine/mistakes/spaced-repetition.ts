import { Mistake, Spot } from '../types'

export interface MistakeStore {
  mistakes: Map<string, Mistake>
  add(mistake: Mistake): void
  get(id: string): Mistake | undefined
  getAll(): Mistake[]
  update(id: string, updates: Partial<Mistake>): void
  getDueMistakes(limit: number): Mistake[]
  getPriorityMistakes(count: number): Mistake[]
  remove(id: string): void
}

export function createMistakeStore(): MistakeStore {
  const mistakes = new Map<string, Mistake>()
  if (typeof window !== 'undefined') {
    try {
      const saved = JSON.parse(window.localStorage.getItem('poker-trainer-mistakes') ?? '[]') as Mistake[]
      saved.forEach((mistake) => mistakes.set(mistake.id, mistake))
    } catch { /* ignore malformed local data */ }
  }

  return {
    mistakes,

    add(mistake: Mistake) {
      mistakes.set(mistake.id, mistake)
      persistMistakes(mistakes)
    },

    get(id: string) {
      return mistakes.get(id)
    },

    getAll() {
      return Array.from(mistakes.values())
    },

    update(id: string, updates: Partial<Mistake>) {
      const existing = mistakes.get(id)
      if (existing) {
        mistakes.set(id, { ...existing, ...updates })
        persistMistakes(mistakes)
      }
    },

    getDueMistakes(limit: number) {
      const now = Date.now()
      return Array.from(mistakes.values())
        .filter(m => m.nextReviewAt <= now)
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, limit)
    },

    getPriorityMistakes(count: number) {
      return Array.from(mistakes.values())
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, count)
    },

    remove(id: string) {
      mistakes.delete(id)
      persistMistakes(mistakes)
    },
  }
}

function persistMistakes(mistakes: Map<string, Mistake>): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('poker-trainer-mistakes', JSON.stringify(Array.from(mistakes.values())))
}

const BASE_INTERVALS_MS = [
  0,
  60 * 1000,
  5 * 60 * 1000,
  30 * 60 * 1000,
  2 * 60 * 60 * 1000,
  6 * 60 * 60 * 1000,
  24 * 60 * 60 * 1000,
]

export function calculateNextReview(
  mistake: Mistake,
  wasCorrect: boolean
): { nextReviewAt: number; newPriority: number } {
  const now = Date.now()

  if (wasCorrect) {
    const currentIntervalIndex = mistake.frequency
    const nextIndex = Math.min(currentIntervalIndex + 1, BASE_INTERVALS_MS.length - 1)
    const nextReviewAt = now + BASE_INTERVALS_MS[nextIndex]
    const newPriority = Math.max(mistake.priorityScore * 0.7, 0.1)
    return { nextReviewAt, newPriority }
  }

  const nextReviewAt = now + BASE_INTERVALS_MS[0]
  const newPriority = Math.min(mistake.priorityScore * 1.5, 1.0)
  return { nextReviewAt, newPriority }
}

export function calculatePriorityScore(
  errorType: Mistake['errorType'],
  frequency: number,
  recencyFactor: number
): number {
  const typeWeight = errorType === 'wrong-action' ? 1.0 : errorType === 'wrong-size' ? 0.7 : 0.5
  const freqFactor = Math.min(frequency / 10, 1.0)
  const recencyWeight = Math.max(0.1, 1.0 - recencyFactor)

  return Math.min(typeWeight * 0.4 + freqFactor * 0.4 + recencyWeight * 0.2, 1.0)
}

export interface MistakeInjector {
  injectMistakes(count: number): Spot[]
  shouldInject(count: number, ratio: number): number
}

export function createMistakeInjector(
  mistakeStore: MistakeStore,
  spotGenerator: (config?: any) => Spot
): MistakeInjector {

  function shouldInject(totalDecisions: number, ratio: number): number {
    const available = mistakeStore.getPriorityMistakes(totalDecisions).length
    return Math.min(Math.ceil(totalDecisions * ratio), available)
  }

  function injectMistakes(count: number): Spot[] {
    return mistakeStore.getPriorityMistakes(count).map(m => m.spotSnapshot)
  }

  return { injectMistakes, shouldInject }
}

export function createMistakeFromAttempt(
  spot: Spot,
  userAction: string,
  errorType: Mistake['errorType']
): Mistake {
  return {
    id: `mistake-${spot.id}-${Date.now()}`,
    userId: 'local',
    spotId: spot.id,
    spotSnapshot: { ...spot },
    errorType,
    priorityScore: 0.8,
    frequency: 1,
    lastReviewAt: Date.now(),
    nextReviewAt: Date.now(),
  }
}
