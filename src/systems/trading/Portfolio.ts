// ============================================================
// Portfolio — P&L tracking, statistics, trade history
// ============================================================

import type { Position, TradeRecord } from '../../types/trading';
import { realizedPnl, returnOnMargin } from '../../utils/calculations';

export interface DailySummary {
  day: number;
  startCash: number;
  endCash: number;
  realizedPnl: number;
  tradesClosed: number;
  bestTrade: number;
  worstTrade: number;
}

export interface PortfolioStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  totalRealizedPnl: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export class Portfolio {
  private history: TradeRecord[] = [];
  private dailySummaries: DailySummary[] = [];
  private peakAum = 0;

  /** Record a closed trade. */
  recordTrade(
    position: Position,
    closePrice: number,
    closedAt: number
  ): TradeRecord {
    const pnl = realizedPnl(position.entryPrice, closePrice, position.size, position.type);
    const rom = returnOnMargin(pnl, position.margin);

    const record: TradeRecord = {
      id: `trade_${this.history.length + 1}`,
      positionId: position.id,
      coinId: position.coinId,
      type: position.type,
      entryPrice: position.entryPrice,
      closePrice,
      size: position.size,
      leverage: position.leverage,
      pnl,
      pnlPercent: rom,
      openedAt: position.openedAt,
      closedAt,
    };

    this.history.push(record);
    return record;
  }

  /** Get all trade records. */
  getHistory(): readonly TradeRecord[] {
    return this.history;
  }

  /** Clear history (new game). */
  reset(): void {
    this.history = [];
    this.dailySummaries = [];
    this.peakAum = 0;
  }

  /** Load from save. */
  load(history: TradeRecord[], summaries: DailySummary[], peakAum: number): void {
    this.history = [...history];
    this.dailySummaries = [...summaries];
    this.peakAum = peakAum;
  }

  /** Export for save. */
  export(): { history: TradeRecord[]; dailySummaries: DailySummary[]; peakAum: number } {
    return {
      history: [...this.history],
      dailySummaries: [...this.dailySummaries],
      peakAum: this.peakAum,
    };
  }

  /**
   * Compute lifetime portfolio statistics.
   */
  computeStats(currentAum: number): PortfolioStats {
    const wins = this.history.filter((t) => t.pnl > 0);
    const losses = this.history.filter((t) => t.pnl < 0);
    const totalTrades = this.history.length;

    const totalWin = wins.reduce((s, t) => s + t.pnl, 0);
    const totalLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

    const avgWin = wins.length > 0 ? totalWin / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLoss / losses.length : 0;

    // Update peak AUM & drawdown
    if (currentAum > this.peakAum) this.peakAum = currentAum;
    const drawdown = this.peakAum > 0 ? (this.peakAum - currentAum) / this.peakAum : 0;

    // Simplified Sharpe = mean return / std dev of returns
    const returns = this.history.map((t) => t.pnlPercent);
    const mean = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length || 1);
    const sharpe = variance > 0 ? mean / Math.sqrt(variance) : 0;

    return {
      totalTrades,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRate: totalTrades > 0 ? wins.length / totalTrades : 0,
      avgWin,
      avgLoss,
      profitFactor: totalLoss > 0 ? totalWin / totalLoss : totalWin > 0 ? Infinity : 0,
      bestTrade: totalTrades > 0 ? Math.max(...this.history.map((t) => t.pnl)) : 0,
      worstTrade: totalTrades > 0 ? Math.min(...this.history.map((t) => t.pnl)) : 0,
      totalRealizedPnl: this.history.reduce((s, t) => s + t.pnl, 0),
      maxDrawdown: drawdown,
      sharpeRatio: sharpe,
    };
  }

  /**
   * End-of-day summary.
   */
  closeDay(day: number, startCash: number, endCash: number): DailySummary {
    const dayTrades = this.history.filter(
      (t) => Math.floor(t.closedAt / (24 * 60)) === day
    );
    const summary: DailySummary = {
      day,
      startCash,
      endCash,
      realizedPnl: endCash - startCash,
      tradesClosed: dayTrades.length,
      bestTrade: dayTrades.length > 0 ? Math.max(...dayTrades.map((t) => t.pnl)) : 0,
      worstTrade: dayTrades.length > 0 ? Math.min(...dayTrades.map((t) => t.pnl)) : 0,
    };
    this.dailySummaries.push(summary);
    return summary;
  }

  getDailySummaries(): readonly DailySummary[] {
    return this.dailySummaries;
  }
}
