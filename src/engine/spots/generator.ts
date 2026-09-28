import { Spot, Position, Format, StackSize, Action } from '../types'
import { getPositionWeight, getTypicalOpenPosition } from './positions'
import { generateWeightedHand } from './hands'
import { ScenarioType, ScenarioConfig, getScenarioWeight, generateActionState, getScenarioForType } from './action-states'

const SCENARIO_TYPES: ScenarioType[] = [
  'preflop-open',
  'preflop-vs-open',
  'preflop-vs-3bet',
  'preflop-blind-defense',
  'postflop-cbet',
  'postflop-vs-cbet',
  'postflop-turn',
  'postflop-river',
]

const HERO_POSITIONS: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB']

let spotCounter = 0

function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

function selectScenario(priorities?: Partial<Record<ScenarioType, number>>): ScenarioType {
  if (priorities) {
    const types = Object.keys(priorities).filter(t => (priorities[t as ScenarioType] ?? 0) > 0) as ScenarioType[]
    if (types.length) {
      const weights = types.map(t => priorities[t] ?? 0)
      return pickWeighted(types, weights)
    }
  }
  const weights = SCENARIO_TYPES.map(getScenarioWeight)
  return pickWeighted(SCENARIO_TYPES, weights)
}

function selectHeroPosition(scenario: ScenarioType): Position {
  if (scenario === 'preflop-open') {
    return getTypicalOpenPosition()
  }
  if (scenario === 'preflop-blind-defense') {
    return Math.random() > 0.5 ? 'SB' : 'BB'
  }
  if (scenario === 'preflop-vs-open') {
    const r = Math.random()
    if (r < 0.4) return 'BTN'
    if (r < 0.7) return 'CO'
    if (r < 0.85) return 'MP'
    return 'BB'
  }
  if (scenario === 'preflop-vs-3bet') {
    return Math.random() > 0.5 ? 'BTN' : 'CO'
  }
  const weights = HERO_POSITIONS.map(getPositionWeight)
  return pickWeighted(HERO_POSITIONS, weights)
}

function selectVillain(hero: Position, scenario: ScenarioType): Position {
  if (scenario === 'preflop-open') {
    const positions = HERO_POSITIONS.filter(p => p !== hero && (p === 'BB' || p === 'SB'))
    return positions[Math.floor(Math.random() * positions.length)]
  }
  if (scenario === 'preflop-blind-defense') {
    return hero === 'SB' ? 'BB' : 'BTN'
  }
  const positions = HERO_POSITIONS.filter(p => p !== hero && (p === 'BTN' || p === 'CO'))
  return positions[Math.floor(Math.random() * positions.length)]
}

function generateStackSize(format: Format, scenario: ScenarioType): StackSize {
  if (scenario === 'postflop-turn' || scenario === 'postflop-river') {
    return Math.random() > 0.5 ? 100 : Math.random() > 0.5 ? 60 : 200
  }
  const r = Math.random()
  if (r < 0.6) return 100
  if (r < 0.8) return 60
  if (r < 0.9) return 40
  return 200
}

export interface SpotGeneratorConfig {
  format?: Format
  stackSize?: StackSize
  scenarioPriorities?: Partial<Record<ScenarioType, number>>
  difficultyRange?: [number, number]
}

export function generateSpot(config?: SpotGeneratorConfig): Spot {
  const format = config?.format ?? 'cash'
  const scenario = selectScenario(config?.scenarioPriorities)
  const hero = selectHeroPosition(scenario)
  const villain = selectVillain(hero, scenario)
  const stackSize = config?.stackSize ?? generateStackSize(format, scenario)
  const hand = generateWeightedHand()
  const scenarioConfig = getScenarioForType(scenario, hero, villain)
  const actionState = generateActionState(scenarioConfig)
  const difficulty = config?.difficultyRange ? (config.difficultyRange[0] + Math.random() * (config.difficultyRange[1] - config.difficultyRange[0])) : 0.5

  spotCounter++

  return {
    id: `spot-${spotCounter}-${Date.now()}`,
    format,
    stackSize,
    heroPosition: hero,
    villainPosition: villain,
    actionState,
    heroHand: hand,
    difficulty,
    metadata: {
      scenario,
      scenarioConfig,
    },
  }
}

export function generateSpotBatch(count: number, config?: SpotGeneratorConfig): Spot[] {
  const spots: Spot[] = []
  for (let i = 0; i < count; i++) {
    spots.push(generateSpot(config))
  }
  return spots
}
