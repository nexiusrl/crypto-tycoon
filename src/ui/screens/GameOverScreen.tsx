import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { usePlayerStore } from '../../store/playerStore';
import { formatCurrency } from '../../utils/formatters';

interface GameOverScreenProps {
  onLoadLastSave: () => void;
  onNewGame: () => void;
}

const StatRow: React.FC<{ label: string; value: string; accent?: string }> = ({
  label,
  value,
  accent = 'text-white',
}) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
    <span className="text-slate-400 text-sm">{label}</span>
    <span className={`font-bold ${accent}`}>{value}</span>
  </div>
);

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  onLoadLastSave,
  onNewGame,
}) => {
  const day = useGameStore((state) => state.day);
  const phase = useGameStore((state) => state.phase);
  const totalRealizedPnl = usePlayerStore((state) => state.totalRealizedPnl);
  const bestTrade = usePlayerStore((state) => state.bestTrade);
  const worstTrade = usePlayerStore((state) => state.worstTrade);

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur px-6">
      <span className="text-6xl mb-4">💀</span>
      <h1 className="text-5xl font-black text-red-500 mb-2">BANKRUPT</h1>
      <p className="text-slate-400 mb-8">Your trading empire has collapsed.</p>

      <div className="w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
        <h3 className="text-white font-bold mb-3">Final Stats</h3>
        <StatRow label="Day Reached" value={`Day ${day}`} />
        <StatRow label="Phase Reached" value={`Phase ${phase}`} />
        <StatRow
          label="Total Realized P&L"
          value={`${totalRealizedPnl >= 0 ? '+' : ''}${formatCurrency(totalRealizedPnl)}`}
          accent={totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
        <StatRow label="Best Trade" value={`+${formatCurrency(bestTrade)}`} accent="text-emerald-400" />
        <StatRow label="Worst Trade" value={formatCurrency(worstTrade)} accent="text-red-400" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <button
          onClick={onLoadLastSave}
          className="flex-1 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 transition-colors"
        >
          Load Last Save
        </button>
        <button
          onClick={onNewGame}
          className="flex-1 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-95"
        >
          New Game
        </button>
      </div>
    </div>
  );
};
