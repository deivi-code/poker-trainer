import { Position, POSITIONS } from '../types'

export function positionIndex(pos: Position): number {
  return POSITIONS.indexOf(pos)
}

export function isEarlyPosition(pos: Position): boolean {
  return pos === 'UTG'
}

export function isMiddlePosition(pos: Position): boolean {
  return pos === 'MP'
}

export function isLatePosition(pos: Position): boolean {
  return pos === 'CO' || pos === 'BTN'
}

export function isBlind(pos: Position): boolean {
  return pos === 'SB' || pos === 'BB'
}

export function getPositionWeight(pos: Position): number {
  const weights: Record<Position, number> = {
    UTG: 0.12,
    MP: 0.18,
    CO: 0.22,
    BTN: 0.28,
    SB: 0.10,
    BB: 0.10,
  }
  return weights[pos]
}

export function getPositionPairs(): [Position, Position][] {
  const pairs: [Position, Position][] = []
  for (const hero of POSITIONS) {
    for (const villain of POSITIONS) {
      if (hero !== villain) {
        pairs.push([hero, villain])
      }
    }
  }
  return pairs
}

export function getTypicalOpenPosition(): Position {
  const r = Math.random()
  if (r < 0.15) return 'UTG'
  if (r < 0.35) return 'MP'
  if (r < 0.50) return 'CO'
  return 'BTN'
}
