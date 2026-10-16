import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useMarketStore } from '../../store/marketStore';
import { useTradingStore } from '../../store/tradingStore';
import { usePlayerStore } from '../../store/playerStore';
import { requiredMargin, liquidationPrice } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import type { OrderSide, Position } from '../../types/trading';

const COIN_TABS = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum' },
  { id: 'sol', symbol: 'SOL', name: 'Solana' },
  { id: 'doge', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'shib', symbol: 'SHIB', name: 'Shiba Inu' },
];

export const TradingDashboard: React.FC = () => {
  const [activeCoin, setActiveCoin] = useState('btc');
  const [orderSide, setOrderSide] = useState<OrderSide>('buy');
  const [size, setSize] = useState('0.1');
  const [leverage, setLeverage] = useState(1);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');

  const coins = useMarketStore((state) => state.coins);
  const positions = useTradingStore((state) => state.positions);
  const addPosition = useTradingStore((state) => state.addPosition);
  const cash = usePlayerStore((state) => state.cash);
  const subtractCash = usePlayerStore((state) => state.subtractCash);

  const coin = useMemo(() => coins.find((c) => c.id === activeCoin), [coins, activeCoin]);
  const price = coin?.currentPrice ?? 0;

  const coinPositions = useMemo(
    () => positions.filter((p) => p.coinId === activeCoin && !p.closedAt),
    [positions, activeCoin]
  );

  const sizeNum = parseFloat(size) || 0;
  const marginNeeded = useMemo(
    () => (price > 0 && sizeNum > 0 ? requiredMargin(sizeNum, price, leverage) : 0),
    [price, sizeNum, leverage]
  );

  const liqPrice = useMemo(() => {
    if (price <= 0 || sizeNum <= 0) return 0;
    const posType = orderSide === 'buy' ? 'long' : 'short';
    return liquidationPrice(price, leverage, posType);
  }, [price, sizeNum, leverage, orderSide]);

  const series = useMemo(() => {
    if (!coin || coin.priceHistory.length === 0) {
      return [{ data: [] as { x: number; y: [number, number, number, number] }[] }];
    }
    const data = coin.priceHistory.slice(-60).map((p) => ({
      x: p.timestamp,
      y: [p.open / 100, p.high / 100, p.low / 100, p.close / 100] as [number, number, number, number],
    }));
    return [{ data }];
  }, [coin]);

  const chartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'candlestick',
        height: 320,
        background: 'transparent',
        toolbar: { show: false },
        animations: { enabled: false },
      },
      theme: { mode: 'dark' },
      xaxis: {
        type: 'datetime',
        labels: { style: { colors: '#94a3b8' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        tooltip: { enabled: true },
        labels: {
          style: { colors: '#94a3b8' },
          formatter: (val: number) => `$${val.toLocaleString()}`,
        },
      },
      grid: {
        borderColor: '#334155',
        strokeDashArray: 4,
      },
      plotOptions: {
        candlestick: {
          colors: {
            upward: '#10b981',
            downward: '#ef4444',
          },
        },
      },
    }),
    []
  );

  const handlePlaceOrder = useCallback(() => {
    if (!coin || sizeNum <= 0 || marginNeeded > cash) return;

    const posType = orderSide === 'buy' ? 'long' : 'short';
    const position: Position = {
      id: `pos_${Date.now()}`,
      coinId: coin.id,
      type: posType,
      entryPrice: price,
      size: sizeNum,
      leverage,
      margin: marginNeeded,
      liquidationPrice: liqPrice,
      unrealizedPnl: 0,
      realizedPnl: 0,
      openedAt: Date.now(),
    };

    addPosition(position);
    subtractCash(marginNeeded);
  }, [coin, sizeNum, marginNeeded, cash, orderSide, price, leverage, liqPrice, addPosition, subtractCash]);

  useEffect(() => {
    if (price > 0) {
      setLimitPrice((price / 100).toFixed(2));
    }
  }, [activeCoin, price]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
        {COIN_TABS.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCoin(c.id)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeCoin === c.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {c.symbol}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-bold text-white">{formatCurrency(price)}</span>
          <span className="ml-2 text-slate-400">{coin?.symbol}</span>
        </div>
        <div className="text-sm text-slate-400">
          Cash: <span className="text-white font-medium">{formatCurrency(cash)}</span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-lg p-2">
        <ReactApexChart
          options={chartOptions}
          series={series}
          type="candlestick"
          height={320}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 rounded-lg p-4 flex flex-col gap-3">
          <h4 className="text-white font-bold">Place Order</h4>

          <div className="flex gap-2">
            {(['market', 'limit'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={`px-3 py-1 rounded text-sm capitalize transition-colors ${
                  orderType === t ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setOrderSide('buy')}
              className={`flex-1 py-2 rounded font-medium transition-colors ${
                orderSide === 'buy' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Long
            </button>
            <button
              onClick={() => setOrderSide('sell')}
              className={`flex-1 py-2 rounded font-medium transition-colors ${
                orderSide === 'sell' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Short
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-400">Size</label>
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              min="0.001"
              step="0.01"
              className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {orderType === 'limit' && (
            <div>
              <label className="text-xs text-slate-400">Limit Price</label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <div className="flex justify-between">
              <label className="text-xs text-slate-400">Leverage</label>
              <span className="text-xs text-white font-medium">{leverage}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value, 10))}
              className="w-full mt-1 accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>1x</span>
              <span>10x</span>
            </div>
          </div>

          <div className="bg-slate-800 rounded p-2 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Margin Required</span>
              <span className="text-white">{formatCurrency(marginNeeded)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Liquidation Price</span>
              <span className="text-red-400">{formatCurrency(liqPrice)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={marginNeeded > cash || sizeNum <= 0}
            className={`w-full py-2 rounded font-medium transition-colors ${
              orderSide === 'buy'
                ? 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900'
                : 'bg-red-600 hover:bg-red-500 disabled:bg-red-900'
            } text-white disabled:cursor-not-allowed`}
          >
            {marginNeeded > cash ? 'Insufficient Margin' : `Open ${orderSide === 'buy' ? 'Long' : 'Short'}`}
          </button>
        </div>

        <div className="bg-slate-900 rounded-lg p-4 flex flex-col gap-3">
          <h4 className="text-white font-bold">Positions</h4>

          {coinPositions.length === 0 ? (
            <p className="text-slate-500 text-sm">No open positions for {coin?.symbol}</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {coinPositions.map((pos) => {
                const pnl = pos.unrealizedPnl;
                const isProfit = pnl >= 0;
                return (
                  <div key={pos.id} className="bg-slate-800 rounded p-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${pos.type === 'long' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pos.type.toUpperCase()} {pos.leverage}x
                      </span>
                      <span className={isProfit ? 'text-emerald-400' : 'text-red-400'}>
                        {isProfit ? '+' : ''}{formatCurrency(pnl)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 mt-1">
                      <span>Size: {pos.size}</span>
                      <span>Entry: {formatCurrency(pos.entryPrice)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Margin: {formatCurrency(pos.margin)}</span>
                      <span>Liq: {formatCurrency(pos.liquidationPrice)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-slate-800 pt-3 mt-auto">
            <h5 className="text-white font-medium text-sm mb-2">Risk Metrics</h5>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Margin Used</span>
                <span className="text-white">
                  {formatCurrency(positions.reduce((sum, p) => sum + (p.closedAt ? 0 : p.margin), 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Free Cash</span>
                <span className="text-white">{formatCurrency(cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Positions</span>
                <span className="text-white">{positions.filter((p) => !p.closedAt).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
