import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { GameSpeed } from '../../types/game';

const speeds: { value: GameSpeed; label: string }[] = [
  { value: 0, label: '⏸' },
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 5, label: '5×' },
];

export const TimeControl: React.FC = () => {
  const day = useGameStore((state) => state.day);
  const hour = useGameStore((state) => state.hour);
  const minute = useGameStore((state) => state.minute);
  const speed = useGameStore((state) => state.speed);
  const isPaused = useGameStore((state) => state.isPaused);
  const setSpeed = useGameStore((state) => state.setSpeed);
  const togglePause = useGameStore((state) => state.togglePause);
  const isMarketOpen = useGameStore((state) => state.isMarketOpen);

  const [displayMinute, setDisplayMinute] = useState(minute);

  useEffect(() => {
    setDisplayMinute(minute);
  }, [minute]);

  const marketOpen = isMarketOpen();
  const timeString = `${hour.toString().padStart(2, '0')}:${displayMinute.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="px-4 py-2 bg-slate-800/90 backdrop-blur rounded-lg border border-slate-700 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-white font-bold text-lg">Day {day}</span>
            <span className="text-slate-300 text-sm font-mono">{timeString}</span>
          </div>
          <div
            className={`w-3 h-3 rounded-full ${marketOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}
            title={marketOpen ? 'Market Open' : 'Market Closed'}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/90 backdrop-blur rounded-lg border border-slate-700 shadow-lg">
        {speeds.map((s) => {
          const active = s.value === speed || (s.value === 0 && isPaused);
          return (
            <button
              key={s.value}
              onClick={() => {
                if (s.value === 0) {
                  togglePause();
                } else {
                  setSpeed(s.value);
                }
              }}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
