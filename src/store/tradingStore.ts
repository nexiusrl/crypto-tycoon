// ============================================================
// tradingStore — Orders, positions, history
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, Position, TradeRecord, TradingState } from '../types/trading';
import { DEFAULT_TRADING_STATE } from '../types/trading';

interface TradingStore extends TradingState {
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  removeOrder: (orderId: string) => void;

  setPositions: (positions: Position[]) => void;
  addPosition: (position: Position) => void;
  updatePosition: (positionId: string, updates: Partial<Position>) => void;
  removePosition: (positionId: string) => void;

  addHistory: (record: TradeRecord) => void;
  clearHistory: () => void;

  setNextIds: (nextOrderId: number, nextPositionId: number) => void;
  reset: () => void;
  loadState: (state: TradingState) => void;

  getOpenPositions: () => Position[];
  getPendingOrders: () => Order[];
  getFilledOrders: () => Order[];
  getPositionByCoin: (coinId: string) => Position | undefined;
  getTotalUnrealizedPnl: () => number;
  getTotalMarginUsed: () => number;
}

export const useTradingStore = create<TradingStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_TRADING_STATE,

      setOrders: (orders) => set({ orders: [...orders] }),

      addOrder: (order) =>
        set((state) => ({ orders: [...state.orders, order] })),

      updateOrder: (orderId, updates) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, ...updates } : o
          ),
        })),

      removeOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== orderId),
        })),

      setPositions: (positions) => set({ positions: [...positions] }),

      addPosition: (position) =>
        set((state) => ({ positions: [...state.positions, position] })),

      updatePosition: (positionId, updates) =>
        set((state) => ({
          positions: state.positions.map((p) =>
            p.id === positionId ? { ...p, ...updates } : p
          ),
        })),

      removePosition: (positionId) =>
        set((state) => ({
          positions: state.positions.filter((p) => p.id !== positionId),
        })),

      addHistory: (record) =>
        set((state) => ({ history: [...state.history, record] })),

      clearHistory: () => set({ history: [] }),

      setNextIds: (nextOrderId, nextPositionId) =>
        set({ nextOrderId, nextPositionId }),

      reset: () => set({ ...DEFAULT_TRADING_STATE }),

      loadState: (state) => set({ ...state }),

      getOpenPositions: () =>
        get().positions.filter((p) => !p.closedAt),

      getPendingOrders: () =>
        get().orders.filter((o) => o.status === 'pending'),

      getFilledOrders: () =>
        get().orders.filter((o) => o.status === 'filled'),

      getPositionByCoin: (coinId) =>
        get().positions.find((p) => p.coinId === coinId && !p.closedAt),

      getTotalUnrealizedPnl: () =>
        get().positions.reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0),

      getTotalMarginUsed: () =>
        get().positions.reduce((sum, p) => sum + p.margin, 0),
    }),
    {
      name: 'ct_trading',
      partialize: (state) => ({
        orders: state.orders,
        positions: state.positions,
        history: state.history,
        nextOrderId: state.nextOrderId,
        nextPositionId: state.nextPositionId,
      }),
    }
  )
);
