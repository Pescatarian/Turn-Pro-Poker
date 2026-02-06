export type Suit = 'h' | 'd' | 'c' | 's'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
    rank: Rank
    suit: Suit
}

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in'

export interface Action {
    seatIndex: number
    type: ActionType
    amount?: number
}

export interface Seat {
    index: number
    name: string
    stack: number
    cards?: Card[]
    isActive: boolean
    isDealer: boolean
}

export interface ReplayerState {
    street: 'preflop' | 'flop' | 'turn' | 'river'
    pot: number
    communityCards: Card[]
    seats: Seat[]
    actions: Action[]
    currentActionIndex: number
}
