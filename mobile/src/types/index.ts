// All monetary values stored as integers (cents)

export interface Session {
  id: string;
  walletId: string;
  date: string; // ISO string
  location: string;
  buyinCents: number;
  cashoutCents: number;
  hours: number;
  bb?: string; // Big blind e.g. "1/2"
  tipsCents?: number;
  expensesCents?: number;
  notes?: string;
  createdAt: string;
  syncedAt?: string; // null if pending sync
}

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  currency: string;
  balanceCents: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  amountCents: number; // positive for deposits, negative for withdrawals
  balanceAfterCents: number;
  transactionType: 'game' | 'adjustment' | 'deposit' | 'withdrawal' | 'fee';
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Hand {
  id: string;
  sessionId?: string;
  date: string;
  pot: number;
  street: 'preflop' | 'flop' | 'turn' | 'river';
  actions: HandAction[];
  heroCards?: string[];
  communityCards?: string[];
  notes?: string;
}

export interface HandAction {
  type: 'fold' | 'check' | 'call' | 'bet' | 'raise';
  player: string;
  amount?: number;
}

export interface Subscription {
  id: string;
  userId: string;
  provider: 'stripe' | 'apple' | 'google';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  planId: string;
  currentPeriodEnd: string;
}