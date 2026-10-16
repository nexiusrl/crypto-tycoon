import React, { useMemo } from 'react';
import { useTradingStore } from '../../store/tradingStore';
import { usePlayerStore } from '../../store/playerStore';
import { useMarketStore } from '../../store/marketStore';
import { calculateAum, unrealizedPnl } from '../../utils/calculations';
import { formatCurrency, formatPercentPlain } from '../../utils/formatters';
import type { Position } from '../../types/trading';

const PositionRow: React.FC<{ position: Position; currentPrice: number }> = ({ position, currentPrice }) => {
  const pnl = unrealizedPnl(position, currentPrice);
  const isProfit = pnl >= 0;
  const pnlPercent = position.margin > 0 ? pnl / position.margin : 0;

  return (
    <tr className="border-b border-slate-700/50 hover:bg-slate-800/50">
      <td className="px-3 py-2 text-xs">
        <span className={`font-medium ${position.type === 'long' ? 'text-emerald-400' : 'text-red-400'}`}>
          {position.type.toUpperCase()}
        </span>
      </td>
      <td className="px-3 py-2 text-xs text-white uppercase">{position.coinId}</td>
      <td className="px-3 py-2 text-xs text-white">{position.size}</td>
      <td className="px-3 py-2 text-xs text-white">{position.leverage}x</td>
      <td className="px-3 py-2 text-xs text-slate-300">{formatCurrency(position.entryPrice)}</td>
      <td className="px-3 py-2 text-xs text-slate-300">{formatCurrency(currentPrice)}</td>
      <td className={`px-3 py-2 text-xs font-medium ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
        {isProfit ? '+' : ''}{formatCurrency(pnl)} ({formatPercentPlain(pnlPercent)})
      </td>
      <td className="px-3 py-2 text-xs text-slate-300">{formatCurrency(position.liquidationPrice)}</td>
    </tr>
  );
};

export const PortfolioView: React.FC = () => {
  const positions = useTradingStore((state) => state.positions);
  const orders = useTradingStore((state) => state.orders);
  const cash = usePlayerStore((state) => state.cash);
  const totalRealizedPnl = usePlayerStore((state) => state.totalRealizedPnl);
  const coins = useMarketStore((state) => state.coins);

  const currentPrices = useMemo(() => {
    const map: Record<string, number> = {};
    for (const coin of coins) {
      map[coin.id] = coin.currentPrice;
    }
    return map;
  }, [coins]);

  const openPositions = useMemo(() => positions.filter((p) => !p.closedAt), [positions]);
  const closedPositions = useMemo(() => positions.filter((p) => p.closedAt), [positions]);

  const aum = useMemo(() => calculateAum(cash, openPositions, currentPrices), [cash, openPositions, currentPrices]);

  const totalUnrealizedPnl = useMemo(
    () => openPositions.reduce((sum, p) => sum + unrealizedPnl(p, currentPrices[p.coinId] ?? p.entryPrice), 0),
    [openPositions, currentPrices]
  );

  const stats = useMemo(() => {
    const trades = closedPositions;
    const winningTrades = trades.filter((t) => t.realizedPnl >= 0);
    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? winningTrades.length / totalTrades : 0;
    const avgPnl = totalTrades > 0 ? trades.reduce((sum, t) => sum + t.realizedPnl, 0) / totalTrades : 0;

    return {
      totalTrades,
      winRate,
      avgPnl,
      openCount: openPositions.length,
    };
  }, [closedPositions, openPositions.length]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400">AUM</p>
          <p className="text-lg font-bold text-white">{formatCurrency(aum)}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400">Unrealized P&L</p>
          <p className={`text-lg font-bold ${totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalUnrealizedPnl >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedPnl)}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400">Realized P&L</p>
          <p className={`text-lg font-bold ${totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalRealizedPnl >= 0 ? '+' : ''}{formatCurrency(totalRealizedPnl)}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400">Win Rate</p>
          <p className="text-lg font-bold text-white">{formatPercentPlain(stats.winRate)}</p>
        </div>
      </div>

      {/* Open Positions */}
      <div>
        <h4 className="text-white font-bold mb-2">Open Positions ({openPositions.length})</h4>
        {openPositions.length === 0 ? (
          <p className="text-slate-500 text-sm py-4">No open positions.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Side</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Coin</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Size</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Lev</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Entry</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Mark</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">P&L</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Liq</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map((pos) => (
                  <PositionRow
                    key={pos.id}
                    position={pos}
                    currentPrice={currentPrices[pos.coinId] ?? pos.entryPrice}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order History */}
      <div>
        <h4 className="text-white font-bold mb-2">Order History ({orders.length})</h4>
        {orders.length === 0 ? (
          <p className="text-slate-500 text-sm py-4">No orders placed yet.</p>
        ) : (
          <div className="overflow-x-auto max-h-48">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Type</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Side</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Coin</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Size</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Lev</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice().reverse().map((order) => (
                  <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td className="px-3 py-2 text-xs text-slate-300 capitalize">{order.type}</td>
                    <td className="px-3 py-2 text-xs">
                      <span className={order.side === 'buy' ? 'text-emerald-400' : 'text-red-400'}>
                        {order.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-white uppercase">{order.coinId}</td>
                    <td className="px-3 py-2 text-xs text-white">{order.size}</td>
                    <td className="px-3 py-2 text-xs text-white">{order.leverage}x</td>
                    <td className="px-3 py-2 text-xs">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          order.status === 'filled'
                            ? 'bg-emerald-900 text-emerald-400'
                            : order.status === 'pending'
                            ? 'bg-yellow-900 text-yellow-400'
                            : order.status === 'rejected'
                            ? 'bg-red-900 text-red-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Closed Positions / Trade History */}
      <div>
        <h4 className="text-white font-bold mb-2">Closed Positions ({closedPositions.length})</h4>
        {closedPositions.length === 0 ? (
          <p className="text-slate-500 text-sm py-4">No closed positions yet.</p>
        ) : (
          <div className="overflow-x-auto max-h-48">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Side</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Coin</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Size</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Entry</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Close</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">P&L</th>
                  <th className="px-3 py-2 text-xs text-slate-400 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {closedPositions.map((pos) => (
                  <tr key={pos.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td className="px-3 py-2 text-xs">
                      <span className={pos.type === 'long' ? 'text-emerald-400' : 'text-red-400'}>
                        {pos.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-white uppercase">{pos.coinId}</td>
                    <td className="px-3 py-2 text-xs text-white">{pos.size}</td>
                    <td className="px-3 py-2 text-xs text-slate-300">{formatCurrency(pos.entryPrice)}</td>
                    <td className="px-3 py-2 text-xs text-slate-300">
                      {pos.closePrice ? formatCurrency(pos.closePrice) : '-'}
                    </td>
                    <td className={`px-3 py-2 text-xs font-medium ${pos.realizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pos.realizedPnl >= 0 ? '+' : ''}{formatCurrency(pos.realizedPnl)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {pos.closedAt ? new Date(pos.closedAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
