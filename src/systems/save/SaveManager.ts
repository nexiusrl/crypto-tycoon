// ============================================================
// SaveManager — Capture / restore / persist the full game state
// ============================================================

import type { SaveData } from '../../types/game';
import { DEFAULT_SETTINGS } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { usePlayerStore } from '../../store/playerStore';
import { useMarketStore } from '../../store/marketStore';
import { useTradingStore } from '../../store/tradingStore';
import {
  saveSlot,
  loadSlot,
  deleteSlot,
  type SaveSlot,
} from '../../utils/storage';

/** Bump when the SaveData shape changes in a breaking way. */
export const SAVE_VERSION = '1.0.0';

/**
 * Assemble a complete SaveData snapshot from every Zustand store.
 */
export function captureSave(now: number = Date.now()): SaveData {
  const game = useGameStore.getState();
  const player = usePlayerStore.getState();
  const market = useMarketStore.getState();
  const trading = useTradingStore.getState();

  return {
    version: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
    game: {
      phase: game.phase,
      day: game.day,
      hour: game.hour,
      minute: game.minute,
      isPaused: game.isPaused,
      speed: game.speed,
      difficulty: game.difficulty,
    },
    player: {
      cash: player.cash,
      cryptoCredits: player.cryptoCredits,
      reputation: player.reputation,
      totalRealizedPnl: player.totalRealizedPnl,
      bestTrade: player.bestTrade,
      worstTrade: player.worstTrade,
      maxDrawdown: player.maxDrawdown,
      peakAum: player.peakAum,
    },
    market: {
      coins: market.coins,
      activeEvents: market.activeEvents,
      activeNews: market.activeNews,
      newsHistory: market.newsHistory,
      eventHistory: market.eventHistory,
      lastTick: market.lastTick,
    },
    trading: {
      orders: trading.orders,
      positions: trading.positions,
      history: trading.history,
      nextOrderId: trading.nextOrderId,
      nextPositionId: trading.nextPositionId,
    },
    settings: { ...DEFAULT_SETTINGS },
  };
}

/**
 * Write a captured snapshot back into every store.
 */
export function restoreSave(data: SaveData): void {
  useGameStore.setState({ ...data.game });
  usePlayerStore.setState({ ...data.player });
  useMarketStore.setState({ ...data.market });
  useTradingStore.setState({ ...data.trading });
}

/** Persist the current state into a slot. Returns true on success. */
export function writeSlot(slot: SaveSlot): boolean {
  const existing = readSlot(slot);
  const snapshot = captureSave();
  // Preserve the original creation time when overwriting an existing save.
  if (existing) snapshot.createdAt = existing.createdAt;
  return saveSlot(slot, snapshot) === true;
}

/** Read a slot's SaveData, or null when empty / corrupt. */
export function readSlot(slot: SaveSlot): SaveData | null {
  const result = loadSlot<SaveData>(slot);
  if (!result || typeof result !== 'object' || 'type' in result) return null;
  return result;
}

/** Auto-save into the 'auto' slot. */
export function autoSave(): boolean {
  return writeSlot('auto');
}

/** Manual save into one of the two manual slots. */
export function manualSave(slot: 'manual1' | 'manual2'): boolean {
  return writeSlot(slot);
}

/**
 * Load a slot into the live stores.
 * Returns false when the slot is empty or malformed.
 */
export function loadFromSlot(slot: SaveSlot): boolean {
  const data = readSlot(slot);
  if (!data) return false;
  restoreSave(data);
  return true;
}

/** Remove a slot's saved data. */
export function clearSlot(slot: SaveSlot): void {
  deleteSlot(slot);
}
