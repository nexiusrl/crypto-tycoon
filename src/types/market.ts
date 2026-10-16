// ============================================================
// Market Types — Crypto Tycoon
// ============================================================

/**
 * A single OHLCV price point for candlestick charts.
 * All monetary values stored in integer cents to avoid floating-point errors.
 */
export interface PricePoint {
  timestamp: number; // game timestamp (minutes since epoch or absolute ms)
  open: number;      // cents
  high: number;      // cents
  low: number;       // cents
  close: number;     // cents
  volume: number;    // base units traded
}

/**
 * Represents a tradeable cryptocurrency asset.
 */
export interface Coin {
  id: string;
  symbol: string;
  name: string;
  basePrice: number;      // starting price in cents
  volatility: number;     // std-dev scaling per tick (e.g. 0.002 for BTC)
  drift: number;          // expected return per tick (e.g. 0.0001)
  currentPrice: number;   // latest price in cents
  priceHistory: PricePoint[];
}

/**
 * A news headline that temporarily influences market sentiment.
 */
export interface NewsItem {
  id: string;
  headline: string;
  coinId?: string;        // undefined = market-wide
  sentiment: number;      // -1 (very bearish) to 1 (very bullish)
  duration: number;       // game hours the effect lasts
  timestamp: number;      // when the news broke
}

/**
 * A dramatic market event with strong, time-bound price impact.
 */
export type MarketEventType = 'crash' | 'bullrun' | 'hack' | 'etf' | 'rugpull';

export interface MarketEvent {
  id: string;
  type: MarketEventType;
  targetCoin?: string;    // undefined = affects all coins
  impact: number;         // multiplier applied to returns (e.g. -0.30)
  duration: number;       // game hours
  headline: string;
  timestamp: number;      // when the event started
}

/**
 * Snapshot of the entire market for save/load.
 */
export interface MarketState {
  coins: Coin[];
  activeEvents: MarketEvent[];
  activeNews: NewsItem[];
  newsHistory: NewsItem[];
  eventHistory: MarketEvent[];
  lastTick: number;
}

// ============================================================
// Default coin definitions
// ============================================================

export const DEFAULT_COINS: Coin[] = [
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    basePrice: 500_00_00, // $50,000.00 in cents
    volatility: 0.002,
    drift: 0.0001,
    currentPrice: 500_00_00,
    priceHistory: [],
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    basePrice: 3_00_00_00, // $3,000.00 in cents
    volatility: 0.004,
    drift: 0.0002,
    currentPrice: 3_00_00_00,
    priceHistory: [],
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    basePrice: 1_00_00_00, // $100.00 in cents
    volatility: 0.008,
    drift: 0,
    currentPrice: 1_00_00_00,
    priceHistory: [],
  },
  {
    id: 'doge',
    symbol: 'DOGE',
    name: 'Dogecoin',
    basePrice: 10, // $0.10 in cents
    volatility: 0.015,
    drift: 0,
    currentPrice: 10,
    priceHistory: [],
  },
  {
    id: 'shib',
    symbol: 'SHIB',
    name: 'Shiba Inu',
    basePrice: 1, // $0.0001 in cents (scaled)
    volatility: 0.03,
    drift: -0.0001,
    currentPrice: 1,
    priceHistory: [],
  },
];
