import { create } from 'zustand'
import { Spot, DecisionResult, SessionConfig, SessionSummary } from '../engine/types'
import { generateSpot } from '../engine/spots/generator'
import { SessionManager } from '../engine/session/manager'
import { createMistakeStore, createMistakeInjector } from '../engine/mistakes/spaced-repetition'
import { saveAttempt, saveSession, saveMistake } from '@/app/actions/session'

interface TrainingState {
  sessionManager: SessionManager | null
  currentSpot: Spot | null
  previousResult: DecisionResult | null
  spotQueue: Spot[]
  currentIndex: number
  totalDecisions: number
  isComplete: boolean
  isSessionActive: boolean
  decisionStartTime: number
  summary: SessionSummary | null

  startSession: (config: SessionConfig, userId?: string) => void
  nextSpot: () => void
  submitDecision: (action: string) => void
  endSession: () => void
  clearFeedback: () => void
}

const mistakeStore = createMistakeStore()

function getUserId(manager: SessionManager): string | null {
  const uid = manager.getCurrentSession()?.userId
  return uid && uid !== 'local' ? uid : null
}

export const useTrainingStore = create<TrainingState>((set, get) => ({
  sessionManager: null,
  currentSpot: null,
  previousResult: null,
  spotQueue: [],
  currentIndex: 0,
  totalDecisions: 0,
  isComplete: false,
  isSessionActive: false,
  decisionStartTime: 0,
  summary: null,

  startSession: (config: SessionConfig, userId?: string) => {
    const injector = createMistakeInjector(mistakeStore, generateSpot)
    const manager = new SessionManager(mistakeStore, injector)
    manager.startSession(config, userId)
    const spots = manager.generateDecisions(config.totalDecisions)

    set({
      sessionManager: manager,
      spotQueue: spots.slice(1),
      currentSpot: spots[0] || generateSpot(),
      previousResult: null,
      currentIndex: 0,
      totalDecisions: config.totalDecisions,
      isComplete: false,
      isSessionActive: true,
      decisionStartTime: Date.now(),
      summary: null,
    })
  },

  nextSpot: () => {
    const state = get()
    const manager = state.sessionManager
    if (!manager || !state.isSessionActive) return

    const nextIndex = state.currentIndex + 1
    if (nextIndex >= state.totalDecisions) {
      const summary = manager.getSummary()
      const ended = manager.endSession()
      persistSession(ended)
      set({
        isComplete: true,
        isSessionActive: false,
        summary,
        currentSpot: null,
        spotQueue: [],
      })
      return
    }

    const queue = [...state.spotQueue]
    const next = queue.shift()
    if (!next) return

    set({
      currentSpot: next,
      spotQueue: queue,
      previousResult: null,
      currentIndex: nextIndex,
      decisionStartTime: Date.now(),
    })
  },

  submitDecision: (action: string) => {
    const state = get()
    const manager = state.sessionManager
    const spot = state.currentSpot
    if (!manager || !spot) return

    const decisionTime = Date.now() - state.decisionStartTime
    const result = manager.processDecision(spot, action, decisionTime)

    const uid = getUserId(manager)
    if (uid) {
      saveAttempt({
        spotId: result.attempt.spotId,
        userAction: result.attempt.userAction,
        correctAction: result.attempt.correctAction,
        isCorrect: result.attempt.isCorrect,
        decisionTimeMs: result.attempt.decisionTimeMs,
      }).catch(() => {})

      if (!result.isCorrect) {
        saveMistake({
          spotId: result.attempt.spotId,
          errorType: 'wrong-action',
          priorityScore: 1,
        }).catch(() => {})
      }
    }

    set({
      previousResult: {
        correctAction: result.attempt.correctAction,
        isCorrect: result.isCorrect,
        explanation: result.explanation,
      },
    })
  },

  endSession: () => {
    const state = get()
    const manager = state.sessionManager
    if (!manager) return

    const summary = manager.getSummary()
    const ended = manager.endSession()
    persistSession(ended)
    set({
      isComplete: true,
      isSessionActive: false,
      summary,
      currentSpot: null,
      spotQueue: [],
    })
  },

  clearFeedback: () => {
    set({ previousResult: null })
  },
}))

function persistSession(session: any) {
  if (!session || session.userId === 'local') return
  saveSession({
    config: {
      totalDecisions: session.config.totalDecisions,
      mistakeBoost: session.config.mistakeBoost,
      mistakeRatio: session.config.mistakeRatio,
    },
    accuracy: session.accuracy,
    avgTimeMs: session.avgTimeMs,
    totalDecisions: session.attempts.length,
  }).catch(() => {})
}
