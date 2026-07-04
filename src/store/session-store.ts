import { create } from 'zustand'
import { SessionSummary, SessionConfig, Attempt, Mistake } from '../engine/types'

interface SessionState {
  sessionHistory: SessionSummary[]
  recentAttempts: Attempt[]
  mistakeList: Mistake[]
  config: SessionConfig
  stats: {
    totalDecisions: number
    overallAccuracy: number
    totalMistakes: number
    currentStreak: number
    bestStreak: number
  }

  setConfig: (config: Partial<SessionConfig>) => void
  addSessionSummary: (summary: SessionSummary) => void
  addRecentAttempts: (attempts: Attempt[]) => void
  setMistakeList: (mistakes: Mistake[]) => void
  updateStats: () => void
  recalculateStats: () => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionHistory: [],
  recentAttempts: [],
  mistakeList: [],
  config: {
    totalDecisions: 30,
    mistakeBoost: true,
    mistakeRatio: 0.3,
    timeLimit: null,
  },
  stats: {
    totalDecisions: 0,
    overallAccuracy: 0,
    totalMistakes: 0,
    currentStreak: 0,
    bestStreak: 0,
  },

  setConfig: (partial) => {
    set((state) => ({ config: { ...state.config, ...partial } }))
  },

  addSessionSummary: (summary) => {
    set((state) => ({
      sessionHistory: [...state.sessionHistory, summary],
    }))
    get().recalculateStats()
  },

  addRecentAttempts: (attempts) => {
    set((state) => ({
      recentAttempts: [...state.recentAttempts, ...attempts].slice(-200),
    }))
  },

  setMistakeList: (mistakes) => {
    set({ mistakeList: mistakes })
  },

  updateStats: () => {
    get().recalculateStats()
  },

  recalculateStats: () => {
    const state = get()
    const allAttempts = state.recentAttempts
    const totalDecisions = allAttempts.length
    const correctCount = allAttempts.filter(a => a.isCorrect).length
    const overallAccuracy = totalDecisions > 0 ? correctCount / totalDecisions : 0

    let currentStreak = 0
    for (let i = allAttempts.length - 1; i >= 0; i--) {
      if (allAttempts[i].isCorrect) currentStreak++
      else break
    }

    const bestStreak = Math.max(
      state.stats.bestStreak,
      currentStreak
    )

    set({
      stats: {
        totalDecisions,
        overallAccuracy,
        totalMistakes: state.mistakeList.length,
        currentStreak,
        bestStreak,
      },
    })
  },
}))
