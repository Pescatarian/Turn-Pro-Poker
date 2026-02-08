import { useState, useEffect, useRef } from 'react';

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type ActionType = 'check' | 'bet' | 'call' | 'fold' | 'raise' | 'allin';
export type Suit = 'h' | 'd' | 'c' | 's';

export interface Card {
    rank: string;
    suit: Suit;
}

export interface Player {
    id: number;
    name: string;
    stack: number;
    cards?: Card[];
    isActive: boolean;
    isDealer: boolean;
    action?: ActionType;
    bet?: number; // Current street bet
}

export interface GameAction {
    street: Street;
    playerId: number;
    type: ActionType;
    amount?: number;
}

export interface HandData {
    id: string;
    stakes: string;
    date: string;
    players: Player[]; // Initial state
    actions: GameAction[];
    communityCards: Card[];
    winners: number[]; // Player IDs
}

export const useReplayer = (handData: HandData | null) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentActionIndex, setCurrentActionIndex] = useState(-1);
    const [currentStreet, setCurrentStreet] = useState<Street>('preflop');
    const [pot, setPot] = useState(0);
    const [board, setBoard] = useState<Card[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);

    // Playback loop
    const timerRef = useRef<any>(null);

    useEffect(() => {
        if (handData) {
            resetHand();
        }
    }, [handData]);

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                nextAction();
            }, 1000); // 1 sec per action for now
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isPlaying, currentActionIndex]);

    const resetHand = () => {
        if (!handData) return;
        setPlayers(JSON.parse(JSON.stringify(handData.players))); // Deep copy initial state
        setPot(0);
        setBoard([]);
        setCurrentStreet('preflop');
        setCurrentActionIndex(-1);
        setIsPlaying(false);
    };

    const nextAction = () => {
        if (!handData) return;
        const nextIndex = currentActionIndex + 1;

        if (nextIndex >= handData.actions.length) {
            setIsPlaying(false);
            return;
        }

        const action = handData.actions[nextIndex];

        // Update State
        setCurrentActionIndex(nextIndex);

        // Update Street logic
        if (action.street !== currentStreet) {
            setCurrentStreet(action.street);
            // Deal cards logic would go here (e.g. reveal flop) based on street change
            updateBoard(action.street);
            // Reset bets for new street
            setPlayers(prev => prev.map(p => ({ ...p, bet: 0, action: undefined })));
        }

        // Update Pot & Player Stack
        setPlayers(prev => prev.map(p => {
            if (p.id === action.playerId) {
                const currentBet = p.bet || 0;
                const newBet = action.amount || 0;
                // Cost is the difference (if raising) or total amount? 
                // Simplified: assuming action.amount is the *total* committed to current street
                // Actually usually action amount is "added to pot". Let's assume absolute bet size for simpler replayer logic first.

                // If 'call', matching highest bet. If 'bet', setting new bet.

                let amountToDeduced = 0;
                if (action.amount) {
                    amountToDeduced = action.amount - currentBet;
                    if (amountToDeduced < 0) amountToDeduced = 0; // Should not happen in valid history
                }

                if (action.type !== 'check' && action.type !== 'fold') {
                    setPot(oldPot => oldPot + amountToDeduced);
                }

                return {
                    ...p,
                    action: action.type,
                    stack: p.stack - amountToDeduced,
                    bet: action.amount || p.bet // Updating current street commitment
                };
            }
            // Clear action for others? Or keep last action? Keep last action usually.
            // But if it's a new betting round, actions clear.
            return p;
        }));

    };

    const updateBoard = (street: Street) => {
        if (!handData) return;
        // Logic to reveal cards from handData.communityCards based on street
        if (street === 'flop') setBoard(handData.communityCards.slice(0, 3));
        if (street === 'turn') setBoard(handData.communityCards.slice(0, 4));
        if (street === 'river') setBoard(handData.communityCards.slice(0, 5));
    };

    const prevAction = () => {
        // Implementing 'undo' is complex (need snapshots). 
        // For MVP, just reset and fast-forward? Or basic decrement if state is simple.
        // Let's do Reset & Replay for now to ensure consistency.
        if (currentActionIndex <= 0) {
            resetHand();
            return;
        }

        // Naive fast-forward
        const targetIndex = currentActionIndex - 1;
        // Pause to avoid race conditions
        const wasPlaying = isPlaying;
        setIsPlaying(false);

        // Re-calculate state from scratch up to target
        // Ideally we optimize this, but for <50 actions it's instant.
        // TODO: optimizing this later

        // Temporarily just pause
    };

    const togglePlay = () => setIsPlaying(!isPlaying);

    return {
        gameState: {
            players,
            pot,
            board,
            currentStreet
        },
        controls: {
            isPlaying,
            togglePlay,
            nextAction,
            prevAction,
            resetHand,
            canNext: handData ? currentActionIndex < handData.actions.length - 1 : false,
            canPrev: currentActionIndex >= 0
        }
    };
};
