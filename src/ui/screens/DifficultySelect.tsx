import React from 'react';
import { DIFFICULTY_OPTIONS } from '../../constants/difficulty';
import { formatCurrency } from '../../utils/formatters';
import type { Difficulty } from '../../types/game';

interface DifficultySelectProps {
  onSelect: (difficulty: Difficulty) => void;
  onBack: () => void;
}

const accentByDifficulty: Record<Difficulty, string> = {
  easy: 'border-emerald-500/60 hover:border-emerald-400 hover:shadow-emerald-500/20',
  normal: 'border-cyan-500/60 hover:border-cyan-400 hover:shadow-cyan-500/20',
  hard: 'border-red-500/60 hover:border-red-400 hover:shadow-red-500/20',
};

const badgeByDifficulty: Record<Difficulty, string> = {
  easy: 'text-emerald-400',
  normal: 'text-cyan-400',
  hard: 'text-red-400',
};

export const DifficultySelect: React.FC<DifficultySelectProps> = ({ onSelect, onBack }) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-900 px-6">
      <h2 className="text-3xl font-bold text-white mb-2">Choose Your Difficulty</h2>
      <p className="text-slate-400 mb-8">This sets your starting cash and market volatility.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {DIFFICULTY_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`flex flex-col text-left bg-slate-800 rounded-xl border-2 p-6 transition-all hover:scale-[1.03] hover:shadow-xl ${accentByDifficulty[opt.id]}`}
          >
            <span className={`text-sm font-semibold uppercase tracking-wider ${badgeByDifficulty[opt.id]}`}>
              {opt.name}
            </span>
            <span className="text-2xl font-bold text-white mt-2">
              {formatCurrency(opt.startCash)}
            </span>
            <span className="text-xs text-slate-500 mt-1">starting cash</span>
            <span className="text-xs text-slate-400 mt-4 leading-relaxed flex-1">
              {opt.description}
            </span>
            <span className="text-xs text-slate-500 mt-4">
              Volatility ×{opt.volatilityMultiplier.toFixed(1)}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        className="mt-8 px-5 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
      >
        ← Back
      </button>
    </div>
  );
};
