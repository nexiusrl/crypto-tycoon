import React from 'react';

interface TitleScreenProps {
  onNewGame: () => void;
  onLoadGame: () => void;
  onSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onNewGame,
  onLoadGame,
  onSettings,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center mb-12">
        <span className="text-6xl mb-4">🪙</span>
        <h1 className="text-6xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
          CRYPTO TYCOON
        </h1>
        <p className="text-slate-400 mt-4 text-lg">
          Trade, build, and conquer the web3 empire.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onNewGame}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-lg shadow-lg transition-all hover:scale-[1.02] active:scale-95"
        >
          New Game
        </button>
        <button
          onClick={onLoadGame}
          className="w-full py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 transition-colors"
        >
          Load Game
        </button>
        <button
          onClick={onSettings}
          className="w-full py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition-colors"
        >
          Settings
        </button>
      </div>

      <p className="absolute bottom-6 text-xs text-slate-600">v1.0 — MVP</p>
    </div>
  );
};
