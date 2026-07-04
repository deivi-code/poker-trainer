import { Hand, Card, HandCategory, Rank, Suit } from '../types'

const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
const SUITS: Suit[] = ['h', 'd', 'c', 's']

function randomSuit(): Suit {
  return SUITS[Math.floor(Math.random() * SUITS.length)]
}

function handNotation(cards: [Card, Card]): string {
  const sorted = [...cards].sort((a, b) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank))
  const sameSuit = cards[0].suit === cards[1].suit
  if (sorted[0].rank === sorted[1].rank) return sorted[0].rank + sorted[1].rank
  const s = sameSuit ? 's' : 'o'
  return `${sorted[0].rank}${sorted[1].rank}${s}`
}

function getCategory(cards: [Card, Card]): HandCategory {
  const [c1, c2] = cards
  if (c1.rank === c2.rank) return 'pocket-pair'
  const high = Math.max(RANKS.indexOf(c1.rank), RANKS.indexOf(c2.rank))
  const low = Math.min(RANKS.indexOf(c1.rank), RANKS.indexOf(c2.rank))
  const suited = c1.suit === c2.suit
  const gap = high - low
  const isBroadway = high >= RANKS.indexOf('T')

  if (suited && isBroadway && gap <= 1) return 'suited-connector'
  if (suited && c1.rank === 'A') return 'suited-ace'
  if (isBroadway && !suited) return 'offsuited-broadway'
  if (suited && gap <= 3) return 'suited-gapper'
  if (suited) return 'suited-ace'
  return 'other'
}

export function generateRandomHand(): Hand {
  const rank1 = RANKS[Math.floor(Math.random() * RANKS.length)]
  const rank2 = RANKS[Math.floor(Math.random() * RANKS.length)]
  const suit1 = randomSuit()
  const suit2 = randomSuit()
  const cards: [Card, Card] = [{ rank: rank1, suit: suit1 }, { rank: rank2, suit: suit2 }]
  const hand: Hand = {
    cards,
    category: getCategory(cards),
    notation: handNotation(cards),
    suited: suit1 === suit2,
  }
  return hand
}

export function generateWeightedHand(): Hand {
  const r = Math.random()
  if (r < 0.25) {
    return generateSpecificHand('pocket-pair')
  }
  if (r < 0.45) {
    return generateSpecificHand('suited-connector')
  }
  if (r < 0.60) {
    return generateSpecificHand('suited-ace')
  }
  if (r < 0.80) {
    return generateSpecificHand('offsuited-broadway')
  }
  return generateRandomHand()
}

function generateSpecificHand(category: HandCategory): Hand {
  const attempts = 0
  while (attempts < 100) {
    const hand = generateRandomHand()
    if (hand.category === category) return hand
  }
  return generateRandomHand()
}

export function getHandStrength(hand: Hand): number {
  const [c1, c2] = hand.cards
  const high = Math.max(RANKS.indexOf(c1.rank), RANKS.indexOf(c2.rank))
  const low = Math.min(RANKS.indexOf(c1.rank), RANKS.indexOf(c2.rank))
  const pair = c1.rank === c2.rank
  const suited = hand.suited
  let strength = high * 10 + low
  if (pair) strength += 100
  if (suited && high >= RANKS.indexOf('J')) strength += 20
  return strength
}

export const ALL_HANDS: string[] = []
for (let i = 0; i < RANKS.length; i++) {
  for (let j = i; j < RANKS.length; j++) {
    if (i === j) {
      ALL_HANDS.push(`${RANKS[i]}${RANKS[i]}`)
    } else {
      ALL_HANDS.push(`${RANKS[j]}${RANKS[i]}s`)
      ALL_HANDS.push(`${RANKS[j]}${RANKS[i]}o`)
    }
  }
}
