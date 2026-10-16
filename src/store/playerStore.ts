// ============================================================
// playerStore — Cash, AUM, stats, progression
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerState, Difficulty } from '../types/game';
import { getDefaultPlayerState } from '../types/game';

interface PlayerStore extends PlayerState {
  setCash: (cash: number) => void;
  addCash: (amount: number) => void;
  subtractCash: (amount: number) => void;
  setReputation: (reputation: number) => void;
  addReputation: (amount: number) => void;
  recordRealizedPnl: (pnl: number) => void;
  updateBestWorstTrades: (pnl: number) => void;
  updateMaxDrawdown: (currentAum: number) => void;
  reset: (difficulty?: Difficulty) => void;

  getAum: (positionValues: Record<string, number>) => number;
  canAfford: (amount: number) => boolean;
  isBankrupt: () => boolean;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      ...getDefaultPlayerState(),

      setCash: (cash) => set({ cash: Math.max(0, cash) }),

      addCash: (amount) =>
        set((state) => {
          const newCash = state.cash + amount;
          return { cash: newCash };
        }),

      subtractCash: (amount) =>
        set((state) => ({
          cash: Math.max(0, state.cash - amount),
        })),

      setReputation: (reputation) =>
        set({ reputation: Math.max(0, Math.min(100, reputation)) }),

      addReputation: (amount) =>
        set((state) => ({
          reputation: Math.max(0, Math.min(100, state.reputation + amount)),
        })),

      recordRealizedPnl: (pnl) =>
        set((state) => ({
          totalRealizedPnl: state.totalRealizedPnl + pnl,
        })),

      updateBestWorstTrades: (pnl) =>
        set((state) => ({
          bestTrade: Math.max(state.bestTrade, pnl),
          worstTrade: Math.min(state.worstTrade, pnl),
        })),

      updateMaxDrawdown: (currentAum) =>
        set((state) => {
          const newPeak = Math.max(state.peakAum, currentAum);
          const drawdown = newPeak > 0 ? (newPeak - currentAum) / newPeak : 0;
          return {
            peakAum: newPeak,
            maxDrawdown: Math.max(state.maxDrawdown, drawdown),
          };
        }),

      reset: (difficulty = 'normal') => {
        set({ ...getDefaultPlayerState(difficulty) });
      },

      getAum: (positionValues) => {
        const state = get();
        let aum = state.cash;
        for (const value of Object.values(positionValues)) {
          aum += value;
        }
        return Math.max(0, aum);
      },

      canAfford: (amount) => get().cash >= amount,

      isBankrupt: () => get().cash <= 0,
    }),
    {
      name: 'ct_player',
      partialize: (state) => ({
        cash: state.cash,
        cryptoCredits: state.cryptoCredits,
        reputation: state.reputation,
        totalRealizedPnl: state.totalRealizedPnl,
        bestTrade: state.bestTrade,
        worstTrade: state.worstTrade,
        maxDrawdown: state.maxDrawdown,
        peakAum: state.peakAum,
      }),
    }
  )
);
