import { SeatData } from './PokerTable';
import { ActionRecord, Street, PotInfo } from './ActionHistory';

interface HandHistoryInput {
    seats: SeatData[];
    actions: ActionRecord[];
    communityCards: string[];
    stakes: string; // e.g. "5/10"
    tableSize: number;
    pot: number;
    pots: PotInfo[];
    sb: number;
    bb: number;
    rake?: number; // optional rake amount (defaults to 0)
}

/**
 * Convert internal card format to PokerStars format
 */
function formatCard(card: string): string {
    if (!card || card.startsWith('?')) return '??';
    return card;
}

/**
 * Format a list of cards in PokerStars bracket notation
 * e.g. ['Ah', 'Kd'] → '[Ah Kd]'
 */
function formatCards(cards: string[]): string {
    const formatted = cards.filter(c => c && c.length > 0).map(formatCard);
    return formatted.length > 0 ? `[${formatted.join(' ')}]` : '';
}

/**
 * Get the dealer (BTN) seat number (1-indexed)
 */
function getDealerSeat(seats: SeatData[]): number {
    const idx = seats.findIndex(s => s.isDealer);
    return idx >= 0 ? idx + 1 : 1;
}

/**
 * Format amount — integers without decimals, fractional with 2 decimals
 * $5, $500, $2.50, $408.04
 */
function formatAmount(amount: number): string {
    if (Number.isInteger(amount)) {
        return `$${amount}`;
    }
    return `$${amount.toFixed(2)}`;
}

/**
 * Get initial seats from the first action's prevState, or use current seats as fallback
 */
function getInitialSeats(input: HandHistoryInput): SeatData[] {
    if (input.actions.length > 0 && input.actions[0].prevState) {
        return input.actions[0].prevState.seats;
    }
    return input.seats;
}

/**
 * Format date as PokerStars style: YYYY/MM/DD HH:MM:SS ET
 */
function formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${y}/${m}/${d} ${hh}:${mm}:${ss} ET`;
}

/**
 * Get the position label for summary (e.g. "(button)", "(small blind)")
 */
function positionLabel(position: string): string {
    switch (position) {
        case 'BTN': return '(button)';
        case 'SB': return '(small blind)';
        case 'BB': return '(big blind)';
        default: return '';
    }
}

/**
 * Get the max current bet across all players from a seats array
 */
function getMaxBet(seats: SeatData[]): number {
    return Math.max(0, ...seats.map(s => s.currentBet));
}

/**
 * Generate a hand history in PokerStars format from the replayer state.
 * Compatible with PokerTracker 4 import.
 */
export function formatHandHistory(input: HandHistoryInput): string {
    const { actions, communityCards, tableSize, sb, bb } = input;
    const initialSeats = getInitialSeats(input);
    const lines: string[] = [];
    const handId = Date.now();
    const now = new Date();

    // Display position map (internal BTN → display BU)
    const DISPLAY_POS: Record<string, string> = { BTN: 'BU' };

    // Build position → display name mapping
    // Hero seat uses "Hero", linked players use playerName, others use display position
    const nameMap: Record<string, string> = {};
    initialSeats.forEach(seat => {
        if (seat.playerName) {
            nameMap[seat.position] = seat.playerName;
        } else if (seat.isHero) {
            nameMap[seat.position] = 'Hero';
        } else {
            nameMap[seat.position] = DISPLAY_POS[seat.position] || seat.position;
        }
    });
    const dn = (pos: string) => nameMap[pos] || DISPLAY_POS[pos] || pos;

    // === HEADER ===
    lines.push(`PokerStars Hand #${handId}: Hold'em No Limit (${formatAmount(sb)}/${formatAmount(bb)} USD) - ${formatDate(now)}`);
    lines.push(`Table 'Turn Pro' ${tableSize}-max Seat #${getDealerSeat(initialSeats)} is the button`);

    // === SEAT LISTING ===
    const occupiedSeats = initialSeats.filter(s => s.position);
    occupiedSeats.forEach(seat => {
        const seatNum = initialSeats.indexOf(seat) + 1;
        const initialStack = seat.stack + seat.currentBet;
        lines.push(`Seat ${seatNum}: ${dn(seat.position)} (${formatAmount(initialStack)} in chips) `);
    });

    // === BLINDS ===
    const sbSeat = initialSeats.find(s => s.position === 'SB');
    const bbSeat = initialSeats.find(s => s.position === 'BB');
    if (sbSeat) {
        lines.push(`${dn('SB')}: posts small blind ${formatAmount(sb)}`);
    }
    if (bbSeat) {
        lines.push(`${dn('BB')}: posts big blind ${formatAmount(bb)}`);
    }

    // === HOLE CARDS ===
    lines.push('*** HOLE CARDS ***');
    const hero = initialSeats.find(s => s.isHero);
    if (hero && hero.cards.length > 0 && hero.cards.some(c => c && !c.startsWith('?'))) {
        lines.push(`Dealt to ${dn(hero.position)} ${formatCards(hero.cards)}`);
    }

    // === ACTIONS ===
    const flop = communityCards.slice(0, 3).filter(c => c);
    const turn = communityCards[3] || '';
    const river = communityCards[4] || '';
    let lastStreetPrinted: string = 'preflop';

    // Track total wagered for summary pot calculation
    let totalWagered = sb + bb; // blinds count as wagered

    // Track per-seat info for summary
    const seatFoldStreet: Record<string, string> = {};
    const seatBetPreflop: Set<string> = new Set();

    for (const action of actions) {
        // Insert street separators when street changes
        if (action.street && action.street !== lastStreetPrinted) {
            const newStreet = action.street;
            if (lastStreetPrinted === 'preflop' && flop.length > 0) {
                lines.push(`*** FLOP *** ${formatCards(flop)}`);
                lastStreetPrinted = 'flop';
            }
            if (lastStreetPrinted === 'flop' && (newStreet === 'turn' || newStreet === 'river') && turn) {
                lines.push(`*** TURN *** ${formatCards(flop)} [${formatCard(turn)}]`);
                lastStreetPrinted = 'turn';
            }
            if (lastStreetPrinted === 'turn' && newStreet === 'river' && river) {
                const turnCards = turn ? [...flop, turn] : flop;
                lines.push(`*** RIVER *** ${formatCards(turnCards)} [${formatCard(river)}]`);
                lastStreetPrinted = 'river';
            }
        }

        // Track fold street for summary
        if (action.action === 'fold') {
            seatFoldStreet[action.player] = action.street || lastStreetPrinted;
        }

        // Track if player bet/raised/called preflop
        const actionStreet = action.street || lastStreetPrinted;
        if (actionStreet === 'preflop' &&
            (action.action === 'bet' || action.action === 'raise' || action.action === 'call' || action.action === 'all-in')) {
            seatBetPreflop.add(action.player);
        }

        // Format the action line using display name
        const player = dn(action.player);
        switch (action.action) {
            case 'fold':
                lines.push(`${player}: folds `);
                break;
            case 'check':
                lines.push(`${player}: checks `);
                break;
            case 'call':
                if (action.amount) {
                    totalWagered += action.amount;
                }
                lines.push(`${player}: calls ${formatAmount(action.amount || 0)} `);
                break;
            case 'bet':
                if (action.amount) {
                    totalWagered += action.amount;
                }
                lines.push(`${player}: bets ${formatAmount(action.amount || 0)} `);
                break;
            case 'raise': {
                // Calculate raise-by amount from prevState
                let raiseBy = action.amount || 0;
                if (action.prevState) {
                    const maxBet = getMaxBet(action.prevState.seats);
                    const playerSeat = action.prevState.seats.find(s => s.position === action.player);
                    const playerPrevBet = playerSeat ? playerSeat.currentBet : 0;
                    // Additional chips put in = total - player's previous bet
                    const additionalChips = (action.amount || 0) - playerPrevBet;
                    raiseBy = (action.amount || 0) - maxBet;
                    totalWagered += additionalChips;
                } else if (action.amount) {
                    totalWagered += action.amount;
                }
                lines.push(`${player}: raises ${formatAmount(Math.max(0, raiseBy))} to ${formatAmount(action.amount || 0)} `);
                break;
            }
            case 'all-in': {
                let allInRaiseBy = action.amount || 0;
                if (action.prevState) {
                    const maxBet = getMaxBet(action.prevState.seats);
                    const playerSeat = action.prevState.seats.find(s => s.position === action.player);
                    const playerPrevBet = playerSeat ? playerSeat.currentBet : 0;
                    const additionalChips = (action.amount || 0) - playerPrevBet;
                    allInRaiseBy = (action.amount || 0) - maxBet;
                    totalWagered += additionalChips;
                } else if (action.amount) {
                    totalWagered += action.amount;
                }
                lines.push(`${player}: raises ${formatAmount(Math.max(0, allInRaiseBy))} to ${formatAmount(action.amount || 0)} and is all-in `);
                break;
            }
        }
    }

    // === SHOWDOWN ===
    if (lastStreetPrinted === 'showdown' || actions.some(a => a.street === 'showdown')) {
        lines.push('*** SHOWDOWN ***');
        const finalSeats = input.seats;
        finalSeats.forEach(seat => {
            if (!seat.isFolded && seat.cards.length > 0 && seat.cards.some(c => c && !c.startsWith('?'))) {
                lines.push(`${dn(seat.position)}: shows ${formatCards(seat.cards)}`);
            }
        });
    }

    // === SUMMARY ===
    lines.push('*** SUMMARY ***');
    const rake = input.rake || 0;
    const collected = totalWagered - rake;
    lines.push(`Total pot ${formatAmount(totalWagered)} | Rake ${formatAmount(rake)} `);

    const boardCards = communityCards.filter(c => c);
    if (boardCards.length > 0) {
        lines.push(`Board ${formatCards(boardCards)}`);
    }

    // Per-seat summary
    const streetDisplayName = (street: string) => {
        switch (street) {
            case 'preflop': return 'Flop';  // "folded before Flop"
            case 'flop': return 'Turn';
            case 'turn': return 'River';
            default: return '';
        }
    };

    occupiedSeats.forEach(seat => {
        const seatNum = initialSeats.indexOf(seat) + 1;
        const posLabel = positionLabel(seat.position);
        const posStr = posLabel ? ` ${posLabel}` : '';
        const name = dn(seat.position);

        if (seatFoldStreet[seat.position]) {
            const foldStreet = seatFoldStreet[seat.position];
            const didBet = seatBetPreflop.has(seat.position);
            if (foldStreet === 'preflop') {
                const betNote = didBet ? '' : " (didn't bet)";
                lines.push(`Seat ${seatNum}: ${name}${posStr} folded before Flop${betNote}`);
            } else {
                lines.push(`Seat ${seatNum}: ${name}${posStr} folded on the ${streetDisplayName(foldStreet)}`);
            }
        } else if (!seat.isFolded) {
            // Check if this is a showdown situation or they won uncontested
            const hasShowdown = lastStreetPrinted === 'showdown' || actions.some(a => a.street === 'showdown');
            const hasCards = seat.cards.length > 0 && seat.cards.some(c => c && !c.startsWith('?'));
            // For now mark non-folded players as collected (winner) or mucked
            // A simple heuristic: if only one player remains, they collected
            const nonFolded = occupiedSeats.filter(s => !seatFoldStreet[s.position]);
            if (nonFolded.length === 1) {
                // Uncontested winner
                lines.push(`Seat ${seatNum}: ${name}${posStr} collected (${formatAmount(collected)})`);
            } else if (hasCards) {
                // Went to showdown with cards
                lines.push(`Seat ${seatNum}: ${name}${posStr} showed ${formatCards(seat.cards)}`);
            } else {
                lines.push(`Seat ${seatNum}: ${name}${posStr} mucked`);
            }
        }
    });

    // Trailing blank line (separator between hands for PT4)
    lines.push('');

    return lines.join('\n');
}
