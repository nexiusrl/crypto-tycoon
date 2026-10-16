// ============================================================
// TradingEngine — Orders, positions, execution, liquidation
// ============================================================

import type { Order, Position, OrderType, OrderSide, OrderStatus } from '../../types/trading';
import {
  requiredMargin,
  liquidationPrice,
  unrealizedPnl,
  realizedPnl,
  liquidatePositions,
  fundingFee,
} from '../../utils/calculations';
import { Portfolio } from './Portfolio';

export interface OrderRequest {
  coinId: string;
  type: OrderType;
  side: OrderSide;
  price?: number;
  stopPrice?: number;
  size: number;
  leverage: number;
}

export interface CloseRequest {
  positionId: string;
  percent?: number; // 0–1, default 1 = full close
}

export interface EngineState {
  cash: number;
  orders: Order[];
  positions: Position[];
}

export class TradingEngine {
  private orders: Order[] = [];
  private positions: Position[] = [];
  private cash = 0;
  private nextOrderId = 1;
  private nextPositionId = 1;
  private portfolio = new Portfolio();

  /** Current market prices — updated externally each tick. */
  private prices: Record<string, number> = {};

  // ── Setup ─────────────────────────────────────────────────

  setCash(cash: number): void {
    this.cash = cash;
  }

  getCash(): number {
    return this.cash;
  }

  setPrices(prices: Record<string, number>): void {
    this.prices = { ...prices };
  }

  getPortfolio(): Portfolio {
    return this.portfolio;
  }

  // ── Order lifecycle ───────────────────────────────────────

  placeOrder(req: OrderRequest): { order: Order; error?: string } {
    // Validation
    if (req.leverage < 1 || req.leverage > 10 || !Number.isInteger(req.leverage)) {
      return { order: this.makeOrder(req, 'rejected'), error: 'Leverage must be integer 1–10' };
    }
    if (req.size <= 0) {
      return { order: this.makeOrder(req, 'rejected'), error: 'Size must be positive' };
    }
    if (!this.prices[req.coinId]) {
      return { order: this.makeOrder(req, 'rejected'), error: 'Unknown coin' };
    }

    const price = this.prices[req.coinId];
    const marginNeeded = requiredMargin(req.size, price, req.leverage);

    // Check available cash for market orders
    if (req.type === 'market' && marginNeeded > this.cash) {
      return { order: this.makeOrder(req, 'rejected'), error: 'Insufficient margin' };
    }

    const order = this.makeOrder(req, 'pending');
    this.orders.push(order);

    if (req.type === 'market') {
      this.executeOrder(order, price);
    }

    return { order };
  }

  private makeOrder(req: OrderRequest, status: OrderStatus): Order {
    return {
      id: `order_${this.nextOrderId++}`,
      coinId: req.coinId,
      type: req.type,
      side: req.side,
      price: req.price,
      stopPrice: req.stopPrice,
      size: req.size,
      leverage: req.leverage,
      status,
      createdAt: Date.now(),
    };
  }

  cancelOrder(orderId: string): boolean {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order || order.status !== 'pending') return false;
    order.status = 'cancelled';
    return true;
  }

  // ── Execution ─────────────────────────────────────────────

  private executeOrder(order: Order, fillPrice: number): Position {
    order.status = 'filled';
    order.filledAt = Date.now();
    order.filledPrice = fillPrice;

    const margin = requiredMargin(order.size, fillPrice, order.leverage);
    this.cash -= margin;

    const posType = order.side === 'buy' ? 'long' : 'short';
    const liq = liquidationPrice(fillPrice, order.leverage, posType);

    const position: Position = {
      id: `pos_${this.nextPositionId++}`,
      coinId: order.coinId,
      type: posType,
      entryPrice: fillPrice,
      size: order.size,
      leverage: order.leverage,
      margin,
      liquidationPrice: liq,
      unrealizedPnl: 0,
      realizedPnl: 0,
      openedAt: Date.now(),
    };

    this.positions.push(position);
    return position;
  }

  // ── Close position ────────────────────────────────────────

  closePosition(req: CloseRequest): { pnl: number; error?: string } {
    const pos = this.positions.find((p) => p.id === req.positionId);
    if (!pos) return { pnl: 0, error: 'Position not found' };

    const price = this.prices[pos.coinId];
    if (!price) return { pnl: 0, error: 'No price available' };

    const percent = req.percent ?? 1;
    const closeSize = pos.size * percent;
    const pnl = realizedPnl(pos.entryPrice, price, closeSize, pos.type);

    // Release margin proportionally
    const marginReleased = Math.floor(pos.margin * percent);
    this.cash += marginReleased + pnl;

    if (percent >= 1) {
      // Full close
      pos.realizedPnl = pnl;
      pos.closedAt = Date.now();
      pos.closePrice = price;
      this.portfolio.recordTrade(pos, price, Date.now());
      this.positions = this.positions.filter((p) => p.id !== pos.id);
    } else {
      // Partial close — reduce size and margin
      pos.size -= closeSize;
      pos.margin -= marginReleased;
      pos.realizedPnl += pnl;
      // Create a synthetic trade record for the closed portion
      const synthetic: Position = {
        ...pos,
        id: `pos_${this.nextPositionId++}`,
        size: closeSize,
        margin: marginReleased,
        realizedPnl: pnl,
        closedAt: Date.now(),
        closePrice: price,
      };
      this.portfolio.recordTrade(synthetic, price, Date.now());
    }

    return { pnl };
  }

  // ── Tick update ───────────────────────────────────────────

  /**
   * Call every game tick with latest prices.
   * 1. Updates unrealized P&L
   * 2. Checks stop-loss / take-profit
   * 3. Checks liquidations
   * 4. Evaluates pending limit/stop orders
   */
  update(currentPrices: Record<string, number>): void {
    this.prices = { ...currentPrices };

    // Update P&L
    for (const pos of this.positions) {
      const price = currentPrices[pos.coinId];
      if (price) {
        pos.unrealizedPnl = unrealizedPnl(pos, price);
      }
    }

    // Check stop-loss / take-profit
    const toClose: string[] = [];
    for (const pos of this.positions) {
      const price = currentPrices[pos.coinId];
      if (!price) continue;

      if (pos.stopLoss) {
        const triggered =
          pos.type === 'long' ? price <= pos.stopLoss : price >= pos.stopLoss;
        if (triggered) toClose.push(pos.id);
      }
      if (pos.takeProfit) {
        const triggered =
          pos.type === 'long' ? price >= pos.takeProfit : price <= pos.takeProfit;
        if (triggered) toClose.push(pos.id);
      }
    }
    for (const id of toClose) {
      this.closePosition({ positionId: id });
    }

    // Check liquidations
    const liqResult = liquidatePositions(this.cash, this.positions, currentPrices);
    if (liqResult.liquidatedIds.length > 0) {
      for (const id of liqResult.liquidatedIds) {
        const pos = this.positions.find((p) => p.id === id);
        if (pos) {
          const price = currentPrices[pos.coinId] ?? pos.entryPrice;
          pos.realizedPnl = unrealizedPnl(pos, price);
          pos.closedAt = Date.now();
          pos.closePrice = price;
          this.portfolio.recordTrade(pos, price, Date.now());
        }
      }
      this.positions = liqResult.remaining;
      // Cash goes to zero on liquidation (simplified)
      if (liqResult.bankruptcy) {
        this.cash = 0;
      }
    }

    // Evaluate pending orders
    this.evaluatePendingOrders();
  }

  private evaluatePendingOrders(): void {
    for (const order of this.orders) {
      if (order.status !== 'pending') continue;
      const price = this.prices[order.coinId];
      if (!price) continue;

      let shouldFill = false;

      if (order.type === 'limit') {
        // Buy limit: fill when price <= limit
        // Sell limit: fill when price >= limit
        if (order.side === 'buy' && order.price && price <= order.price) shouldFill = true;
        if (order.side === 'sell' && order.price && price >= order.price) shouldFill = true;
      } else if (order.type === 'stop-loss') {
        // Buy stop: fill when price >= stop
        // Sell stop: fill when price <= stop
        if (order.side === 'buy' && order.stopPrice && price >= order.stopPrice) shouldFill = true;
        if (order.side === 'sell' && order.stopPrice && price <= order.stopPrice) shouldFill = true;
      } else if (order.type === 'stop-limit') {
        // Trigger stop, then place limit
        const triggered =
          order.side === 'buy'
            ? order.stopPrice && price >= order.stopPrice
            : order.stopPrice && price <= order.stopPrice;
        if (triggered && order.price) {
          // For simplicity, fill at limit price if market is favorable
          if (order.side === 'buy' && price <= order.price) shouldFill = true;
          if (order.side === 'sell' && price >= order.price) shouldFill = true;
        }
      }

      if (shouldFill) {
        const marginNeeded = requiredMargin(order.size, price, order.leverage);
        if (marginNeeded <= this.cash) {
          this.executeOrder(order, price);
        }
      }
    }
  }

  // ── Funding fees ──────────────────────────────────────────

  /**
   * Apply funding fees to all short positions.
   * Call every game hour.
   */
  applyFundingFees(): void {
    for (const pos of this.positions) {
      if (pos.type === 'short') {
        const fee = fundingFee(pos.size, pos.entryPrice, 1);
        this.cash -= fee;
        pos.realizedPnl -= fee;
      }
    }
  }

  // ── Queries ───────────────────────────────────────────────

  getOrders(): readonly Order[] {
    return this.orders;
  }

  getPositions(): readonly Position[] {
    return this.positions;
  }

  getOpenPositions(): readonly Position[] {
    return this.positions.filter((p) => !p.closedAt);
  }

  getPendingOrders(): readonly Order[] {
    return this.orders.filter((o) => o.status === 'pending');
  }

  getState(): EngineState {
    return {
      cash: this.cash,
      orders: [...this.orders],
      positions: [...this.positions],
    };
  }

  loadState(state: EngineState, nextOrderId: number, nextPositionId: number): void {
    this.cash = state.cash;
    this.orders = [...state.orders];
    this.positions = [...state.positions];
    this.nextOrderId = nextOrderId;
    this.nextPositionId = nextPositionId;
  }

  reset(): void {
    this.orders = [];
    this.positions = [];
    this.cash = 0;
    this.nextOrderId = 1;
    this.nextPositionId = 1;
    this.portfolio.reset();
  }
}
