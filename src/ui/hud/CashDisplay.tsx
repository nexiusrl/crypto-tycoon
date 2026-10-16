import React, { useMemo } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { useTradingStore } from '../../store/tradingStore';
import { useMarketStore } from '../../store/marketStore';
import { useGameStore } from '../../store/gameStore';
import { calculateAum } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import { DIFFICULTY_START_CASH } from '../../constants/difficulty';

export const CashDisplay: React.FC = () => {
  const cash = usePlayerStore((state) => state.cash);
  const positions = useTradingStore((state) => state.positions);
  const coins = useMarketStore((state) => state.coins);
  const difficulty = useGameStore((state) => state.difficulty);

  const currentPrices = useMemo(() => {
    const map: Record<string, number> = {};
    for (const coin of coins) {
      map[coin.id] = coin.currentPrice;
    }
    return map;
  }, [coins]);

  const aum = useMemo(() => calculateAum(cash, positions, currentPrices), [cash, positions, currentPrices]);

  const startingCash = DIFFICULTY_START_CASH[difficulty];
  const pnl = aum - startingCash;
  const isProfit = pnl >= 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="px-4 py-2 bg-slate-800/90 backdrop-blur rounded-lg border border-slate-700 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm">Cash</span>
          <span className="text-white font-bold text-lg">{formatCurrency(cash)}</span>
        </div>
      </div>
      <div className="px-4 py-2 bg-slate-800/90 backdrop-blur rounded-lg border border-slate-700 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm">AUM</span>
          <span className="text-white font-bold text-lg">{formatCurrency(aum)}</span>
          <span className={`text-sm font-medium ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{formatCurrency(pnl)}
          </span>
        </div>
      </div>
    </div>
  );
};
