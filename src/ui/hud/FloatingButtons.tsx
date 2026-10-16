import React from 'react';
import { gameEvents, GameEvents } from '../../game/events';

interface FloatingButtonsProps {
  onOpenPortfolio?: () => void;
  onOpenNews?: () => void;
  onOpenSettings?: () => void;
}

export const FloatingButtons: React.FC<FloatingButtonsProps> = ({
  onOpenPortfolio,
  onOpenNews,
  onOpenSettings,
}) => {
  const buttons = [
    {
      label: 'Portfolio',
      icon: '💼',
      onClick: () => {
        gameEvents.emit(GameEvents.OPEN_PORTFOLIO);
        onOpenPortfolio?.();
      },
      color: 'bg-emerald-600 hover:bg-emerald-500',
    },
    {
      label: 'News',
      icon: '📰',
      onClick: () => {
        gameEvents.emit(GameEvents.OPEN_NEWS);
        onOpenNews?.();
      },
      color: 'bg-blue-600 hover:bg-blue-500',
    },
    {
      label: 'Settings',
      icon: '⚙️',
      onClick: () => {
        onOpenSettings?.();
      },
      color: 'bg-slate-600 hover:bg-slate-500',
    },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-40">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onClick={btn.onClick}
          className={`flex items-center gap-2 px-4 py-2 ${btn.color} rounded-full text-white shadow-lg transition-all hover:scale-105 active:scale-95`}
          title={btn.label}
        >
          <span className="text-lg">{btn.icon}</span>
          <span className="text-sm font-medium">{btn.label}</span>
        </button>
      ))}
    </div>
  );
};
