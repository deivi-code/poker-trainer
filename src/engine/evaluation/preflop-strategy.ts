import { Hand, Position, Action, PreflopAction } from '../types'

interface StrategyEntry {
  action: PreflopAction
  frequency: number
  alternatives?: { action: PreflopAction; frequency: number }[]
}

interface HandKey {
  rank1: string
  rank2: string
  suited: boolean
}

function handKey(hand: Hand): HandKey {
  const ranks = hand.cards.map(c => c.rank).sort((a, b) => rankValue(b) - rankValue(a))
  return { rank1: ranks[0], rank2: ranks[1], suited: hand.suited }
}

function rankValue(r: string): number {
  const order: Record<string, number> = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 }
  return order[r] ?? 0
}

function isPair(hk: HandKey): boolean {
  return hk.rank1 === hk.rank2
}

function handRank(hk: HandKey): number {
  return rankValue(hk.rank1) * 100 + rankValue(hk.rank2) + (hk.suited ? 10 : 0)
}

type ScenarioKey = 'open-utg' | 'open-mp' | 'open-co' | 'open-btn' | 'vs-open-btn' | 'vs-open-co' | 'vs-open-mp' | 'vs-3bet-btn' | 'vs-3bet-co' | 'blind-defense-bb'

function classifyScenario(hero: Position, villain: Position, actionState: any): ScenarioKey {
  const isOpen = actionState.lastAction === null || (actionState.lastAction === 'raise' && actionState.lastBetSize && actionState.lastBetSize <= 3.5)

  if (isOpen) {
    if (hero === 'UTG') return 'open-utg'
    if (hero === 'MP') return 'open-mp'
    if (hero === 'CO') return 'open-co'
    if (hero === 'BTN') return 'open-btn'
  }

  const facingRaise = actionState.lastAction === 'raise' && actionState.lastBetSize! <= 3.5
  if (facingRaise) {
    if (hero === 'BTN') return 'vs-open-btn'
    if (hero === 'CO') return 'vs-open-co'
    if (hero === 'MP') return 'vs-open-mp'
    if (hero === 'BB') return 'blind-defense-bb'
  }

  const facing3bet = actionState.lastAction === 'raise' && actionState.lastBetSize! > 3.5 && actionState.lastBetSize! <= 12
  if (facing3bet) {
    if (hero === 'BTN') return 'vs-3bet-btn'
    if (hero === 'CO') return 'vs-3bet-co'
  }

  return 'vs-open-btn'
}

function getStrategy(scenario: ScenarioKey, hand: Hand): StrategyEntry {
  const hk = handKey(hand)
  const pair = isPair(hk)
  const hRank = handRank(hk)
  const high = Math.max(rankValue(hk.rank1), rankValue(hk.rank2))
  const low = Math.min(rankValue(hk.rank1), rankValue(hk.rank2))
  const gap = high - low
  const suited = hk.suited

  switch (scenario) {
    case 'open-utg': {
      if (pair && hRank >= handRank({ rank1: 'Q', rank2: 'Q', suited: false })) return { action: 'raise', frequency: 1 }
      if (pair && hRank >= handRank({ rank1: '7', rank2: '7', suited: false })) return { action: 'raise', frequency: 0.8, alternatives: [{ action: 'fold', frequency: 0.2 }] }
      if (pair) return { action: 'fold', frequency: 1 }
      if (high >= 14 && low >= 10 && suited) return { action: 'raise', frequency: 1 }
      if (high >= 14 && low >= 10 && !suited) return { action: 'raise', frequency: 0.7, alternatives: [{ action: 'fold', frequency: 0.3 }] }
      if (high === 14 && low >= 5 && suited) return { action: 'raise', frequency: 0.8, alternatives: [{ action: 'fold', frequency: 0.2 }] }
      if (high === 13 && low >= 10 && suited) return { action: 'raise', frequency: 0.6, alternatives: [{ action: 'fold', frequency: 0.4 }] }
      if (high === 12 && low >= 10 && suited) return { action: 'raise', frequency: 0.5, alternatives: [{ action: 'fold', frequency: 0.5 }] }
      return { action: 'fold', frequency: 1 }
    }

    case 'open-mp': {
      if (pair && hRank >= handRank({ rank1: 'T', rank2: 'T', suited: false })) return { action: 'raise', frequency: 1 }
      if (pair && hRank >= handRank({ rank1: '6', rank2: '6', suited: false })) return { action: 'raise', frequency: 0.85, alternatives: [{ action: 'fold', frequency: 0.15 }] }
      if (pair) return { action: 'fold', frequency: 1 }
      if (high >= 14 && low >= 9 && suited) return { action: 'raise', frequency: 1 }
      if (high >= 14 && low >= 9 && !suited) return { action: 'raise', frequency: 0.8, alternatives: [{ action: 'fold', frequency: 0.2 }] }
      if (high === 14 && low >= 3 && suited) return { action: 'raise', frequency: 0.9, alternatives: [{ action: 'fold', frequency: 0.1 }] }
      if (high === 13 && low >= 10) return { action: 'raise', frequency: 0.75, alternatives: [{ action: 'fold', frequency: 0.25 }] }
      if (high === 12 && low === 10 && suited) return { action: 'raise', frequency: 0.7, alternatives: [{ action: 'fold', frequency: 0.3 }] }
      if (high === 11 && low === 10 && suited) return { action: 'raise', frequency: 0.5, alternatives: [{ action: 'fold', frequency: 0.5 }] }
      if (high >= 10 && low >= 10 && gap <= 3 && suited) return { action: 'raise', frequency: 0.3, alternatives: [{ action: 'fold', frequency: 0.7 }] }
      if (high === 14 && low >= 9 && !suited) return { action: 'raise', frequency: 0.45 }
      return { action: 'fold', frequency: 1 }
    }

    case 'open-co': {
      if (pair && hRank >= handRank({ rank1: '9', rank2: '9', suited: false })) return { action: 'raise', frequency: 1 }
      if (pair && hRank >= handRank({ rank1: '5', rank2: '5', suited: false })) return { action: 'raise', frequency: 0.9, alternatives: [{ action: 'fold', frequency: 0.1 }] }
      if (pair) return { action: 'fold', frequency: 1 }
      if (high >= 14 && low >= 7 && suited) return { action: 'raise', frequency: 1 }
      if (high >= 14 && low >= 7 && !suited) return { action: 'raise', frequency: 0.85, alternatives: [{ action: 'fold', frequency: 0.15 }] }
      if (high === 14 && low >= 2 && suited) return { action: 'raise', frequency: 0.95, alternatives: [{ action: 'fold', frequency: 0.05 }] }
      if (high >= 13 && low >= 9) return { action: 'raise', frequency: 0.9, alternatives: [{ action: 'fold', frequency: 0.1 }] }
      if (high === 12 && low >= 9) return { action: 'raise', frequency: 0.8, alternatives: [{ action: 'fold', frequency: 0.2 }] }
      if (high === 11 && low >= 10) return { action: 'raise', frequency: 0.85, alternatives: [{ action: 'fold', frequency: 0.15 }] }
      if (high >= 10 && low >= 10 && gap <= 3 && suited) return { action: 'raise', frequency: 0.5, alternatives: [{ action: 'fold', frequency: 0.5 }] }
      if (high === 10 && low === 9 && suited) return { action: 'raise', frequency: 0.4, alternatives: [{ action: 'fold', frequency: 0.6 }] }
      if (high === 14 && low >= 9 && !suited) return { action: 'raise', frequency: 0.65 }
      if (high === 13 && low === 9 && suited) return { action: 'raise', frequency: 0.5 }
      if (high === 13 && low === 8 && suited) return { action: 'raise', frequency: 0.3 }
      return { action: 'fold', frequency: 1 }
    }

    case 'open-btn': {
      if (pair && hRank >= handRank({ rank1: '8', rank2: '8', suited: false })) return { action: 'raise', frequency: 1 }
      if (pair && hRank >= handRank({ rank1: '4', rank2: '4', suited: false })) return { action: 'raise', frequency: 0.9, alternatives: [{ action: 'fold', frequency: 0.1 }] }
      if (pair) return { action: 'fold', frequency: 1 }
      if (high >= 14 && low >= 5 && suited) return { action: 'raise', frequency: 1 }
      if (high >= 14 && low >= 5 && !suited) return { action: 'raise', frequency: 0.9, alternatives: [{ action: 'fold', frequency: 0.1 }] }
      if (high === 14 && suited) return { action: 'raise', frequency: 1 }
      if (high === 13 && low >= 6) return { action: 'raise', frequency: 0.9, alternatives: [{ action: 'fold', frequency: 0.1 }] }
      if (high === 12 && low >= 7) return { action: 'raise', frequency: 0.85, alternatives: [{ action: 'fold', frequency: 0.15 }] }
      if (high === 11 && low >= 8) return { action: 'raise', frequency: 0.8, alternatives: [{ action: 'fold', frequency: 0.2 }] }
      if (high === 10 && low >= 9) return { action: 'raise', frequency: 0.75, alternatives: [{ action: 'fold', frequency: 0.25 }] }
      if (high >= 10 && low >= 10 && gap <= 4 && suited) return { action: 'raise', frequency: 0.7, alternatives: [{ action: 'fold', frequency: 0.3 }] }
      if (high === 14 && low >= 6 && !suited) return { action: 'raise', frequency: 0.75 }
      if (high >= 9 && low >= 9 && gap <= 2 && suited) return { action: 'raise', frequency: 0.4, alternatives: [{ action: 'fold', frequency: 0.6 }] }
      if (high === 13 && low === 5 && suited) return { action: 'raise', frequency: 0.35 }
      if (high === 13 && low === 4 && suited) return { action: 'raise', frequency: 0.25 }
      if (high === 12 && low === 5 && suited) return { action: 'raise', frequency: 0.2 }
      return { action: 'fold', frequency: 1 }
    }

    case 'vs-open-btn': {
      if (pair && hRank >= handRank({ rank1: 'J', rank2: 'J', suited: false })) return { action: 'raise', frequency: 0.9, alternatives: [{ action: 'call', frequency: 0.1 }] }
      if (pair && hRank >= handRank({ rank1: '9', rank2: '9', suited: false })) return { action: 'call', frequency: 0.8, alternatives: [{ action: 'raise', frequency: 0.2 }] }
      if (pair && hRank >= handRank({ rank1: '6', rank2: '6', suited: false })) return { action: 'call', frequency: 0.6, alternatives: [{ action: 'fold', frequency: 0.4 }] }
      if (pair) return { action: 'fold', frequency: 1 }
      if (high >= 14 && low >= 11 && !suited) return { action: 'raise', frequency: 0.75, alternatives: [{ action: 'call', frequency: 0.25 }] }
      if (high >= 14 && low >= 7 && suited) return { action: 'raise', frequency: 0.5, alternatives: [{ action: 'call', frequency: 0.3 }, { action: 'fold', frequency: 0.2 }] }
      if (high >= 13 && low >= 11 && suited) return { action: 'call', frequency: 0.4, alternatives: [{ action: 'raise', frequency: 0.4 }, { action: 'fold', frequency: 0.2 }] }
      if (high === 14 && low >= 4 && suited) return { action: 'call', frequency: 0.6, alternatives: [{ action: 'fold', frequency: 0.4 }] }
      if (high >= 10 && low >= 10 && gap <= 1 && suited) return { action: 'call', frequency: 0.5, alternatives: [{ action: 'fold', frequency: 0.5 }] }
      if (high === 13 && low >= 9 && suited) return { action: 'call', frequency: 0.45, alternatives: [{ action: 'fold', frequency: 0.55 }] }
      if (high === 13 && low === 8 && suited) return { action: 'call', frequency: 0.3, alternatives: [{ action: 'fold', frequency: 0.7 }] }
      if (high === 12 && low === 9 && suited) return { action: 'call', frequency: 0.35, alternatives: [{ action: 'fold', frequency: 0.65 }] }
      if (high === 12 && low === 8 && suited) return { action: 'call', frequency: 0.2, alternatives: [{ action: 'fold', frequency: 0.8 }] }
      if (high === 11 && low === 10 && suited) return { action: 'call', frequency: 0.3, alternatives: [{ action: 'fold', frequency: 0.7 }] }
      if (high === 10 && low === 9 && suited) return { action: 'call', frequency: 0.15, alternatives: [{ action: 'fold', frequency: 0.85 }] }
      if (high === 14 && low >= 10 && !suited) return { action: 'call', frequency: 0.55, alternatives: [{ action: 'fold', frequency: 0.45 }] }
      return { action: 'fold', frequency: 1 }
    }

    case 'vs-open-co': {
      if (pair && hRank >= handRank({ rank1: 'Q', rank2: 'Q', suited: false })) return { action: 'raise', frequency: 0.9, alternatives: [{ action: 'call', frequency: 0.1 }] }
      if (pair && hRank >= handRank({ rank1: 'T', rank2: 'T', suited: false })) return { action: 'call', frequency: 0.7, alternatives: [{ action: 'raise', frequency: 0.3 }] }
      if (pair && hRank >= handRank({ rank1: '7', rank2: '7', suited: false })) return { action: 'call', frequency: 0.5, alternatives: [{ action: 'fold', frequency: 0.5 }] }
      if (pair) return { action: 'fold', frequency: 1 }
      if (high >= 14 && low >= 10 && !suited) return { action: 'raise', frequency: 0.5, alternatives: [{ action: 'call', frequency: 0.5 }] }
      if (high >= 14 && low >= 9 && suited) return { action: 'raise', frequency: 0.45, alternatives: [{ action: 'call', frequency: 0.45 }, { action: 'fold', frequency: 0.1 }] }
      if (high >= 13 && low >= 11 && suited) return { action: 'call', frequency: 0.5, alternatives: [{ action: 'raise', frequency: 0.3 }, { action: 'fold', frequency: 0.2 }] }
      if (high === 14 && low >= 3 && suited) return { action: 'call', frequency: 0.55 }
      if (high >= 10 && low >= 10 && gap <= 1 && suited) return { action: 'call', frequency: 0.4, alternatives: [{ action: 'fold', frequency: 0.6 }] }
      if (high === 13 && low >= 9 && suited) return { action: 'call', frequency: 0.35 }
      if (high === 13 && low === 8 && suited) return { action: 'call', frequency: 0.25 }
      if (high === 12 && low === 9 && suited) return { action: 'call', frequency: 0.25 }
      if (high === 12 && low === 8 && suited) return { action: 'call', frequency: 0.15 }
      if (high === 11 && low === 10 && suited) return { action: 'call', frequency: 0.2 }
      if (high === 14 && low >= 11 && !suited) return { action: 'call', frequency: 0.45 }
      return { action: 'fold', frequency: 1 }
    }

    case 'vs-open-mp': {
      if (pair && hRank >= handRank({ rank1: 'K', rank2: 'K', suited: false })) return { action: 'raise', frequency: 0.85, alternatives: [{ action: 'call', frequency: 0.15 }] }
      if (pair && hRank >= handRank({ rank1: 'J', rank2: 'J', suited: false })) return { action: 'call', frequency: 0.65, alternatives: [{ action: 'raise', frequency: 0.35 }] }
      if (pair && hRank >= handRank({ rank1: '8', rank2: '8', suited: false })) return { action: 'call', frequency: 0.45, alternatives: [{ action: 'fold', frequency: 0.55 }] }
      if (pair) return { action: 'fold', frequency: 1 }
      if (high >= 14 && low >= 10 && !suited) return { action: 'raise', frequency: 0.4, alternatives: [{ action: 'call', frequency: 0.6 }] }
      if (high >= 14 && low >= 10 && suited) return { action: 'raise', frequency: 0.4, alternatives: [{ action: 'call', frequency: 0.5 }, { action: 'fold', frequency: 0.1 }] }
      if (high >= 13 && low >= 11 && suited) return { action: 'call', frequency: 0.4, alternatives: [{ action: 'raise', frequency: 0.2 }, { action: 'fold', frequency: 0.4 }] }
      if (high === 14 && low >= 4 && suited) return { action: 'call', frequency: 0.5, alternatives: [{ action: 'fold', frequency: 0.5 }] }
      if (high === 14 && low >= 11 && !suited) return { action: 'call', frequency: 0.35, alternatives: [{ action: 'fold', frequency: 0.65 }] }
      if (high >= 10 && low >= 10 && gap <= 1 && suited) return { action: 'call', frequency: 0.3 }
      if (high === 13 && low === 9 && suited) return { action: 'call', frequency: 0.25 }
      if (high === 12 && low === 10 && suited) return { action: 'call', frequency: 0.2 }
      if (high === 11 && low === 10 && suited) return { action: 'call', frequency: 0.15 }
      return { action: 'fold', frequency: 1 }
    }

    case 'vs-3bet-btn': {
      if (pair && hRank >= handRank({ rank1: 'A', rank2: 'A', suited: false })) return { action: 'raise', frequency: 1 }
      if (pair && hRank >= handRank({ rank1: 'K', rank2: 'K', suited: false })) return { action: 'raise', frequency: 0.8, alternatives: [{ action: 'call', frequency: 0.2 }] }
      if (pair && hRank >= handRank({ rank1: 'Q', rank2: 'Q', suited: false })) return { action: 'raise', frequency: 0.5, alternatives: [{ action: 'call', frequency: 0.5 }] }
      if (pair && hRank >= handRank({ rank1: 'J', rank2: 'J', suited: false })) return { action: 'call', frequency: 0.7, alternatives: [{ action: 'fold', frequency: 0.3 }] }
      if (pair && hRank >= handRank({ rank1: 'T', rank2: 'T', suited: false })) return { action: 'call', frequency: 0.55, alternatives: [{ action: 'fold', frequency: 0.45 }] }
      if (pair && hRank >= handRank({ rank1: '8', rank2: '8', suited: false })) return { action: 'call', frequency: 0.35, alternatives: [{ action: 'fold', frequency: 0.65 }] }
      if (pair) return { action: 'fold', frequency: 1 }
      if (high >= 14 && low >= 12 && !suited) return { action: 'raise', frequency: 0.6, alternatives: [{ action: 'call', frequency: 0.4 }] }
      if (high >= 14 && low >= 10 && suited) return { action: 'raise', frequency: 0.35, alternatives: [{ action: 'call', frequency: 0.35 }, { action: 'fold', frequency: 0.3 }] }
      if (high >= 14 && low >= 5 && suited) return { action: 'call', frequency: 0.4, alternatives: [{ action: 'fold', frequency: 0.6 }] }
      if (high === 13 && low >= 10 && suited) return { action: 'call', frequency: 0.45, alternatives: [{ action: 'fold', frequency: 0.55 }] }
      if (high === 12 && low >= 10 && suited) return { action: 'call', frequency: 0.35, alternatives: [{ action: 'fold', frequency: 0.65 }] }
      if (high >= 10 && low >= 10 && gap <= 2 && suited) return { action: 'call', frequency: 0.2, alternatives: [{ action: 'fold', frequency: 0.8 }] }
      if (high === 14 && low >= 11 && !suited) return { action: 'call', frequency: 0.3, alternatives: [{ action: 'fold', frequency: 0.7 }] }
      return { action: 'fold', frequency: 1 }
    }

    case 'vs-3bet-co': {
      if (pair && hRank >= handRank({ rank1: 'A', rank2: 'A', suited: false })) return { action: 'raise', frequency: 1 }
      if (pair && hRank >= handRank({ rank1: 'K', rank2: 'K', suited: false })) return { action: 'raise', frequency: 0.7, alternatives: [{ action: 'call', frequency: 0.3 }] }
      if (pair && hRank >= handRank({ rank1: 'Q', rank2: 'Q', suited: false })) return { action: 'raise', frequency: 0.4, alternatives: [{ action: 'call', frequency: 0.6 }] }
      if (pair && hRank >= handRank({ rank1: 'J', rank2: 'J', suited: false })) return { action: 'call', frequency: 0.6, alternatives: [{ action: 'fold', frequency: 0.4 }] }
      if (pair && hRank >= handRank({ rank1: 'T', rank2: 'T', suited: false })) return { action: 'call', frequency: 0.45, alternatives: [{ action: 'fold', frequency: 0.55 }] }
      if (pair && hRank >= handRank({ rank1: '9', rank2: '9', suited: false })) return { action: 'call', frequency: 0.3, alternatives: [{ action: 'fold', frequency: 0.7 }] }
      if (pair) return { action: 'fold', frequency: 1 }
      if (high >= 14 && low >= 11 && !suited) return { action: 'raise', frequency: 0.45, alternatives: [{ action: 'call', frequency: 0.55 }] }
      if (high >= 14 && low >= 10 && suited) return { action: 'raise', frequency: 0.25, alternatives: [{ action: 'call', frequency: 0.35 }, { action: 'fold', frequency: 0.4 }] }
      if (high >= 14 && low >= 5 && suited) return { action: 'call', frequency: 0.3, alternatives: [{ action: 'fold', frequency: 0.7 }] }
      if (high === 13 && low >= 10 && suited) return { action: 'call', frequency: 0.35, alternatives: [{ action: 'fold', frequency: 0.65 }] }
      if (high === 12 && low >= 10 && suited) return { action: 'call', frequency: 0.25, alternatives: [{ action: 'fold', frequency: 0.75 }] }
      if (high === 14 && low >= 11 && !suited) return { action: 'call', frequency: 0.2, alternatives: [{ action: 'fold', frequency: 0.8 }] }
      return { action: 'fold', frequency: 1 }
    }

    case 'blind-defense-bb': {
      if (pair && hRank >= handRank({ rank1: 'Q', rank2: 'Q', suited: false })) return { action: 'raise', frequency: 0.8, alternatives: [{ action: 'call', frequency: 0.2 }] }
      if (pair && hRank >= handRank({ rank1: 'T', rank2: 'T', suited: false })) return { action: 'call', frequency: 0.7, alternatives: [{ action: 'raise', frequency: 0.3 }] }
      if (pair && hRank >= handRank({ rank1: '6', rank2: '6', suited: false })) return { action: 'call', frequency: 0.6, alternatives: [{ action: 'fold', frequency: 0.4 }] }
      if (pair) return { action: 'call', frequency: 0.3, alternatives: [{ action: 'fold', frequency: 0.7 }] }
      if (high >= 14 && low >= 7 && suited) return { action: 'raise', frequency: 0.5, alternatives: [{ action: 'call', frequency: 0.4 }, { action: 'fold', frequency: 0.1 }] }
      if (high >= 14 && low >= 2 && suited) return { action: 'call', frequency: 0.6, alternatives: [{ action: 'fold', frequency: 0.4 }] }
      if (high >= 13 && low >= 8 && suited) return { action: 'call', frequency: 0.45, alternatives: [{ action: 'fold', frequency: 0.55 }] }
      if (high >= 10 && low >= 10 && gap <= 2 && suited) return { action: 'call', frequency: 0.4, alternatives: [{ action: 'fold', frequency: 0.6 }] }
      if (high >= 13 && low >= 10 && !suited) return { action: 'call', frequency: 0.5, alternatives: [{ action: 'fold', frequency: 0.5 }] }
      if (high === 12 && low >= 10 && !suited) return { action: 'call', frequency: 0.35, alternatives: [{ action: 'fold', frequency: 0.65 }] }
      if (high >= 10 && low >= 10 && gap <= 3 && !suited) return { action: 'call', frequency: 0.2, alternatives: [{ action: 'fold', frequency: 0.8 }] }
      if (high >= 0 && low >= 0 && gap <= 1 && suited) return { action: 'call', frequency: 0.15, alternatives: [{ action: 'fold', frequency: 0.85 }] }
      return { action: 'fold', frequency: 1 }
    }

    default:
      return { action: 'fold', frequency: 1 }
  }
}

function determinePrimaryAction(strategy: StrategyEntry): Action {
  const r = Math.random()
  let cumulative = 0
  if (r < strategy.frequency) return strategy.action
  cumulative += strategy.frequency
  if (strategy.alternatives) {
    for (const alt of strategy.alternatives) {
      if (r < cumulative + alt.frequency) return alt.action
      cumulative += alt.frequency
    }
  }
  return strategy.action
}

export { classifyScenario, getStrategy, determinePrimaryAction }
export type { ScenarioKey, StrategyEntry }
