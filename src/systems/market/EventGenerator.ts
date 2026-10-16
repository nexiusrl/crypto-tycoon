// ============================================================
// EventGenerator — Rare market events with cooldowns
// ============================================================

import type { MarketEvent, MarketEventType } from '../../types/market';
import { SeededRNG } from '../../utils/random';

interface EventTemplate {
  type: MarketEventType;
  headline: string;
  impactMin: number;
  impactMax: number;
  durationMin: number;
  durationMax: number;
  targetCoin?: string;
  weight: number;
}

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    type: 'crash',
    headline: 'FLASH CRASH: Mass liquidations cascade across exchanges',
    impactMin: -0.35,
    impactMax: -0.20,
    durationMin: 1,
    durationMax: 3,
    weight: 5,
  },
  {
    type: 'bullrun',
    headline: 'BULL RUN: Institutional buying frenzy drives prices higher',
    impactMin: 0.30,
    impactMax: 0.60,
    durationMin: 3,
    durationMax: 6,
    weight: 4,
  },
  {
    type: 'hack',
    headline: 'EXCHANGE HACK: Major platform loses user funds',
    impactMin: -0.25,
    impactMax: -0.10,
    durationMin: 2,
    durationMax: 4,
    weight: 3,
  },
  {
    type: 'etf',
    headline: 'ETF APPROVED: Spot Bitcoin ETF gets regulatory green light',
    impactMin: 0.15,
    impactMax: 0.30,
    durationMin: 4,
    durationMax: 8,
    targetCoin: 'btc',
    weight: 2,
  },
  {
    type: 'rugpull',
    headline: 'RUG PULL: Memecoin developers drain liquidity pool',
    impactMin: -0.95,
    impactMax: -0.80,
    durationMin: 1,
    durationMax: 2,
    targetCoin: 'shib',
    weight: 3,
  },
];

const DAILY_CHANCE = 0.08;
const COOLDOWN_HOURS = 48;

export class EventGenerator {
  private rng: SeededRNG;
  private nextId = 1;
  private lastEventTime = 0;

  constructor(seed?: number) {
    this.rng = new SeededRNG(seed);
  }

  /**
   * Try to generate a market event. Returns null if cooldown active
   * or RNG roll fails.
   *
   * @param gameHour  current total game hour (day*24 + hour)
   */
  tryGenerate(gameHour: number): MarketEvent | null {
    if (gameHour - this.lastEventTime < COOLDOWN_HOURS) return null;
    if (!this.rng.chance(DAILY_CHANCE)) return null;

    const tpl = this.rng.pickWeighted(
      EVENT_TEMPLATES,
      EVENT_TEMPLATES.map((e) => e.weight)
    );

    const event: MarketEvent = {
      id: `evt_${this.nextId++}`,
      type: tpl.type,
      targetCoin: tpl.targetCoin,
      impact: this.rng.range(tpl.impactMin, tpl.impactMax),
      duration: this.rng.rangeInt(tpl.durationMin, tpl.durationMax),
      headline: tpl.headline,
      timestamp: Date.now(),
    };

    this.lastEventTime = gameHour;
    return event;
  }

  /**
   * Force-generate an event (for testing / debugging).
   */
  forceGenerate(type?: MarketEventType): MarketEvent {
    const pool = type ? EVENT_TEMPLATES.filter((e) => e.type === type) : EVENT_TEMPLATES;
    const tpl = this.rng.pick(pool);

    return {
      id: `evt_${this.nextId++}`,
      type: tpl.type,
      targetCoin: tpl.targetCoin,
      impact: this.rng.range(tpl.impactMin, tpl.impactMax),
      duration: this.rng.rangeInt(tpl.durationMin, tpl.durationMax),
      headline: tpl.headline,
      timestamp: Date.now(),
    };
  }

  /**
   * Compute aggregate event impact per coin.
   */
  computeImpacts(activeEvents: MarketEvent[]): Record<string, number> {
    const impacts: Record<string, number> = {};
    for (const evt of activeEvents) {
      const targets = evt.targetCoin ? [evt.targetCoin] : ['btc', 'eth', 'sol', 'doge', 'shib'];
      for (const cid of targets) {
        impacts[cid] = (impacts[cid] ?? 0) + evt.impact;
      }
    }
    return impacts;
  }

  setSeed(seed: number): void {
    this.rng.setSeed(seed);
  }

  resetCooldown(): void {
    this.lastEventTime = 0;
  }
}
