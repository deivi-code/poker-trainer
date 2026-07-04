import { ActionState, Position, Street } from '../types'

export type ScenarioType = 'preflop-open' | 'preflop-vs-open' | 'preflop-vs-3bet' | 'preflop-blind-defense' | 'postflop-cbet' | 'postflop-vs-cbet' | 'postflop-turn' | 'postflop-river'

export interface ScenarioConfig {
  type: ScenarioType
  hero: Position
  villain: Position
  street: Street
  pot: number
  stackToPot: number
}

export function getScenarioWeight(type: ScenarioType): number {
  const weights: Record<ScenarioType, number> = {
    'preflop-open': 0.20,
    'preflop-vs-open': 0.25,
    'preflop-vs-3bet': 0.15,
    'preflop-blind-defense': 0.10,
    'postflop-cbet': 0.10,
    'postflop-vs-cbet': 0.08,
    'postflop-turn': 0.07,
    'postflop-river': 0.05,
  }
  return weights[type]
}

export function generateActionState(scenario: ScenarioConfig): ActionState {
  const basePot = 1.5
  switch (scenario.type) {
    case 'preflop-open': {
      const openSize = scenario.hero === 'BTN' ? 2.5 : scenario.hero === 'CO' ? 2.5 : 3
      return {
        street: 'preflop',
        currentPlayer: scenario.villain,
        pot: basePot + openSize,
        stackToPot: (100 - openSize) / (basePot + openSize),
        lastAction: 'raise',
        lastBetSize: openSize,
        numPlayers: 2,
        board: null,
      }
    }
    case 'preflop-vs-open': {
      return {
        street: 'preflop',
        currentPlayer: scenario.hero,
        pot: basePot + (scenario.villain === 'BTN' ? 2.5 : 3),
        stackToPot: 97 / (basePot + (scenario.villain === 'BTN' ? 2.5 : 3)),
        lastAction: 'raise',
        lastBetSize: scenario.villain === 'BTN' ? 2.5 : 3,
        numPlayers: 2,
        board: null,
      }
    }
    case 'preflop-vs-3bet': {
      return {
        street: 'preflop',
        currentPlayer: scenario.hero,
        pot: basePot + 3 + 10,
        stackToPot: 87 / (basePot + 3 + 10),
        lastAction: 'raise',
        lastBetSize: 10,
        numPlayers: 2,
        board: null,
      }
    }
    case 'preflop-blind-defense': {
      return {
        street: 'preflop',
        currentPlayer: scenario.hero,
        pot: basePot + 2.5,
        stackToPot: 97.5 / (basePot + 2.5),
        lastAction: 'raise',
        lastBetSize: 2.5,
        numPlayers: 2,
        board: null,
      }
    }
    case 'postflop-cbet': {
      return {
        street: 'flop',
        currentPlayer: scenario.villain,
        pot: 7.5,
        stackToPot: 92.5 / 7.5,
        lastAction: 'bet',
        lastBetSize: 5,
        numPlayers: 2,
        board: [
          { rank: (['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const)[Math.floor(Math.random() * 13)], suit: 'h' as const },
          { rank: (['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const)[Math.floor(Math.random() * 13)], suit: 'd' as const },
          { rank: (['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const)[Math.floor(Math.random() * 13)], suit: 'c' as const },
        ],
      }
    }
    default: {
      return {
        street: 'preflop',
        currentPlayer: 'BTN',
        pot: 5.5,
        stackToPot: 94.5 / 5.5,
        lastAction: 'raise',
        lastBetSize: 2.5,
        numPlayers: 2,
        board: null,
      }
    }
  }
}

export function getScenarioForType(type: ScenarioType, hero: Position, villain: Position): ScenarioConfig {
  return {
    type,
    hero,
    villain,
    street: type === 'preflop-open' || type === 'preflop-vs-open' || type === 'preflop-vs-3bet' || type === 'preflop-blind-defense' ? 'preflop' : 'flop',
    pot: 5.5,
    stackToPot: 94.5 / 5.5,
  }
}
