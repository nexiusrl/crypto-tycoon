// ============================================================
// MarketSimulator — Orchestrates price, news, and events
// ============================================================

import type { Coin, MarketEvent, MarketState, NewsItem } from '../../types/market';
import { DEFAULT_COINS } from '../../types/market';
import { SeededRNG } from '../../utils/random';
import { PriceGenerator, appendPriceHistory } from './PriceGenerator';
import { NewsGenerator } from './NewsGenerator';
import { EventGenerator } from './EventGenerator';

export interface TickResult {
  updatedCoins: Coin[];
  newEvents: MarketEvent[];
  newNews: NewsItem[];
}

export class MarketSimulator {
  private priceGen: PriceGenerator;
  private newsGen: NewsGenerator;
  private eventGen: EventGenerator;
  private rng: SeededRNG;

  private state: MarketState;
  private gameHour = 6;

  constructor(seed?: number, volatilityMultiplier = 1) {
    this.rng = new SeededRNG(seed);
    this.priceGen = new PriceGenerator(seed);
    this.newsGen = new NewsGenerator(seed);
    this.eventGen = new EventGenerator(seed);

    this.state = {
      coins: DEFAULT_COINS.map((c) => ({
        ...c,
        volatility: c.volatility * volatilityMultiplier,
        priceHistory: [],
      })),
      activeEvents: [],
      activeNews: [],
      newsHistory: [],
      eventHistory: [],
      lastTick: Date.now(),
    };
  }

  /** Current market state (mutable — stores mutate in place). */
  getState(): MarketState {
    return this.state;
  }

  /** Set the internal game clock (used to drive event cooldowns). */
  setTime(day: number, hour: number): void {
    this.gameHour = day * 24 + hour;
  }

  /**
   * Advance the market by one tick (1 game hour).
   * Call this every real-time tick based on game speed.
   */
  tick(): TickResult {
    const newEvents: MarketEvent[] = [];
    const newNews: NewsItem[] = [];

    // 1. Try spawn event
    const evt = this.eventGen.tryGenerate(this.gameHour);
    if (evt) {
      this.state.activeEvents.push(evt);
      this.state.eventHistory.push(evt);
      newEvents.push(evt);
    }

    // 2. Try spawn news (10% chance per tick)
    if (this.rng.chance(0.10)) {
      const news = this.newsGen.generateOne();
      this.state.activeNews.push(news);
      this.state.newsHistory.push(news);
      newNews.push(news);
    }

    // 3. Compute impacts
    const volMap: Record<string, number> = {};
    for (const c of this.state.coins) volMap[c.id] = c.volatility;

    const eventImpacts = this.eventGen.computeImpacts(this.state.activeEvents);
    const newsImpacts = this.newsGen.computeImpacts(this.state.activeNews, volMap);

    // 4. Generate volumes (randomized around a base)
    const volumes: Record<string, number> = {};
    for (const c of this.state.coins) {
      volumes[c.id] = Math.floor(this.rng.range(100, 10_000));
    }

    // 5. Price update
    const impacts: Record<string, { event: number; news: number }> = {};
    for (const c of this.state.coins) {
      impacts[c.id] = {
        event: eventImpacts[c.id] ?? 0,
        news: newsImpacts[c.id] ?? 0,
      };
    }

    const results = this.priceGen.tickAll(this.state.coins, impacts, volumes);
    for (const [coinId, result] of results) {
      const coin = this.state.coins.find((c) => c.id === coinId);
      if (coin) {
        appendPriceHistory(coin, result.pricePoint);
      }
    }

    // 6. Expire old news / events
    this.expireEffects();

    this.state.lastTick = Date.now();
    this.gameHour++;

    return { updatedCoins: this.state.coins, newEvents, newNews };
  }

  /**
   * Generate the initial batch of daily news (called at market open).
   */
  generateDailyNews(): NewsItem[] {
    const items = this.newsGen.generateDailyNews();
    this.state.activeNews.push(...items);
    this.state.newsHistory.push(...items);
    return items;
  }

  /**
   * Reset the market to initial state.
   */
  reset(): void {
    this.state = {
      coins: DEFAULT_COINS.map((c) => ({ ...c, priceHistory: [] })),
      activeEvents: [],
      activeNews: [],
      newsHistory: [],
      eventHistory: [],
      lastTick: Date.now(),
    };
    this.gameHour = 6;
  }

  /**
   * Load market state from a saved snapshot.
   */
  load(state: MarketState): void {
    this.state = state;
  }

  private expireEffects(): void {
    // Keep only recent active items to prevent unbounded growth
    if (this.state.activeNews.length > 24) {
      this.state.activeNews = this.state.activeNews.slice(-24);
    }
    if (this.state.activeEvents.length > 8) {
      this.state.activeEvents = this.state.activeEvents.slice(-8);
    }
  }
}
