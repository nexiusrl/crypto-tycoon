// ============================================================
// Trading Types — Crypto Tycoon
// ============================================================

export type OrderType = 'market' | 'limit' | 'stop-loss' | 'stop-limit';
export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'rejected';
export type PositionType = 'long' | 'short';

/**
 * A trade order placed by the player.
 */
export interface Order {
  id: string;
  coinId: string;
  type: OrderType;
  side: OrderSide;
  price?: number;        // limit price (cents)
  stopPrice?: number;    // trigger price for stop orders (cents)
  size: number;          // base units (e.g. 0.5 BTC)
  leverage: number;      // 1–10
  status: OrderStatus;
  createdAt: number;     // game timestamp
  filledAt?: number;     // when filled
  filledPrice?: number;  // execution price
}

/**
 * An open position resulting from a filled order.
 */
export interface Position {
  id: string;
  coinId: string;
  type: PositionType;
  entryPrice: number;     // cents
  size: number;           // base units
  leverage: number;       // 1–10
  margin: number;         // collateral locked (cents)
  liquidationPrice: number; // cents
  unrealizedPnl: number;  // cents
  realizedPnl: number;    // cents (set on close)
  stopLoss?: number;      // cents
  takeProfit?: number;    // cents
  openedAt: number;       // game timestamp
  closedAt?: number;      // game timestamp
  closePrice?: number;    // cents
}

/**
 * A completed trade record for history / stats.
 */
export interface TradeRecord {
  id: string;
  positionId: string;
  coinId: string;
  type: PositionType;
  entryPrice: number;
  closePrice: number;
  size: number;
  leverage: number;
  pnl: number;            // realized P&L in cents
  pnlPercent: number;     // percent return on margin
  openedAt: number;
  closedAt: number;
}

/**
 * Snapshot of the entire trading subsystem for save/load.
 */
export interface TradingState {
  orders: Order[];
  positions: Position[];
  history: TradeRecord[];
  nextOrderId: number;
  nextPositionId: number;
}

// ============================================================
// Default trading state
// ============================================================

export const DEFAULT_TRADING_STATE: TradingState = {
  orders: [],
  positions: [],
  history: [],
  nextOrderId: 1,
  nextPositionId: 1,
};
