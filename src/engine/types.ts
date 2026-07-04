export type Format = 'cash' | 'tournament'
export type StackSize = 20 | 40 | 60 | 100 | 200

export type Position = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB'
export const POSITIONS: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB']

export type HandCategory = 'pocket-pair' | 'suited-connector' | 'suited-ace' | 'broadway' | 'offsuited-broadway' | 'suited-gapper' | 'other'

export type Action = 'fold' | 'call' | 'raise' | 'check' | 'bet' | 'all-in'
export type PreflopAction = 'fold' | 'call' | 'raise'
export type PostflopAction = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in'

export type Street = 'preflop' | 'flop' | 'turn' | 'river'

export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'
export type Suit = 'h' | 'd' | 'c' | 's'

export type BetSize = 'min' | 'small' | 'medium' | 'large' | 'pot' | 'all-in'

export interface Card {
  rank: Rank
  suit: Suit
}

export type RangeAction = 'fold' | 'call' | 'raise-2bet' | 'raise-3bet' | 'raise-4bet'

export interface RangeScenario {
  context: 'open' | 'vs-open' | 'vs-3bet' | 'blind-defense'
  heroPosition: Position
  villainPosition?: Position
  label: string
}

export interface Hand {
  cards: [Card, Card]
  category: HandCategory
  notation: string
  suited: boolean
}

export interface ActionState {
  street: Street
  currentPlayer: Position
  pot: number
  stackToPot: number
  lastAction: Action | null
  lastBetSize: number | null
  numPlayers: number
  board: Card[] | null
}

export interface Spot {
  id: string
  format: Format
  stackSize: StackSize
  heroPosition: Position
  villainPosition: Position | null
  actionState: ActionState
  heroHand: Hand
  difficulty: number
  metadata: Record<string, unknown>
}

export interface DecisionResult {
  correctAction: Action
  isCorrect: boolean
  frequency?: number
  alternatives?: { action: Action; frequency: number }[]
  explanation: string
}

export interface Attempt {
  id: string
  userId: string
  spotId: string
  userAction: Action
  correctAction: Action
  isCorrect: boolean
  decisionTimeMs: number
  timestamp: number
}

export interface Mistake {
  id: string
  userId: string
  spotId: string
  spotSnapshot: Spot
  errorType: 'wrong-action' | 'wrong-size' | 'timed-out'
  priorityScore: number
  frequency: number
  lastReviewAt: number
  nextReviewAt: number
}

export interface SessionConfig {
  totalDecisions: number
  mistakeBoost: boolean
  mistakeRatio: number
  timeLimit: number | null
}

export interface TrainingSession {
  id: string
  userId: string
  startTime: number
  endTime: number | null
  config: SessionConfig
  attempts: Attempt[]
  accuracy: number
  avgTimeMs: number
  status: 'active' | 'completed'
}

export interface SessionSummary {
  sessionId: string
  totalDecisions: number
  accuracy: number
  avgDecisionTimeMs: number
  mistakesByType: Record<string, number>
  weakestSpots: { spotType: string; errorRate: number }[]
  percentiles: { accuracy: number; speed: number }
}
