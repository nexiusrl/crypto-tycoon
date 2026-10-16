// ============================================================
// Difficulty Constants — Crypto Tycoon
// ============================================================

import type { Difficulty } from '../types/game';
import { getDefaultPlayerState } from '../types/game';

/**
 * Market volatility multiplier per difficulty.
 * Applied when constructing the MarketSimulator (scales each coin's volatility).
 *   easy   = 0.8  (−20% volatility)
 *   normal = 1.0  (baseline)
 *   hard   = 1.2  (+20% volatility)
 */
export const DIFFICULTY_VOLATILITY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 0.8,
  normal: 1.0,
  hard: 1.2,
};

/**
 * Starting cash (integer cents) per difficulty, derived from the
 * canonical player defaults so there is a single source of truth.
 */
export const DIFFICULTY_START_CASH: Record<Difficulty, number> = {
  easy: getDefaultPlayerState('easy').cash, // $100,000
  normal: getDefaultPlayerState('normal').cash, // $10,000
  hard: getDefaultPlayerState('hard').cash, // $1,000
};

export interface DifficultyOption {
  id: Difficulty;
  name: string;
  startCash: number; // cents
  volatilityMultiplier: number;
  description: string;
}

export const DIFFICULTY_OPTIONS: readonly DifficultyOption[] = [
  {
    id: 'easy',
    name: 'Easy',
    startCash: DIFFICULTY_START_CASH.easy,
    volatilityMultiplier: DIFFICULTY_VOLATILITY_MULTIPLIER.easy,
    description: 'A relaxed start with a $100,000 cushion and calmer markets. Learn the systems.',
  },
  {
    id: 'normal',
    name: 'Normal',
    startCash: DIFFICULTY_START_CASH.normal,
    volatilityMultiplier: DIFFICULTY_VOLATILITY_MULTIPLIER.normal,
    description: 'The standard experience. $10,000 and baseline market volatility.',
  },
  {
    id: 'hard',
    name: 'Hard',
    startCash: DIFFICULTY_START_CASH.hard,
    volatilityMultiplier: DIFFICULTY_VOLATILITY_MULTIPLIER.hard,
    description: 'Only $1,000 and wilder markets. For min-maxers who like a challenge.',
  },
];
