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
import { SaveLoadModal } from './ui/overlay/SaveLoadModal';
import { TitleScreen } from './ui/screens/TitleScreen';
import { DifficultySelect } from './ui/screens/DifficultySelect';
import { GameOverScreen } from './ui/screens/GameOverScreen';
import { useGameStore } from './store/gameStore';
import { useMarketStore } from './store/marketStore';
import { usePlayerStore } from './store/playerStore';
import { useTradingStore } from './store/tradingStore';
import { MarketSimulator } from './systems/market/MarketSimulator';
import { phaseManager } from './systems/progression/PhaseManager';
import { autoSave, loadFromSlot, captureSave } from './systems/save/SaveManager';
import { DIFFICULTY_VOLATILITY_MULTIPLIER } from './constants/difficulty';
import type { Difficulty, SaveData } from './types/game';

type Screen = 'title' | 'game' | 'gameover';
type ModalType = 'trading' | 'news' | 'portfolio' | null;

function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulatorRef = useRef<MarketSimulator | null>(null);
  const tickIntervalRef = useRef<number | null>(null);
  const prevDayRef = useRef(1);

  const [screen, setScreen] = useState<Screen>('title');
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [saveLoadMode, setSaveLoadMode] = useState<'save' | 'load' | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const speed = useGameStore((state) => state.speed);
  const isPaused = useGameStore((state) => state.isPaused);
  const tick = useGameStore((state) => state.tick);
  const day = useGameStore((state) => state.day);
  const hour = useGameStore((state) => state.hour);
  const cash = usePlayerStore((state) => state.cash);
  const updatePrice = useMarketStore((state) => state.updatePrice);

  // Initialize Phaser game (kept mounted for the app's lifetime)
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

  // Initialize the market simulator once on first mount
  useEffect(() => {
    if (simulatorRef.current) return;
    const sim = new MarketSimulator(Date.now());
    simulatorRef.current = sim;
    // Generate initial price history
    for (let i = 0; i < 50; i++) {
      sim.tick();
    }
    // Sync initial prices to store
    const state = sim.getState();
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

  // Pause the game whenever we are not on the game screen
  useEffect(() => {
    if (screen !== 'game') {
      useGameStore.getState().setPaused(true);
    }
  }, [screen]);

  // Market tick loop (only runs while playing)
  useEffect(() => {
    if (screen !== 'game' || isPaused || speed === 0) {
      if (tickIntervalRef.current) {
        window.clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      return;
    }

    const intervalMs = speed === 1 ? 1000 : speed === 2 ? 500 : 200;

    tickIntervalRef.current = window.setInterval(() => {
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
        window.clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [screen, isPaused, speed, tick, updatePrice]);

  // Auto-save whenever a new game day begins
  useEffect(() => {
    if (screen !== 'game') {
      prevDayRef.current = day;
      return;
    }
    if (day !== prevDayRef.current) {
      prevDayRef.current = day;
      autoSave();
    }
  }, [day, screen]);

  // Watch for bankruptcy → game over
  useEffect(() => {
    if (screen !== 'game') return;
    if (usePlayerStore.getState().isBankrupt()) {
      setScreen('gameover');
    }
  }, [cash, screen]);

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

  /** Rebuild the market simulator for a given difficulty and sync its coins. */
  const resetMarket = useCallback((difficulty: Difficulty) => {
    const sim = new MarketSimulator(Date.now(), DIFFICULTY_VOLATILITY_MULTIPLIER[difficulty]);
    for (let i = 0; i < 50; i++) sim.tick();
    simulatorRef.current = sim;
    useMarketStore.setState({
      coins: sim.getState().coins,
      activeEvents: [],
      activeNews: [],
      newsHistory: [],
      eventHistory: [],
      lastTick: Date.now(),
    });
  }, []);

  /** Adopt an already-restored market state into the live simulator. */
  const adoptMarketFromStore = useCallback((data: SaveData) => {
    const sim = new MarketSimulator(Date.now(), DIFFICULTY_VOLATILITY_MULTIPLIER[data.game.difficulty]);
    sim.load({
      coins: data.market.coins,
      activeEvents: data.market.activeEvents,
      activeNews: data.market.activeNews,
      newsHistory: data.market.newsHistory,
      eventHistory: data.market.eventHistory,
      lastTick: data.market.lastTick,
    });
    sim.setTime(data.game.day, data.game.hour);
    simulatorRef.current = sim;
  }, []);

  const startNewGame = useCallback(
    (difficulty: Difficulty) => {
      useGameStore.getState().reset(difficulty);
      usePlayerStore.getState().reset(difficulty);
      useTradingStore.getState().reset();
      phaseManager.reset();
      resetMarket(difficulty);

      prevDayRef.current = useGameStore.getState().day;
      setActiveModal(null);
      setShowDifficulty(false);
      setScreen('game');
    },
    [resetMarket]
  );

  /** Called after SaveLoadModal restores a slot into the stores. */
  const handleSaveLoaded = useCallback(() => {
    const data = captureSave();
    phaseManager.load({ currentPhase: data.game.phase });
    adoptMarketFromStore(data);

    prevDayRef.current = data.game.day;
    setActiveModal(null);
    setShowDifficulty(false);
    setScreen('game');
  }, [adoptMarketFromStore]);

  const handleLoadLastSave = useCallback(() => {
    // Prefer the auto-save slot; fall back to the picker when empty.
    if (loadFromSlot('auto')) {
      handleSaveLoaded();
    } else {
      setSaveLoadMode('load');
    }
  }, [handleSaveLoaded]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={containerRef} className="phaser-container" />

      {screen === 'game' && (
        <>
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
              onOpenSave={() => setSaveLoadMode('save')}
              onOpenLoad={() => setSaveLoadMode('load')}
              onOpenSettings={() => setShowSettings(true)}
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
        </>
      )}

      {screen === 'title' && !showDifficulty && (
        <TitleScreen
          onNewGame={() => setShowDifficulty(true)}
          onLoadGame={() => setSaveLoadMode('load')}
          onSettings={() => setShowSettings(true)}
        />
      )}

      {screen === 'title' && showDifficulty && (
        <DifficultySelect onSelect={startNewGame} onBack={() => setShowDifficulty(false)} />
      )}

      {screen === 'gameover' && (
        <GameOverScreen
          onLoadLastSave={handleLoadLastSave}
          onNewGame={() => {
            setShowDifficulty(true);
            setScreen('title');
          }}
        />
      )}

      <SaveLoadModal
        isOpen={saveLoadMode !== null}
        mode={saveLoadMode ?? 'load'}
        onClose={() => setSaveLoadMode(null)}
        onLoaded={handleSaveLoaded}
      />

      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Settings"
        size="sm"
      >
        <div className="text-sm text-slate-400 space-y-2">
          <p>Audio, graphics, and control settings are coming soon.</p>
          <p className="text-slate-500">
            Tip: use the speed buttons in the top-right to pause or fast-forward time.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default App;
