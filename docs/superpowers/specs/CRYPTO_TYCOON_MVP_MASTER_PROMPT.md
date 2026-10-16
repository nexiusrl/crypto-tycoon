# CRYPTO TYCOON — MVP MASTER PROMPT

> **Purpose:** Give this entire document to an AI (Claude, GPT-4, Gemini, etc.) to implement the Crypto Tycoon MVP.
> **Scope:** Phase 1 only — Solo Trader with full trading engine.
> **Tech Stack:** Phaser 3 + React + Zustand + Vite + Tailwind CSS + ApexCharts.
> **Visual Style:** 2D pixel art, 32×32 base tile, isometric-ish perspective.

---

## 1. PROJECT OVERVIEW

Build **Crypto Tycoon**, a browser-based desktop tycoon game where the player starts as a solo crypto trader working from home and trades their way to building a crypto empire.

**Core Loop:**
1. Market opens → prices tick in real-time
2. Player monitors charts, places trades (buy/sell, leverage, short)
3. Market events and news create opportunities/dangers
4. Player manages risk (stop-loss, position sizing)
5. Market closes → daily P&L calculated → auto-save
6. Reinvest profits → reach AUM milestones → unlock next phase

**MVP = Phase 1: Solo Trader ONLY.** No staff, no social media, no memecoin launch. Just trading, room, and progression to Phase 2 threshold.

---

## 2. TECH STACK (Non-negotiable)

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript | ^5.0 |
| Game Engine | Phaser 3 | ^3.70 |
| UI Framework | React | ^18.2 |
| State Management | Zustand | ^4.4 |
| Build Tool | Vite | ^5.0 |
| Styling | Tailwind CSS | ^3.4 |
| Charts | ApexCharts (react-apexcharts) | ^1.4 |
| Package Manager | npm / pnpm | — |

**Project Structure:**
```
crypto-tycoon/
├── public/assets/          # Game assets (sprites, tilemaps, audio)
├── src/
│   ├── main.tsx            # Entry point
│   ├── App.tsx             # Phaser canvas + React overlay
│   ├── game/               # Phaser code
│   │   ├── config.ts
│   │   ├── scenes/
│   │   │   ├── BootScene.ts
│   │   │   ├── PreloadScene.ts
│   │   │   └── OfficeScene.ts
│   │   ├── objects/
│   │   │   ├── Computer.ts
│   │   │   ├── Newspaper.ts
│   │   │   └── Room.ts
│   │   └── events.ts       # Event bus
│   ├── systems/            # Game logic
│   │   ├── market/
│   │   │   ├── MarketSimulator.ts
│   │   │   ├── PriceGenerator.ts
│   │   │   └── NewsGenerator.ts
│   │   └── trading/
│   │       ├── TradingEngine.ts
│   │       ├── Portfolio.ts
│   │       └── MarginCalculator.ts
│   ├── store/              # Zustand stores
│   │   ├── gameStore.ts
│   │   ├── marketStore.ts
│   │   ├── playerStore.ts
│   │   └── tradingStore.ts
│   ├── ui/                 # React components
│   │   ├── overlay/
│   │   │   ├── TradingDashboard.tsx
│   │   │   ├── MarketNews.tsx
│   │   │   └── PortfolioView.tsx
│   │   ├── hud/
│   │   │   ├── CashDisplay.tsx
│   │   │   ├── TimeControl.tsx
│   │   │   └── FloatingButtons.tsx
│   │   └── shared/
│   │       ├── Modal.tsx
│   │       └── Button.tsx
│   ├── types/
│   └── utils/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 3. CORE SYSTEMS (Implement ALL)

### 3.1 Market Simulator

**Coins (5 total):**
```typescript
interface Coin {
  id: string;
  symbol: string;
  name: string;
  basePrice: number;      // in cents
  volatility: number;     // 0.001 (BTC) to 0.05 (SHIB)
  drift: number;          // slight positive for BTC/ETH
  currentPrice: number;
  priceHistory: PricePoint[];
}

const COINS: Coin[] = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', basePrice: 5000000, volatility: 0.002, drift: 0.0001 },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', basePrice: 300000, volatility: 0.004, drift: 0.0002 },
  { id: 'sol', symbol: 'SOL', name: 'Solana', basePrice: 10000, volatility: 0.008, drift: 0 },
  { id: 'doge', symbol: 'DOGE', name: 'Dogecoin', basePrice: 10, volatility: 0.015, drift: 0 },
  { id: 'shib', symbol: 'SHIB', name: 'Shiba Inu', basePrice: 1, volatility: 0.03, drift: -0.0001 },
];
```

**Price Update Formula (every 1 real second = 1 game hour):**
```
newPrice = oldPrice * (1 + drift + volatility * randomNormal() + eventImpact)
```
- `randomNormal()`: Box-Muller transform, mean 0, std dev 1
- Store prices as integers (cents) to avoid floating point errors
- Keep max 1000 price points per coin (FIFO)

**News System:**
- 1-3 news items per game day
- Each news has: headline, target coin (or all), sentiment (-1 to 1), duration (hours)
- News affects price via `sentiment * volatility * 0.5`

**Market Events (random, with cooldowns):**
- Flash Crash: -20% to -40% in 5 minutes
- Bull Run: +30% to +60% in 1 hour
- Exchange Hack: -10% to -25% all coins
- ETF Approval: +15% to +30% BTC
- Rug Pull: one memecoin -90%

### 3.2 Trading Engine

**Order Types:**
```typescript
type OrderType = 'market' | 'limit' | 'stop-loss' | 'stop-limit';
type OrderSide = 'buy' | 'sell';
type PositionType = 'long' | 'short';

interface Order {
  id: string;
  coinId: string;
  type: OrderType;
  side: OrderSide;
  price?: number;        // limit price
  stopPrice?: number;    // trigger for stop orders
  size: number;          // base units
  leverage: number;      // 1-10
  status: 'pending' | 'filled' | 'cancelled';
  createdAt: number;
}

interface Position {
  id: string;
  coinId: string;
  type: PositionType;
  entryPrice: number;
  size: number;
  leverage: number;
  margin: number;        // collateral
  liquidationPrice: number;
  unrealizedPnl: number;
  stopLoss?: number;
  takeProfit?: number;
}
```

**Leverage & Margin:**
- Max leverage: 10x
- Margin required: `positionValue / leverage`
- Cross-margin: all positions share one margin pool
- Maintenance margin: 5% of position value
- Liquidation: when `totalMargin < totalMaintenanceMargin`, close largest losing position first, repeat until solvent or bankrupt

**Shorting:**
- Borrow coin, sell immediately
- Funding fee: 0.01% per game hour
- Liquidation: price rises to `entryPrice * (1 + 1/leverage)`

**Futures (simplified perpetual):**
- No expiry
- Funding rate: 0.01% per 8 game hours, paid by majority side

### 3.3 Game Loop & Time

```
06:00 MARKET OPEN
  - Load overnight news
  - Evaluate pending orders
  - Apply overnight funding fees
  - Auto-save

06:00-22:00 ACTIVE TRADING (16 game hours)
  - Price tick every second
  - News flash (random)
  - Event trigger (random chance)

22:00 MARKET CLOSE
  - Calculate daily P&L
  - Apply final funding fees
  - Update stats
  - Auto-save

22:00-06:00 MANAGEMENT
  - Review day summary
  - Player can click "Sleep" to skip
```

**Time controls:** Pause, 1x, 2x, 5x speed.

### 3.4 Progression (Phase 1)

**Start:**
- Cash: $10,000 (configurable: $1K/$10K/$100K)
- Phase: Solo Trader
- Room: Bedroom (work from home, $0 rent)

**Phase 2 unlock:**
- AUM ≥ $100,000
- Sustained for 5 consecutive days
- Pay upgrade fee: $10,000
- Unlock: hire staff, office rent begins

**AUM = cash + sum(all position mark values)**

**Difficulty settings:**
- Easy: $100K start, -20% volatility/events
- Normal: $10K start, baseline
- Hard: $1K start, +20% volatility/events

### 3.5 Save System

**Slots:**
- Auto-save: 1 slot, overwritten daily at market close
- Manual save: 2 slots, player-triggered anytime

**Save to localStorage:**
```typescript
interface SaveData {
  version: '1.0';
  player: { cash, phase, day, hour, difficulty };
  market: { coins, events, newsHistory };
  trading: { positions, orders, realizedPnl, stats };
  settings: { musicVolume, sfxVolume, chartType, speed };
}
```

---

## 4. UI REQUIREMENTS

### 4.1 Main Game Screen

**Layout:**
```
┌─────────────────────────────────────────┐
│ [💰 $12,450] [📈 AUM: $15.2K] [⏰ D15 14:32] │
├─────────────────────────────────────────┤
│                                         │
│         [PHASER CANVAS]                 │
│      (bedroom with interactive          │
│       computer and newspaper)           │
│                                         │
├─────────────────────────────────────────┤
│ [📊 Portfolio] [📰 News] [⚙ Settings]   │
└─────────────────────────────────────────┘
```

**Phaser canvas:** 800×600 minimum, responsive scale up.

### 4.2 Trading Dashboard (Modal)

Must contain:
- Coin selector tabs (BTC, ETH, SOL, DOGE, SHIB)
- Candlestick chart (ApexCharts, real-time update)
- Order panel: type (market/limit/stop), side (buy/sell), size, leverage slider (1-10x)
- Position display: current positions with P&L, close button
- Order history: filled orders
- Risk display: margin used, liquidation buffer

### 4.3 Market News Panel

- Scrollable list of news items
- Each item: timestamp, headline, coin affected, sentiment indicator
- Click to expand full text

### 4.4 HUD Elements

- **Cash display:** Top-left, updates in real-time
- **AUM display:** Next to cash
- **Time display:** Day number, hour:minute, with speed indicator
- **Speed controls:** Pause (⏸), Play (▶), 2x (⏩), 5x (⏩⏩) buttons

---

## 5. VISUAL REQUIREMENTS

### 5.1 Style
- 2D pixel art, 32×32 base tile
- Clean, readable, stylized (not realistic)
- Dark theme with crypto accents (cyan/green for up, red for down)

### 5.2 MVP Assets to Create

| Asset | Description | Size |
|-------|-------------|------|
| `room_bedroom_bg` | Bedroom background (bed, window, desk area) | 640×360 |
| `computer` | Desk computer, interactive | 64×64 |
| `newspaper` | Newspaper on floor/table, interactive | 32×32 |
| `bed` | Bed, decorative | 64×64 |
| `window` | Window with day/night tint | 64×64 |
| `player_avatar` | Player character, idle animation | 32×48, 4 frames |
| `ui_panel` | Modal background | 9-slice 32×32 |
| `ui_button` | Button sprite | 64×32 |
| `icon_btc` to `icon_shib` | Coin icons | 16×16 |
| `logo` | Game title logo | 256×128 |

### 5.3 Day/Night Cycle

Use Phaser tint + overlay (NO separate assets):
- Dawn (06-10): orange tint, alpha 0.2
- Day (10-16): no tint
- Sunset (16-20): gold tint, alpha 0.25
- Night (20-06): dark blue overlay, alpha 0.4

Tween between states over 3 seconds at boundaries.

### 5.4 Interactive Feedback
- Hover: tooltip with action description
- Click: subtle bounce animation, then open modal
- Invalid action: shake + red flash

---

## 6. CODE PATTERNS

### 6.1 Event Bridge (Phaser ↔ React)
```typescript
// src/game/events.ts
import Phaser from 'phaser';
export const gameEvents = new Phaser.Events.EventEmitter();

// Phaser: object clicked
gameEvents.emit('OPEN_TRADING', { coinId: 'btc' });

// React: listen
useEffect(() => {
  const handler = (data) => setTradingOpen(data);
  gameEvents.on('OPEN_TRADING', handler);
  return () => gameEvents.off('OPEN_TRADING', handler);
}, []);
```

### 6.2 Zustand Store Pattern
```typescript
// src/store/playerStore.ts
import { create } from 'zustand';

interface PlayerState {
  cash: number;
  aum: number;
  phase: number;
  day: number;
  hour: number;
  setCash: (cash: number) => void;
  // ...
}

export const usePlayerStore = create<PlayerState>((set) => ({
  cash: 10000,
  aum: 10000,
  phase: 1,
  day: 1,
  hour: 6,
  setCash: (cash) => set({ cash }),
  // ...
}));
```

### 6.3 Phaser Scene Structure
```typescript
// src/game/scenes/OfficeScene.ts
export class OfficeScene extends Phaser.Scene {
  private room!: Room;
  private computer!: Computer;
  private newspaper!: Newspaper;

  create() {
    this.room = new Room(this, 'bedroom');
    this.computer = new Computer(this, x, y);
    this.newspaper = new Newspaper(this, x, y);
    
    // Set up day/night cycle
    this.time.addEvent({ loop: true, callback: this.updateLighting });
  }

  updateLighting() {
    const hour = useGameStore.getState().hour;
    const tint = this.getTintForHour(hour);
    this.cameras.main.setTint(tint.color, tint.alpha);
  }
}
```

---

## 7. IMPLEMENTATION ORDER

Implement in this exact order. Do NOT skip ahead.

### Week 1: Foundation
1. [ ] Set up Vite + React + TypeScript project
2. [ ] Install and configure Phaser 3, Zustand, Tailwind, ApexCharts
3. [ ] Create project folder structure
4. [ ] Implement event bridge (Phaser ↔ React)
5. [ ] Create placeholder assets (colored rectangles acceptable)
6. [ ] Set up Phaser game instance in React component

### Week 2: Core Systems
7. [ ] Implement MarketSimulator with 5 coins
8. [ ] Implement PriceGenerator (random walk)
9. [ ] Implement NewsGenerator
10. [ ] Implement EventGenerator
11. [ ] Create game loop (time progression, day cycle)
12. [ ] Wire market sim to Zustand store

### Week 3: Trading Engine
13. [ ] Implement order types (market, limit, stop-loss, stop-limit)
14. [ ] Implement position tracking
15. [ ] Implement leverage and margin calculation
16. [ ] Implement cross-margin liquidation
17. [ ] Implement shorting with funding fees
18. [ ] Implement futures (simplified)
19. [ ] Create Portfolio P&L tracking

### Week 4: UI & Integration
20. [ ] Create TradingDashboard modal with ApexCharts
21. [ ] Create MarketNews panel
22. [ ] Create PortfolioView
23. [ ] Create HUD (cash, AUM, time, speed controls)
24. [ ] Wire Phaser interactive objects to React modals
25. [ ] Implement day/night cycle visual

### Week 5: Progression & Polish
26. [ ] Implement phase progression logic
27. [ ] Implement difficulty settings
28. [ ] Implement save/load system
29. [ ] Create title screen and game over screen
30. [ ] Add sound effects (optional, can defer)
31. [ ] Bug fixes and balance tuning

---

## 8. ACCEPTANCE CRITERIA

The MVP is complete when ALL of these are true:

- [ ] Player can start a new game with chosen difficulty
- [ ] Market simulates 5 coins with realistic price movement
- [ ] Player can place market, limit, and stop-loss orders
- [ ] Player can use leverage up to 10x
- [ ] Player can short coins
- [ ] Liquidation works correctly with cross-margin
- [ ] Daily P&L is calculated and displayed
- [ ] News and events affect prices visibly
- [ ] Trading dashboard shows real-time candlestick chart
- [ ] Portfolio tracks all positions and history
- [ ] Time progresses with pause/speed controls
- [ ] Day/night cycle changes room tint
- [ ] Interactive objects (computer, newspaper) open correct modals
- [ ] Game auto-saves daily
- [ ] Player can manual save/load
- [ ] AUM milestone ($100K) triggers Phase 2 unlock screen
- [ ] No console errors, no crashes after 1 hour of play

---

## 9. ASSET CREATION GUIDE (For AI or Artist)

### Color Palette (MVP)
```
Background:   #1a1a2e (dark blue-black)
Accent:       #00d4aa (crypto cyan)
Profit:       #00ff88 (green)
Loss:         #ff4444 (red)
Text:         #e0e0e0 (light gray)
Highlight:    #ffd700 (gold)
```

### Bedroom Layout (Phase 1 Room)
```
┌─────────────────────────────┐
│  [Window: 64×64, top-left]  │
│                             │
│    [Desk: 64×48, center]    │
│    [Computer: on desk]      │
│                             │
│  [Bed: 64×64, bottom-left]  │
│                             │
│  [Newspaper: 32×32, floor]  │
└─────────────────────────────┘
Canvas: 640×360 pixels
```

### Animation Frames
- **Player idle:** 4 frames, subtle breathing/bobbing, 32×48 each
- **Computer screen:** 2 frames, subtle glow pulse, 64×64 each
- **Newspaper:** static (no animation)

### File Naming
```
assets/
  room/
    bedroom_bg.png
    bedroom_tiles.png
  objects/
    computer.png          (sprite sheet: 2 frames)
    computer_hover.png
    newspaper.png
    bed.png
    window.png
  characters/
    player_idle.png       (sprite sheet: 4 frames)
  ui/
    panel_9slice.png
    button_normal.png
    button_hover.png
    button_pressed.png
    icons/
      btc.png
      eth.png
      sol.png
      doge.png
      shib.png
  logo.png
```

---

## 10. COMMON PITFALLS (Avoid These)

1. **DON'T** use floating point for money — always use integer cents
2. **DON'T** run price simulation in React render — use Phaser's update loop or setInterval in Zustand
3. **DON'T** store entire price history in React state — keep in Zustand, chart reads from store
4. **DON'T** forget to clean up event listeners — memory leaks crash long sessions
5. **DON'T** implement Phase 2+ features — strictly MVP scope
6. **DON'T** use real crypto APIs — all prices are simulated
7. **DON'T** forget to handle bankruptcy (cash < 0) — show game over screen
8. **DON'T** make chart re-render every tick — use ApexCharts `updateSeries` with append

---

## 11. EXAMPLE: MINIMAL TRADING ENGINE

Here's a minimal but complete trading engine to start from:

```typescript
// src/systems/trading/TradingEngine.ts
export class TradingEngine {
  private positions: Position[] = [];
  private orders: Order[] = [];
  private nextId = 1;

  placeOrder(order: Omit<Order, 'id' | 'status'>): Order {
    const newOrder: Order = {
      ...order,
      id: `order_${this.nextId++}`,
      status: 'pending',
    };

    if (order.type === 'market') {
      this.executeOrder(newOrder);
    } else {
      this.orders.push(newOrder);
    }

    return newOrder;
  }

  executeOrder(order: Order): void {
    const price = this.getCurrentPrice(order.coinId);
    const position = this.createPosition(order, price);
    this.positions.push(position);
    order.status = 'filled';
  }

  createPosition(order: Order, price: number): Position {
    const positionValue = order.size * price;
    const margin = positionValue / order.leverage;
    const liqPrice = order.side === 'buy'
      ? price * (1 - 1 / order.leverage + 0.05)  // long liquidation
      : price * (1 + 1 / order.leverage - 0.05); // short liquidation

    return {
      id: `pos_${this.nextId++}`,
      coinId: order.coinId,
      type: order.side === 'buy' ? 'long' : 'short',
      entryPrice: price,
      size: order.size,
      leverage: order.leverage,
      margin,
      liquidationPrice: liqPrice,
      unrealizedPnl: 0,
    };
  }

  updatePositions(currentPrices: Record<string, number>): void {
    for (const pos of this.positions) {
      const currentPrice = currentPrices[pos.coinId];
      const priceDiff = pos.type === 'long'
        ? currentPrice - pos.entryPrice
        : pos.entryPrice - currentPrice;
      pos.unrealizedPnl = priceDiff * pos.size;
    }
  }

  checkLiquidation(prices: Record<string, number>): string[] {
    const liquidated: string[] = [];
    // Cross-margin: check total margin vs total maintenance
    // Implementation omitted for brevity — implement full cross-margin logic
    return liquidated;
  }

  private getCurrentPrice(coinId: string): number {
    // Read from market store
    return useMarketStore.getState().coins.find(c => c.id === coinId)?.currentPrice || 0;
  }
}
```

---

**END OF MASTER PROMPT**

> **Instructions for AI receiving this prompt:**
> 1. Read the entire document before starting
> 2. Follow the implementation order in Section 7 exactly
> 3. Ask clarifying questions if any requirement is ambiguous
> 4. Provide weekly progress updates matching the Week milestones
> 5. Do NOT add features beyond MVP scope without explicit approval
