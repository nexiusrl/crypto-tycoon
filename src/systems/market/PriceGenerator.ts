// ============================================================
// PriceGenerator — Random walk with drift & volatility
// ============================================================

import type { Coin, PricePoint } from '../../types/market';
import { SeededRNG } from '../../utils/random';

const MAX_HISTORY = 1000;

export interface PriceUpdateResult {
  newPrice: number;
  pricePoint: PricePoint;
}

export class PriceGenerator {
  private rng: SeededRNG;

  constructor(seed?: number) {
    this.rng = new SeededRNG(seed);
  }

  /**
   * Generate the next price for a coin using geometric Brownian motion.
   *
   *   return = drift + volatility * Z + eventImpact + newsImpact
   *   newPrice = oldPrice * (1 + return)
   *
   * Prices are clamped to a minimum of 1 cent.
   */
  tick(
    coin: Coin,
    eventImpact: number,
    newsImpact: number,
    volume: number
  ): PriceUpdateResult {
    const z = this.rng.normal();
    const ret = coin.drift + coin.volatility * z + eventImpact + newsImpact;
    const rawPrice = coin.currentPrice * (1 + ret);
    const newPrice = Math.max(1, Math.round(rawPrice));

    const now = Date.now();
    const pricePoint: PricePoint = {
      timestamp: now,
      open: coin.currentPrice,
      high: Math.max(coin.currentPrice, newPrice),
      low: Math.min(coin.currentPrice, newPrice),
      close: newPrice,
      volume,
    };

    return { newPrice, pricePoint };
  }

  /**
   * Batch-update an array of coins.
   */
  tickAll(
    coins: Coin[],
    impacts: Record<string, { event: number; news: number }>,
    volumes: Record<string, number>
  ): Map<string, PriceUpdateResult> {
    const results = new Map<string, PriceUpdateResult>();
    for (const coin of coins) {
      const impact = impacts[coin.id] ?? { event: 0, news: 0 };
      const result = this.tick(coin, impact.event, impact.news, volumes[coin.id] ?? 0);
      results.set(coin.id, result);
    }
    return results;
  }

  setSeed(seed: number): void {
    this.rng.setSeed(seed);
  }
}

/**
 * Append a price point to a coin's history, capping at MAX_HISTORY.
 */
export function appendPriceHistory(coin: Coin, point: PricePoint): void {
  coin.priceHistory.push(point);
  if (coin.priceHistory.length > MAX_HISTORY) {
    coin.priceHistory.shift();
  }
  coin.currentPrice = point.close;
}
