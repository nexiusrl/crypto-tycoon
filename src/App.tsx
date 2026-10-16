import { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './game/config';
import { gameEvents, GameEvents } from './game/events';
import { CashDisplay } from './ui/hud/CashDisplay';
import { TimeControl } from './ui/hud/TimeControl';
import { FloatingButtons } from './ui/hud/FloatingButtons';
import { Modal } from './ui/shared/Modal';
import { TradingDashboard } from './ui/overlay/TradingDashboard';
import { MarketNews } from './ui/overlay/MarketNews';
import { PortfolioView } from './ui/overlay/PortfolioView';
import { useGameStore } from './store/gameStore';
import { useMarketStore } from './store/marketStore';
import { MarketSimulator } from './systems/market/MarketSimulator';

type ModalType = 'trading' | 'news' | 'portfolio' | null;

function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulatorRef = useRef<MarketSimulator | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const speed = useGameStore((state) => state.speed);
  const isPaused = useGameStore((state) => state.isPaused);
  const tick = useGameStore((state) => state.tick);
  const day = useGameStore((state) => state.day);
  const hour = useGameStore((state) => state.hour);
  const updatePrice = useMarketStore((state) => state.updatePrice);

  // Initialize Phaser game
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      ...gameConfig,
      parent: containerRef.current,
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Initialize market simulator
  useEffect(() => {
    if (simulatorRef.current) return;
    simulatorRef.current = new MarketSimulator(Date.now());
    // Generate initial price history
    for (let i = 0; i < 50; i++) {
      simulatorRef.current.tick();
    }
    // Sync initial prices to store
    const state = simulatorRef.current.getState();
    for (const coin of state.coins) {
      updatePrice(coin.id, coin.currentPrice);
    }
  }, [updatePrice]);

  // Sync simulator time with game store
  useEffect(() => {
    if (simulatorRef.current) {
      simulatorRef.current.setTime(day, hour);
    }
  }, [day, hour]);

  // Market tick loop
  useEffect(() => {
    if (isPaused || speed === 0) {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      return;
    }

    const intervalMs = speed === 1 ? 1000 : speed === 2 ? 500 : 200;

    tickIntervalRef.current = setInterval(() => {
      // Advance game time by 10 minutes per tick
      tick(10);

      // Run market simulation every game hour (6 ticks = 1 hour)
      const state = useGameStore.getState();
      if (state.minute % 60 < 10 && simulatorRef.current) {
        const result = simulatorRef.current.tick();
        for (const coin of result.updatedCoins) {
          updatePrice(coin.id, coin.currentPrice);
        }
      }
    }, intervalMs);

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [isPaused, speed, tick, updatePrice]);

  // Listen to game events for modals
  useEffect(() => {
    const handleOpenTrading = () => setActiveModal('trading');
    const handleOpenNews = () => setActiveModal('news');
    const handleOpenPortfolio = () => setActiveModal('portfolio');
    const handleCloseModal = () => setActiveModal(null);

    gameEvents.on(GameEvents.OPEN_TRADING, handleOpenTrading);
    gameEvents.on(GameEvents.OPEN_NEWS, handleOpenNews);
    gameEvents.on(GameEvents.OPEN_PORTFOLIO, handleOpenPortfolio);
    gameEvents.on(GameEvents.CLOSE_MODAL, handleCloseModal);

    return () => {
      gameEvents.off(GameEvents.OPEN_TRADING, handleOpenTrading);
      gameEvents.off(GameEvents.OPEN_NEWS, handleOpenNews);
      gameEvents.off(GameEvents.OPEN_PORTFOLIO, handleOpenPortfolio);
      gameEvents.off(GameEvents.CLOSE_MODAL, handleCloseModal);
    };
  }, []);

  const closeModal = useCallback(() => setActiveModal(null), []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={containerRef} className="phaser-container" />

      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-30">
        <div className="pointer-events-auto">
          <CashDisplay />
        </div>
        <div className="pointer-events-auto">
          <TimeControl />
        </div>
      </div>

      {/* Floating buttons */}
      <div className="pointer-events-auto z-30">
        <FloatingButtons
          onOpenPortfolio={() => setActiveModal('portfolio')}
          onOpenNews={() => setActiveModal('news')}
        />
      </div>

      {/* Modals */}
      <Modal
        isOpen={activeModal === 'trading'}
        onClose={closeModal}
        title="Trading Dashboard"
        size="xl"
      >
        <TradingDashboard />
      </Modal>

      <Modal
        isOpen={activeModal === 'news'}
        onClose={closeModal}
        title="Market News"
        size="md"
      >
        <MarketNews />
      </Modal>

      <Modal
        isOpen={activeModal === 'portfolio'}
        onClose={closeModal}
        title="Portfolio"
        size="xl"
      >
        <PortfolioView />
      </Modal>
    </div>
  );
}

export default App;
