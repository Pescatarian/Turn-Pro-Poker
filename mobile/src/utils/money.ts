import { Session } from '../types';

/**
 * Convert cents to formatted dollar string
 * All monetary values stored as integers (cents) to avoid floating-point issues
 */
export function formatCents(cents: number): string {
  const dollars = cents / 100;
  const isNegative = dollars < 0;
  const absValue = Math.abs(dollars);
  
  const formatted = absValue.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Convert dollar amount to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Calculate stats from sessions
 */
export function calculateStats(sessions: Session[]) {
  if (sessions.length === 0) {
    return {
      netProfitCents: 0,
      hourlyRateCents: 0,
      totalHours: 0,
      sessionCount: 0,
      winRate: 0,
      avgSessionCents: 0,
    };
  }

  let totalProfitCents = 0;
  let totalHours = 0;
  let winningSessionCount = 0;

  for (const session of sessions) {
    const sessionProfit = session.cashoutCents - session.buyinCents;
    totalProfitCents += sessionProfit;
    totalHours += session.hours;
    if (sessionProfit > 0) {
      winningSessionCount++;
    }
  }

  const hourlyRateCents = totalHours > 0 
    ? Math.round(totalProfitCents / totalHours) 
    : 0;

  const winRate = (winningSessionCount / sessions.length) * 100;
  const avgSessionCents = Math.round(totalProfitCents / sessions.length);

  return {
    netProfitCents: totalProfitCents,
    hourlyRateCents,
    totalHours,
    sessionCount: sessions.length,
    winRate,
    avgSessionCents,
  };
}