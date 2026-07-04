import { Spot, Action, DecisionResult, Hand, Rank, RangeAction } from '../types'
import { classifyScenario, getStrategy } from './preflop-strategy'
import type { ScenarioKey } from './preflop-strategy'

const ALL_RANKS: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']

function actionToRangeAction(action: string, context: ScenarioKey): RangeAction {
  if (action === 'fold') return 'fold'
  if (action === 'call') return 'call'
  if (action === 'raise') {
    if (context.startsWith('open-')) return 'raise-2bet'
    if (context.startsWith('vs-open-') || context.startsWith('blind-')) return 'raise-3bet'
    return 'raise-4bet'
  }
  return 'fold'
}

export function getRangeMap(scenario: ScenarioKey): Record<string, RangeAction> {
  const map: Record<string, RangeAction> = {}

  for (let i = 0; i < ALL_RANKS.length; i++) {
    for (let j = i; j < ALL_RANKS.length; j++) {
      const r1 = ALL_RANKS[i]
      const r2 = ALL_RANKS[j]

      const cat = r1 === r2 ? 'pocket-pair' as const : 'other' as const
      const suitedHand: Hand = {
        cards: [{ rank: r1, suit: 's' }, { rank: r2, suit: 's' }],
        category: cat,
        notation: r1 === r2 ? `${r1}${r2}` : `${r1}${r2}s`,
        suited: true,
      }

      const offsuitHand: Hand = {
        cards: [{ rank: r1, suit: 's' }, { rank: r2, suit: 'd' }],
        category: cat,
        notation: r1 === r2 ? `${r1}${r2}` : `${r1}${r2}o`,
        suited: false,
      }

      if (i === j) {
        const strategy = getStrategy(scenario, suitedHand)
        map[suitedHand.notation] = actionToRangeAction(strategy.action, scenario)
      } else {
        const suitedStrategy = getStrategy(scenario, suitedHand)
        map[suitedHand.notation] = actionToRangeAction(suitedStrategy.action, scenario)

        const offsuitStrategy = getStrategy(scenario, offsuitHand)
        map[offsuitHand.notation] = actionToRangeAction(offsuitStrategy.action, scenario)
      }
    }
  }

  return map
}

export function getScenarioLabel(scenario: ScenarioKey): string {
  const labels: Record<ScenarioKey, string> = {
    'open-utg': 'UTG Open',
    'open-mp': 'MP Open',
    'open-co': 'CO Open',
    'open-btn': 'BTN Open',
    'vs-open-btn': 'BTN vs Open',
    'vs-open-co': 'CO vs Open',
    'vs-open-mp': 'MP vs Open',
    'vs-3bet-btn': 'BTN vs 3bet',
    'vs-3bet-co': 'CO vs 3bet',
    'blind-defense-bb': 'BB Defense',
  }
  return labels[scenario] || scenario
}

export function evaluateDecision(spot: Spot, userAction: Action): DecisionResult {
  if (spot.actionState.street !== 'preflop') {
    return evaluatePostflop(spot, userAction)
  }

  const scenario = classifyScenario(spot.heroPosition, spot.villainPosition!, spot.actionState)
  const strategy = getStrategy(scenario, spot.heroHand)

  const isCorrect = userAction === strategy.action

  if (strategy.alternatives && strategy.alternatives.length > 0) {
    const altCorrect = strategy.alternatives.some(a => a.action === userAction)
    if (altCorrect) {
      const alt = strategy.alternatives.find(a => a.action === userAction)!
      return {
        correctAction: strategy.action,
        isCorrect: true,
        frequency: alt.frequency,
        alternatives: [{ action: strategy.action, frequency: strategy.frequency }, ...strategy.alternatives.filter(a => a.action !== userAction)],
        explanation: getExplanation(scenario, spot.heroHand, strategy.action, strategy.frequency),
      }
    }
  }

  if (isCorrect) {
    return {
      correctAction: strategy.action,
      isCorrect: true,
      frequency: strategy.frequency,
      alternatives: strategy.alternatives,
      explanation: getExplanation(scenario, spot.heroHand, strategy.action, strategy.frequency),
    }
  }

  return {
    correctAction: strategy.action,
    isCorrect: false,
    frequency: strategy.frequency,
    alternatives: strategy.alternatives,
    explanation: getExplanation(scenario, spot.heroHand, strategy.action, strategy.frequency, userAction),
  }
}

function evaluatePostflop(spot: Spot, userAction: Action): DecisionResult {
  const pot = spot.actionState.pot
  const stack = (spot.stackSize * 100) - pot

  if (spot.actionState.street === 'flop') {
    if (spot.actionState.lastAction === 'raise' || spot.actionState.lastAction === 'bet') {
      if (stack / pot > 3) {
        if (userAction === 'call') {
          return { correctAction: 'call', isCorrect: true, frequency: 0.6, explanation: 'Standard defense vs c-bet with moderate stack depth' }
        }
        if (userAction === 'raise') {
          return { correctAction: 'call', isCorrect: false, frequency: 0.6, explanation: 'Raising here is too thin; prefer calling with marginal hands' }
        }
        return { correctAction: 'call', isCorrect: false, frequency: 0.6, explanation: 'Consider calling with decent holdings on this flop' }
      }
      if (stack / pot <= 3) {
        if (userAction === 'raise') {
          return { correctAction: 'raise', isCorrect: true, frequency: 0.5, explanation: 'Short stack, jam or raise over c-bet' }
        }
        return { correctAction: 'raise', isCorrect: false, frequency: 0.5, explanation: 'Stack is shallow, best to raise or jam' }
      }
    }
  }

  if (userAction === 'fold') {
    return { correctAction: 'call', isCorrect: false, frequency: 0.5, explanation: 'Consider continuing with this hand on this board texture' }
  }

  return { correctAction: 'call', isCorrect: true, frequency: 1, explanation: 'Standard continuation' }
}

function getExplanation(scenario: string, hand: any, action: Action, frequency: number, userAction?: Action): string {
  const handName = hand.notation
  const actionName = action.charAt(0).toUpperCase() + action.slice(1)

  if (frequency < 1) {
    const pct = Math.round(frequency * 100)
    if (userAction && userAction !== action) {
      return `${handName}: this is a mixed spot — ${actionName} ${pct}% of the time`
    }
    return `${handName}: ${actionName} ${pct}% of the time in this spot`
  }

  return `${handName}: ${actionName} is the standard play here`
}

export function getCorrectAction(spot: Spot): Action {
  if (spot.actionState.street !== 'preflop') {
    return spot.actionState.lastAction === 'raise' || spot.actionState.lastAction === 'bet' ? 'call' : 'fold'
  }

  const scenario = classifyScenario(spot.heroPosition, spot.villainPosition!, spot.actionState)
  const strategy = getStrategy(scenario, spot.heroHand)
  return strategy.action
}
