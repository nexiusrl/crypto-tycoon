// ============================================================
// Game & Player Types — Crypto Tycoon
// ============================================================

import type { MarketState } from './market';
import type { TradingState } from './trading';

export type GameSpeed = 0 | 1 | 2 | 5;
export type Difficulty = 'easy' | 'normal' | 'hard';

/**
 * Core game clock and progression state.
 */
export interface GameState {
  phase: number;          // 1 = Solo Trader
  day: number;            // starts at 1
  hour: number;           // 0–23
  minute: number;         // 0–59
  isPaused: boolean;
  speed: GameSpeed;       // 0 = paused, 1 = 1x, 2 = 2x, 5 = 5x
  difficulty: Difficulty;
}

/**
 * Player financials and lifetime statistics.
 */
export interface PlayerState {
  cash: number;           // cents
  cryptoCredits: number;  // loyalty / reward points (future use)
  reputation: number;     // 0–100
  totalRealizedPnl: number; // cents
  bestTrade: number;      // cents
  worstTrade: number;     // cents
  maxDrawdown: number;    // percent (0–1)
  peakAum: number;        // cents — used for drawdown calc
}

/**
 * User-controlled settings.
 */
export interface GameSettings {
  musicVolume: number;    // 0–1
  sfxVolume: number;      // 0–1
  chartType: 'candlestick' | 'line' | 'area';
  showTutorial: boolean;
}

/**
 * Full save payload.
 */
export interface SaveData {
  version: string;
  createdAt: number;
  updatedAt: number;
  game: GameState;
  player: PlayerState;
  market: MarketState;
  trading: TradingState;
  settings: GameSettings;
}

// ============================================================
// Default states
// ============================================================

export function getDefaultGameState(difficulty: Difficulty = 'normal'): GameState {
  return {
    phase: 1,
    day: 1,
    hour: 6,
    minute: 0,
    isPaused: true,
    speed: 1,
    difficulty,
  };
}

export function getDefaultPlayerState(difficulty: Difficulty = 'normal'): PlayerState {
  const startCash =
    difficulty === 'easy' ? 100_000_00 : // $100,000
    difficulty === 'hard' ? 1_000_00 :   // $1,000
    10_000_00;                           // $10,000 (normal)

  return {
    cash: startCash,
    cryptoCredits: 0,
    reputation: 50,
    totalRealizedPnl: 0,
    bestTrade: 0,
    worstTrade: 0,
    maxDrawdown: 0,
    peakAum: startCash,
  };
}

export const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.7,
  chartType: 'candlestick',
  showTutorial: true,
};
