import { create } from 'zustand';
import type { MarketState, Coin } from '../types/market';
import { DEFAULT_COINS } from '../types/market';

interface MarketStore extends MarketState {
  updatePrice: (coinId: string, price: number) => void;
  getCoin: (coinId: string) => Coin | undefined;
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  coins: DEFAULT_COINS,
  activeEvents: [],
  activeNews: [],
  newsHistory: [],
  eventHistory: [],
  lastTick: 0,
  updatePrice: (coinId, price) =>
    set((state) => ({
      coins: state.coins.map((coin) =>
        coin.id === coinId ? { ...coin, currentPrice: price } : coin
      ),
    })),
  getCoin: (coinId) => get().coins.find((c) => c.id === coinId),
}));
