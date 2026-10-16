// ============================================================
// Trading Calculations — Crypto Tycoon
// ============================================================

import type { Position, PositionType } from '../types/trading';

const MAINTENANCE_MARGIN_RATE = 0.05; // 5%
const FUNDING_FEE_RATE = 0.0001;      // 0.01% per game hour

/**
 * Calculate the notional value of a position in cents.
 */
export function positionValue(size: number, price: number): number {
  return size * price;
}

/**
 * Required margin to open a position.
 * margin = (size * price) / leverage
 */
export function requiredMargin(size: number, price: number, leverage: number): number {
  return Math.ceil((size * price) / leverage);
}

/**
 * Maintenance margin required to keep a position open.
 * maintenance = size * price * 0.05
 */
export function maintenanceMargin(size: number, price: number): number {
  return Math.ceil(size * price * MAINTENANCE_MARGIN_RATE);
}

/**
 * Liquidation price for a position.
 *
 * Long:  liq = entryPrice * (1 - 1/leverage + maintenanceRate)
 * Short: liq = entryPrice * (1 + 1/leverage - maintenanceRate)
 *
 * We add a tiny buffer so liquidation happens slightly before
 * theoretical zero equity, matching real exchange behaviour.
 */
export function liquidationPrice(
  entryPrice: number,
  leverage: number,
  type: PositionType
): number {
  const buffer = 0.005; // 0.5% safety buffer
  if (type === 'long') {
    const liq = entryPrice * (1 - 1 / leverage + MAINTENANCE_MARGIN_RATE + buffer);
    return Math.max(1, Math.floor(liq));
  }
  // short
  const liq = entryPrice * (1 + 1 / leverage - MAINTENANCE_MARGIN_RATE - buffer);
  return Math.ceil(liq);
}

/**
 * Unrealized P&L for a position at the current mark price.
 *
 * Long:  (mark - entry) * size
 * Short: (entry - mark) * size
 */
export function unrealizedPnl(position: Position, markPrice: number): number {
  const diff =
    position.type === 'long'
      ? markPrice - position.entryPrice
      : position.entryPrice - markPrice;
  return Math.round(diff * position.size);
}

/**
 * Realized P&L when closing a position.
 */
export function realizedPnl(
  entryPrice: number,
  closePrice: number,
  size: number,
  type: PositionType
): number {
  const diff =
    type === 'long' ? closePrice - entryPrice : entryPrice - closePrice;
  return Math.round(diff * size);
}

/**
 * Return on margin (percent) for a closed trade.
 */
export function returnOnMargin(pnl: number, margin: number): number {
  if (margin === 0) return 0;
  return pnl / margin;
}

/**
 * Funding fee for a short position held over `hours`.
 * Fee = size * entryPrice * 0.0001 * hours
 */
export function fundingFee(size: number, price: number, hours: number): number {
  return Math.ceil(size * price * FUNDING_FEE_RATE * hours);
}

/**
 * Check if a position should be liquidated at the given mark price.
 */
export function isLiquidated(position: Position, markPrice: number): boolean {
  if (position.type === 'long') {
    return markPrice <= position.liquidationPrice;
  }
  return markPrice >= position.liquidationPrice;
}

/**
 * Cross-margin health: total margin available vs total maintenance required.
 *
 * @param cash           free cash in cents
 * @param positions      all open positions
 * @param currentPrices  map coinId → current price (cents)
 * @returns object with { totalMargin, totalMaintenance, equity, health }
 */
export function crossMarginHealth(
  cash: number,
  positions: readonly Position[],
  currentPrices: Readonly<Record<string, number>>
): {
  totalMargin: number;
  totalMaintenance: number;
  equity: number;
  health: number; // 0 = liquidated, 1 = perfectly healthy
} {
  let totalUnrealized = 0;
  let totalMaintenance = 0;
  let totalMarginLocked = 0;

  for (const pos of positions) {
    const mark = currentPrices[pos.coinId] ?? pos.entryPrice;
    totalUnrealized += unrealizedPnl(pos, mark);
    totalMaintenance += maintenanceMargin(pos.size, mark);
    totalMarginLocked += pos.margin;
  }

  const equity = cash + totalMarginLocked + totalUnrealized;
  const health = totalMaintenance > 0
    ? Math.max(0, Math.min(1, equity / (totalMaintenance + cash)))
    : 1;

  return {
    totalMargin: totalMarginLocked,
    totalMaintenance,
    equity,
    health,
  };
}

/**
 * Determine which positions to liquidate first under cross-margin.
 * Closes the largest losing positions until solvent or bankrupt.
 */
export function liquidatePositions(
  cash: number,
  positions: readonly Position[],
  currentPrices: Readonly<Record<string, number>>
): { liquidatedIds: string[]; remaining: Position[]; bankruptcy: boolean } {
  const sorted = [...positions].sort((a, b) => {
    const pnlA = unrealizedPnl(a, currentPrices[a.coinId] ?? a.entryPrice);
    const pnlB = unrealizedPnl(b, currentPrices[b.coinId] ?? b.entryPrice);
    return pnlA - pnlB; // worst first
  });

  const liquidatedIds: string[] = [];
  let remaining = [...sorted];
  let bankrupt = false;

  while (remaining.length > 0) {
    const health = crossMarginHealth(cash, remaining, currentPrices);
    if (health.equity >= health.totalMaintenance) break;

    // Liquidate the worst position
    const victim = remaining[0];
    liquidatedIds.push(victim.id);
    remaining = remaining.slice(1);
  }

  if (remaining.length === 0) {
    const health = crossMarginHealth(cash, [], currentPrices);
    if (health.equity < 0) bankrupt = true;
  }

  return { liquidatedIds, remaining, bankruptcy: bankrupt };
}

/**
 * AUM = cash + sum of position mark values.
 */
export function calculateAum(
  cash: number,
  positions: readonly Position[],
  currentPrices: Readonly<Record<string, number>>
): number {
  let aum = cash;
  for (const pos of positions) {
    const mark = currentPrices[pos.coinId] ?? pos.entryPrice;
    aum += pos.margin + unrealizedPnl(pos, mark);
  }
  return Math.max(0, aum);
}
