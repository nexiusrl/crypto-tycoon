// ============================================================
// gameStore — Time, phase, speed, pause
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, GameSpeed, Difficulty } from '../types/game';
import { getDefaultGameState } from '../types/game';

interface GameStore extends GameState {
  setPhase: (phase: number) => void;
  setDay: (day: number) => void;
  setHour: (hour: number) => void;
  setMinute: (minute: number) => void;
  setTime: (day: number, hour: number, minute: number) => void;
  tick: (minutes?: number) => void;
  togglePause: () => void;
  setPaused: (paused: boolean) => void;
  setSpeed: (speed: GameSpeed) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  reset: (difficulty?: Difficulty) => void;
  isMarketOpen: () => boolean;
  getTotalGameMinutes: () => number;
}

const MARKET_OPEN_HOUR = 6;
const MARKET_CLOSE_HOUR = 22;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...getDefaultGameState(),

      setPhase: (phase) => set({ phase }),
      setDay: (day) => set({ day }),
      setHour: (hour) => set({ hour: Math.max(0, Math.min(23, hour)) }),
      setMinute: (minute) => set({ minute: Math.max(0, Math.min(59, minute)) }),

      setTime: (day, hour, minute) =>
        set({
          day: Math.max(1, day),
          hour: Math.max(0, Math.min(23, hour)),
          minute: Math.max(0, Math.min(59, minute)),
        }),

      tick: (minutes = 1) => {
        const state = get();
        let { day, hour, minute } = state;
        minute += minutes;

        while (minute >= 60) {
          minute -= 60;
          hour += 1;
        }
        while (hour >= 24) {
          hour -= 24;
          day += 1;
        }

        set({ day, hour, minute });
      },

      togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
      setPaused: (isPaused) => set({ isPaused }),
      setSpeed: (speed) => set({ speed }),
      setDifficulty: (difficulty) => set({ difficulty }),

      reset: (difficulty = 'normal') => {
        set({ ...getDefaultGameState(difficulty) });
      },

      isMarketOpen: () => {
        const { hour } = get();
        return hour >= MARKET_OPEN_HOUR && hour < MARKET_CLOSE_HOUR;
      },

      getTotalGameMinutes: () => {
        const { day, hour, minute } = get();
        return (day - 1) * 24 * 60 + hour * 60 + minute;
      },
    }),
    {
      name: 'ct_game',
      partialize: (state) => ({
        phase: state.phase,
        day: state.day,
        hour: state.hour,
        minute: state.minute,
        isPaused: state.isPaused,
        speed: state.speed,
        difficulty: state.difficulty,
      }),
    }
  )
);
