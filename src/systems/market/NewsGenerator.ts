// ============================================================
// NewsGenerator — Weighted random news headlines
// ============================================================

import type { NewsItem } from '../../types/market';
import { SeededRNG } from '../../utils/random';

interface NewsTemplate {
  headline: string;
  sentiment: number;
  duration: number;
  coinId?: string;
}

const TEMPLATES: NewsTemplate[] = [
  { headline: 'Bitcoin ETF sees record inflows', sentiment: 0.6, duration: 4, coinId: 'btc' },
  { headline: 'Major exchange adds Bitcoin Lightning support', sentiment: 0.4, duration: 3, coinId: 'btc' },
  { headline: 'Bitcoin mining difficulty hits all-time high', sentiment: 0.2, duration: 2, coinId: 'btc' },
  { headline: 'Regulatory scrutiny intensifies on Bitcoin', sentiment: -0.4, duration: 3, coinId: 'btc' },
  { headline: 'Whale moves 10,000 BTC to exchange', sentiment: -0.5, duration: 2, coinId: 'btc' },
  { headline: 'Ethereum Layer-2 throughput surges', sentiment: 0.5, duration: 3, coinId: 'eth' },
  { headline: 'Major DeFi protocol launches on Ethereum', sentiment: 0.4, duration: 4, coinId: 'eth' },
  { headline: 'Ethereum gas fees spike to yearly high', sentiment: -0.3, duration: 2, coinId: 'eth' },
  { headline: 'Staking rewards decrease post-upgrade', sentiment: -0.2, duration: 3, coinId: 'eth' },
  { headline: 'Solana network uptime reaches 99.9%', sentiment: 0.5, duration: 3, coinId: 'sol' },
  { headline: 'New NFT marketplace launches on Solana', sentiment: 0.3, duration: 2, coinId: 'sol' },
  { headline: 'Solana validator outage reported', sentiment: -0.6, duration: 2, coinId: 'sol' },
  { headline: 'Memecoin frenzy clogs Solana transactions', sentiment: -0.3, duration: 1, coinId: 'sol' },
  { headline: 'Celebrity tweets support for Dogecoin', sentiment: 0.7, duration: 2, coinId: 'doge' },
  { headline: 'Dogecoin tipping integration announced', sentiment: 0.3, duration: 3, coinId: 'doge' },
  { headline: 'Dogecoin development fund runs dry', sentiment: -0.4, duration: 2, coinId: 'doge' },
  { headline: 'Shiba Inu burn rate increases 500%', sentiment: 0.4, duration: 2, coinId: 'shib' },
  { headline: 'New Shiba ecosystem token announced', sentiment: 0.3, duration: 2, coinId: 'shib' },
  { headline: 'Rumors of Shiba Inu founder identity', sentiment: -0.3, duration: 1, coinId: 'shib' },
  { headline: 'Global markets rally on inflation data', sentiment: 0.5, duration: 3 },
  { headline: 'Fed signals potential rate pause', sentiment: 0.4, duration: 4 },
  { headline: 'Dollar strength pressures crypto markets', sentiment: -0.4, duration: 3 },
  { headline: 'Major stablecoin depegs briefly', sentiment: -0.7, duration: 2 },
  { headline: 'Crypto adoption hits new milestone', sentiment: 0.3, duration: 3 },
];

export class NewsGenerator {
  private rng: SeededRNG;
  private nextId = 1;

  constructor(seed?: number) {
    this.rng = new SeededRNG(seed);
  }

  /**
   * Generate 1–3 news items for a game day.
   */
  generateDailyNews(): NewsItem[] {
    const count = this.rng.rangeInt(1, 3);
    const items: NewsItem[] = [];
    const used = new Set<number>();

    for (let i = 0; i < count; i++) {
      let idx: number;
      do {
        idx = this.rng.rangeInt(0, TEMPLATES.length - 1);
      } while (used.has(idx));
      used.add(idx);

      const tpl = TEMPLATES[idx];
      items.push({
        id: `news_${this.nextId++}`,
        headline: tpl.headline,
        coinId: tpl.coinId,
        sentiment: tpl.sentiment + this.rng.normal() * 0.1,
        duration: tpl.duration,
        timestamp: Date.now(),
      });
    }

    return items;
  }

  /**
   * Generate a single random news item.
   */
  generateOne(): NewsItem {
    const tpl = this.rng.pick(TEMPLATES);
    return {
      id: `news_${this.nextId++}`,
      headline: tpl.headline,
      coinId: tpl.coinId,
      sentiment: tpl.sentiment + this.rng.normal() * 0.1,
      duration: tpl.duration,
      timestamp: Date.now(),
    };
  }

  /**
   * Compute aggregate news impact for each coin.
   * Impact = sum(sentiment * volatility * 0.5) for active news.
   */
  computeImpacts(
    activeNews: NewsItem[],
    coinVolatilities: Readonly<Record<string, number>>
  ): Record<string, number> {
    const impacts: Record<string, number> = {};

    for (const news of activeNews) {
      const targetCoins = news.coinId ? [news.coinId] : Object.keys(coinVolatilities);
      for (const cid of targetCoins) {
        const vol = coinVolatilities[cid] ?? 0.01;
        impacts[cid] = (impacts[cid] ?? 0) + news.sentiment * vol * 0.5;
      }
    }

    return impacts;
  }

  setSeed(seed: number): void {
    this.rng.setSeed(seed);
  }
}
