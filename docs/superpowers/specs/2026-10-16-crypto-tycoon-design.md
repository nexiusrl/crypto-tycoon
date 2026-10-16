# Crypto Tycoon — Game Design Specification

**Version:** 1.0  
**Date:** 2026-10-16  
**Status:** Draft — pending review  
**Path:** Architectural (new project)

---

## 1. Executive Summary

Crypto Tycoon is a hybrid idle/active tycoon game played in a desktop web browser. The player starts as a solo crypto trader working from home and progresses through five linear phases to build a web3 empire. The core loop combines active manual trading during market events with idle automation setup, reinforced by visual office progression in an isometric interactive room.

**Target Platform:** Desktop browser (Chrome, Firefox, Edge, Safari)  
**Monetization:** Free-to-play, singleplayer, premium currency for convenience only (not P2W)  
**Tech Stack:** Phaser 3 + React + Zustand + Vite + Tailwind CSS

---

## 2. Core Vision

### 2.1 Elevator Pitch
"AdVenture Capitalist meets Papers, Please meets crypto Twitter. Build a trading empire from your bedroom to a skyscraper — trade, hire, shill, and launch memecoins."

### 2.2 Key Pillars
1. **Meaningful Progression:** Every phase unlocks new systems, not just bigger numbers.
2. **Player Agency:** Active traders can outperform idle setups; idle setups still progress.
3. **Visual Feedback:** Office room visibly grows and fills with staff/equipment.
4. **Risk/Reward:** Leverage and shorting offer big gains but real liquidation danger (cross-margin).

---

## 3. Game Architecture

### 3.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Phaser 3    │  │ React +     │  │ ApexCharts /        │  │
│  │ Isometric   │  │ Tailwind    │  │ Lightweight Charts  │  │
│  │ Office Room │  │ UI Overlay  │  │ (Candlestick)       │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘  │
│         └─────────────────┬─────────────────┘                │
│                           ▼                                  │
│              ┌─────────────────────────┐                     │
│              │    Event Bridge         │                     │
│              │    (Phaser ↔ React)     │                     │
│              └─────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     GAME LOGIC LAYER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Zustand     │  │ Market      │  │ Progression         │  │
│  │ Game Store  │  │ Simulator   │  │ System              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Trading     │  │ Staff       │  │ Event/News          │  │
│  │ Engine      │  │ System      │  │ Generator           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Save/Load   │  │ Achievement │  │ Premium Currency    │  │
│  │ Manager     │  │ Tracker     │  │ Economy             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Tech Stack Rationale

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Game Engine | **Phaser 3** | Mature, excellent isometric plugin support, robust input handling, active community |
| UI Framework | **React 18** | Declarative modals/dashboards, component reuse, large ecosystem |
| State Management | **Zustand** | Lightweight, no boilerplate, excellent React integration, supports non-React consumers |
| Styling | **Tailwind CSS** | Rapid development, consistent design system, small bundle with purge |
| Build Tool | **Vite** | Fast HMR, modern ES modules, simple config |
| Charts | **ApexCharts** | Built-in candlestick, real-time update API, customizable |
| Asset Creation | **Aseprite / LibreSprite** | 32×32 pixel art, frame-by-frame animation |

### 3.3 Phaser + React Integration

Communication uses a singleton event emitter (`Phaser.Events.EventEmitter`) bridged between canvas and DOM:

- **Phaser → React:** `gameEvents.emit('OPEN_TRADING', { coinId })` triggers React modal open
- **React → Phaser:** `gameEvents.emit('STAFF_HIRED', { staffId })` triggers Phaser sprite spawn

React renders as a transparent overlay with `pointer-events: none`, individual elements use `pointer-events: auto` when interactive.

---

## 4. Core Game Systems

### 4.1 Market Simulator

#### 4.1.1 Coins (MVP)

| Coin | Symbol | Base Price | Volatility | Drift | Description |
|------|--------|-----------|------------|-------|-------------|
| Bitcoin | BTC | $50,000 | Low | Slight positive | Stable, slow growth |
| Ethereum | ETH | $3,000 | Medium | Slight positive | Moderate risk/reward |
| Solana | SOL | $100 | High | Neutral | Volatile layer-1 |
| Dogecoin | DOGE | $0.10 | Very High | Neutral | Meme-driven pumps |
| Shiba Inu | SHIB | $0.00001 | Extreme | Slight negative | Lottery ticket |

#### 4.1.2 Price Model

Price updates every real-time second (= 1 game hour). Formula:

```
newPrice = oldPrice × (1 + drift + volatility × randomNormal() + sentimentImpact + eventImpact)
```

- `randomNormal()`: Box-Muller transform for Gaussian distribution
- Price history capped at 1,000 points per coin (FIFO)
- All prices stored as integers (cents) to avoid floating-point errors

#### 4.1.3 News System

News items generated from a weighted pool:

```typescript
interface NewsItem {
  id: string;
  headline: string;
  coinId?: string;        // null = market-wide
  sentiment: number;      // -1.0 to 1.0
  impactDuration: number; // game hours
  timestamp: number;
}
```

**News frequency:** 1-3 items per game day, weighted random. Categories:
- Regulatory (SEC, ETF, ban)
- Technology (upgrade, hack, partnership)
- Social (celebrity tweet, viral meme)
- Macroeconomic (Fed rates, inflation)

#### 4.1.4 Market Events

| Event | Frequency | Effect | Duration |
|-------|-----------|--------|----------|
| Flash Crash | ~1 per 5 days | -20% to -40% in 5 min | 1 hour |
| Bull Run | ~1 per 7 days | +30% to +60% in 1 hour | 3 hours |
| Exchange Hack | ~1 per 10 days | -10% to -25% market-wide | 6 hours |
| ETF Approval | ~1 per 15 days | +15% to +30% BTC | 12 hours |
| Rug Pull (meme only) | ~1 per 10 days | Target memecoin → -90% | Permanent |

Events have visible countdown timer and news banner.

### 4.2 Trading Engine

#### 4.2.1 Order Types

| Type | Execution | Use Case |
|------|-----------|----------|
| Market | Immediate at best price | Quick entry/exit |
| Limit | When price reaches target | Better fill, not guaranteed |
| Stop-Loss | Market order when price hits stop | Risk management |
| Stop-Limit | Limit order when price hits stop | Precise risk control |

#### 4.2.2 Shorting

- Borrow coin from "exchange" (abstracted, no lender UI in MVP)
- Pay funding fee: 0.01% per game hour
- Must close position to realize P&L
- Liquidation if price rises to `entryPrice × (1 + 1/leverage)`

#### 4.2.3 Leverage

- Range: 1x to 10x
- Margin requirement: `positionSize / leverage`
- Cross-margin: All positions share one margin pool
- Liquidation cascade: If total margin < required maintenance, largest losing position closed first, repeat until solvent or bankrupt

#### 4.2.4 Futures (Simplified Perpetual)

- No expiry, no delivery
- Funding rate: 0.01% per 8 game hours, paid by longs to shorts (or vice versa) based on premium
- Same margin and liquidation rules as spot margin

#### 4.2.5 Position & Order Data

```typescript
interface Position {
  id: string;
  coinId: string;
  type: 'long' | 'short';
  entryPrice: number;     // cents
  size: number;           // base units
  leverage: number;       // 1-10
  margin: number;         // cents, collateral allocated
  liquidationPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  stopLoss?: number;
  takeProfit?: number;
  openedAt: number;       // timestamp
}

interface Order {
  id: string;
  coinId: string;
  type: 'market' | 'limit' | 'stop-loss' | 'stop-limit';
  side: 'buy' | 'sell';
  price?: number;         // limit price
  stopPrice?: number;     // trigger price for stop orders
  size: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  createdAt: number;
  filledAt?: number;
}
```

#### 4.2.6 Risk Metrics

- **Portfolio Heat:** `totalMargin / totalEquity` × 100%, color-coded (green <30%, yellow 30-60%, red >60%)
- **Liquidation Buffer:** Distance to first liquidation in percentage
- **Daily Drawdown:** Max loss from daily high

### 4.3 Progression System

#### 4.3.1 Five Phases

| Phase | AUM Threshold | Rent/Day | Key Unlock | Room Visual |
|-------|--------------|----------|------------|-------------|
| 1. Solo Trader | $0 (start) | $0 (WFH) | Trading, news, basic chart | Small bedroom, 1 desk, 1 computer |
| 2. Small Team | $100,000 | $500 | Hire 2 staff, auto-trading, equipment | Coworking space, 3 desks |
| 3. Startup | $1,000,000 | $2,000 | 5 roles, research, marketing | Proper office, meeting room |
| 4. Crypto Fund | $10,000,000 | $10,000 | Memecoin launch, social media, influencer | Trading floor, multiple rooms |
| 5. Web3 Empire | $100,000,000 | $50,000 | Exchange, ecosystem token, prestige | Skyscraper tower |

**AUM = cash + sum(all position values at mark price)**

**Phase promotion requires:**
1. AUM ≥ threshold
2. Sustained for 5 consecutive game days (anti-luck)
3. Pay one-time upgrade fee (10% of threshold)

#### 4.3.2 Difficulty Settings

| Setting | Start Cash | Market Volatility | Event Frequency | Target Audience |
|---------|-----------|-------------------|-----------------|-----------------|
| Easy | $100,000 | -20% | -20% | Casual, learn systems |
| Normal | $10,000 | Baseline | Baseline | Standard experience |
| Hard | $1,000 | +20% | +20% | Challenge, min-maxers |
| Ironman | $10,000 | Baseline | Baseline | One life, no reload |

### 4.4 Interactive Office (Isometric)

#### 4.4.1 Room Layout per Phase

Phase 1 (Solo Trader) — Bedroom:
```
┌─────────────────────┐
│  [Window]           │
│                     │
│    [Desk+Computer]  │  ← Click → Trading
│         [Chair]     │
│                     │
│  [Bed]    [Koran]   │  ← Click → News
│                     │
└─────────────────────┘
```

Phase 2+ adds more desks, staff sprites, equipment. Layout defined in Tiled JSON tilemap.

#### 4.4.2 Interactive Objects

| Object | Phase | Click Action | Opens |
|--------|-------|--------------|-------|
| Computer/Desk | 1+ | Open trading dashboard | TradingDashboard modal |
| Newspaper/Tablet | 1+ | Open news feed | MarketNews panel |
| Empty Desk | 2+ | Hire staff (if slot available) | Recruitment modal |
| Staff NPC | 2+ | Staff management | StaffDetail modal |
| Whiteboard | 3+ | Strategy/planning | Strategy modal |
| Printer (fun) | 4+ | Social media shill | SocialMedia modal |
| Door | 2+ | Office upgrade info | Upgrade preview |

All objects have hover tooltip and subtle bounce animation when interactive.

#### 4.4.3 Camera & Zoom

Single isometric angle. Zoom levels:

| Zoom | View | Use Case | Trigger |
|------|------|----------|---------|
| **Default (1×)** | Full room visible | General navigation | Scroll down, press `-` |
| **Zoomed (2×)** | Half room, detail visible | Focus interaction | Scroll up, press `+` |

**Pan:** Click-drag to move camera (when zoomed). Bounds clamped to room edges.

**Transition:** Smooth zoom tween, 200ms ease-out.

#### 4.4.4 Day/Night Cycle

Game time maps to visual tint:

| Game Time | Tint Color | Alpha | Effect |
|-----------|-----------|-------|--------|
| 06:00–10:00 | `#FFA500` (orange) | 0.2 | Dawn warmth |
| 10:00–16:00 | `#FFFFFF` (none) | 0 | Full brightness |
| 16:00–20:00 | `#FF8800` (gold) | 0.25 | Sunset glow |
| 20:00–06:00 | `#000044` (dark blue) | 0.4 | Night, lamp glow visible |

**Implementation:** Phaser `setTint()` on all sprites + semi-transparent overlay rectangle. Transition: tween alpha over 3 seconds at boundary.

#### 4.4.5 Floating UI Buttons (Always Available)

Positioned at screen edges, `pointer-events: auto`:
- **Top-left:** Cash display, AUM, phase indicator
- **Top-right:** Game speed (pause, 1x, 2x, 5x), settings
- **Bottom-left:** Trading shortcut, Portfolio shortcut
- **Bottom-right:** News feed, Achievements, Save/Load

### 4.5 Game Loop (Daily Cycle)

```
06:00 MARKET OPEN
  ├── Load overnight news
  ├── Evaluate pending limit/stop orders
  ├── Apply overnight funding fees
  └── Save auto-save

06:00–22:00 ACTIVE TRADING (16 game hours = 16 real seconds at 1x)
  ├── Price tick every second
  ├── News flash (random, 1-3/day)
  ├── Event trigger (random chance)
  └── Player: manual trade, monitor, react

22:00 MARKET CLOSE
  ├── Calculate daily P&L
  ├── Apply final funding fees
  ├── Update achievements
  └── Auto-save

22:00–06:00 MANAGEMENT PHASE
  ├── Review day summary
  ├── Hire/train staff (F2+)
  ├── Upgrade office/equipment
  ├── Plan strategy (set auto-trade rules)
  └── Player: click "Sleep" to skip to next day
```

**Time control:** Pause, 1x, 2x, 5x. Management phase can be instant-skipped.

### 4.6 Economy & Balance

#### 4.6.1 Income Sources

| Source | Phase | Rate | Notes |
|--------|-------|------|-------|
| Manual trading | 1+ | Variable | Player skill dependent |
| Auto-trading (staff) | 2+ | Variable | Staff skill dependent |
| Memecoin launch | 4+ | High risk | Pump then dump mechanics |
| Exchange fees (passive) | 5+ | Low, steady | From other traders (simulated) |

#### 4.6.2 Expense Sources

| Source | Phase | Rate | Notes |
|--------|-------|------|-------|
| Office rent | 2+ | See phase table | Must pay daily or evicted (game over) |
| Staff salary | 2+ | Per staff, daily | Fire to reduce, morale drops |
| Equipment | 2+ | One-time or lease | Better equipment = better auto-trade |
| Funding fees | 1+ | 0.01%/hour | Leveraged positions, shorts |
| Liquidation loss | 1+ | -100% position | Cross-margin cascade possible |
| Upgrade fee | All | 10% of threshold | One-time per phase |

#### 4.6.3 Win/Lose Conditions

**Win condition:** Reach phase 5 and sustain for 10 days → "You built a web3 empire" ending, unlock prestige.

**Lose condition:** Cash + liquidatable assets < 0 (bankrupt).
- Normal mode: Reload from last daily auto-save
- Ironman mode: Permadeath, leaderboard entry with final stats

### 4.7 Premium Currency (Free-to-Play)

| Currency | Earned By | Spent On | Notes |
|----------|-----------|----------|-------|
| **Cash ($)** | Trading | All in-game expenses | Core loop |
| **Crypto Credits (CC)** | Achievements, daily login, milestones | Speed up research, instant upgrade, cosmetic skins, extra save slot | Never required for progression |
| **Reputation** | Milestones, phase ups | Prestige shop (NG+) | Permanent unlocks across runs |

**CC purchase bundles (optional):** Purely convenience. Examples:
- 100 CC: $0.99
- 550 CC: $4.99
- 1,200 CC: $9.99

No ads in MVP. Ad reward (watch for CC) deferred to post-launch.

---

## 5. User Interface Design

### 5.1 Screen Flow

```
[Title Screen]
    ├── New Game → [Difficulty Select] → [Phase 1 Office]
    ├── Load Game → [Save Slot Select] → [Phase N Office]
    └── Settings → [Audio, Graphics, Controls]

[Phase N Office] (main game screen)
    ├── Click Computer → [Trading Dashboard]
    ├── Click Newspaper → [Market News]
    ├── Click Staff/Desk → [Staff Management] (F2+)
    ├── Click Door → [Office Upgrade] (if eligible)
    ├── Floating Button: Portfolio → [Portfolio View]
    ├── Floating Button: Achievements → [Achievement List]
    └── Floating Button: Settings → [Settings Modal]
```

### 5.2 Trading Dashboard Modal

Layout (desktop, 1024×768 minimum):
```
┌─────────────────────────────────────────────────────────────┐
│  [Coin Selector: BTC | ETH | SOL | DOGE | SHIB]    [X]     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │                         │  │ ORDER PANEL             │  │
│  │    CANDLESTICK CHART    │  │ ─────────────────────── │  │
│  │    (ApexCharts)         │  │ Type: [Market ▼]        │  │
│  │                         │  │ Side: [Buy] [Sell]      │  │
│  │  [Timeframe: 1H 4H 1D]  │  │ Size: [____] [Max]      │  │
│  │                         │  │ Leverage: [1x ▼]        │  │
│  │                         │  │ [Set Stop-Loss]         │  │
│  │                         │  │ [Set Take-Profit]       │  │
│  │                         │  │                         │  │
│  │                         │  │ Est. Margin: $___       │  │
│  │                         │  │ Liq. Price: $___        │  │
│  │                         │  │                         │  │
│  │                         │  │ [PLACE ORDER]           │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  OPEN POSITIONS                    │  ORDER HISTORY        │
│  [Coin] [Side] [Size] [Entry] [P&L]│  [Time] [Type] [Fill] │
│  [Close] [Add Margin]              │                       │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 HUD Overlay (Always Visible)

```
┌─────────────────────────────────────────────────────────────┐
│  💰 $124,500  |  📈 AUM: $156K  |  🏢 Phase: Solo Trader   │
│  ⏰ Day 15, 14:32  |  [⏸] [▶] [⏩] [⏩⏩]                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      [PHASER CANVAS]                        │
│                  (isometric office room)                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [📊 Portfolio]  [📰 News]  [🏆 Achievements]  [⚙ Settings] │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Save System

### 6.1 Save Slots

| Slot | Type | Count | Notes |
|------|------|-------|-------|
| Auto-save | Automatic | 1 | Overwritten daily at market close |
| Manual | Player | 2 | Anytime, overwrite confirmation |
| Cloud | Player (F2+) | 1 | Firebase, cross-device |

### 6.2 Save Data Schema

```typescript
interface SaveData {
  version: '1.0';
  createdAt: number;
  updatedAt: number;
  
  meta: {
    playTime: number;       // seconds
    sessionCount: number;
    lastSessionEnd?: number;
  };
  
  player: {
    cash: number;
    cryptoCredits: number;
    reputation: number;
    phase: Phase;
    difficulty: Difficulty;
    day: number;
    hour: number;
    isPaused: boolean;
    speed: number;
  };
  
  market: {
    coins: Coin[];
    activeEvents: MarketEvent[];
    newsQueue: NewsItem[];
    newsHistory: NewsItem[];
  };
  
  trading: {
    positions: Position[];
    pendingOrders: Order[];
    orderHistory: Order[];
    realizedPnl: number;
    maxDrawdown: number;
    bestTrade: number;
    worstTrade: number;
  };
  
  office: {
    phaseLevel: number;
    furniture: Furniture[];
    equipment: Equipment[];
    staff: Staff[];          // empty for F1
  };
  
  progression: {
    achievements: string[];
    unlocks: string[];
    stats: GameStats;
  };
  
  settings: {
    musicVolume: number;
    sfxVolume: number;
    chartType: 'candlestick' | 'line';
    notifications: boolean;
  };
}
```

### 6.3 Save Migration

On load, check `version`. If older than current:
1. Run migration function per version step
2. Add `migratedFrom: string` to meta
3. Save back in new format

Migration functions tested with unit tests.

---

## 7. Asset Requirements (MVP)

### 7.1 Visual Assets (2D Pixel Art, 32×32)

**Style:** Clean stylized pixel art, readable at small scale, consistent 32×32 base tile.

| Asset | Format | Size | Count | Tool |
|-------|--------|------|-------|------|
| Room tileset | PNG sprite sheet | 32×32 per tile | 5 phases × ~40 tiles | Aseprite / LibreSprite |
| Room background (per phase) | PNG | 640×360 | 5 phases | Aseprite |
| Furniture | PNG sprite sheet | 32×32 to 64×64 | ~20 objects | Aseprite |
| Character (player + staff) | PNG sprite sheet | 32×48 per frame | 5 roles × 4 animations × 4 frames | Aseprite |
| Character portraits | PNG | 64×64 | 5 roles | Aseprite |
| UI icons | PNG | 16×16 to 32×32 | ~30 | Aseprite |
| Logo/title | PNG | 256×128 | 1 | Aseprite / Figma |

### 7.2 Audio Assets (Deferred to F2)

| Asset | Format | Count | Notes |
|-------|--------|-------|-------|
| BGM (menu) | OGG | 1 | Lo-fi, chill |
| BGM (trading) | OGG | 1 | Tense, ambient |
| SFX (buy) | WAV/OGG | 1 | Cash register |
| SFX (sell) | WAV/OGG | 1 | Whoosh |
| SFX (liquidation) | WAV/OGG | 1 | Alarm, dramatic |
| SFX (news) | WAV/OGG | 1 | Notification ping |
| SFX (level up) | WAV/OGG | 1 | Achievement chime |

> ¹ Aseprite alternatives: LibreSprite (free, open-source), Pixel Studio (browser-based), or GraphicsGale (Windows).

### 7.3 Asset Pipeline

**Aseprite → Sprite Sheet → Runtime:**

1. **Draw in Aseprite / LibreSprite:** 32×32 base, consistent palette per phase
2. **Animate frame-by-frame:** 4-6 frames per animation (idle, work, excited, stressed)
3. **Organize layers:** Separate character parts for reuse (head, body, arms)
4. **Export sprite sheets:** Use Aseprite export with JSON metadata
5. **Naming convention:** `category_name_variant_frame.ext`
   - Room: `room_phase{N}_bg.png`, `room_phase{N}_tiles.png`
   - Furniture: `furniture_{name}.png`
   - Character: `char_{role}_{anim}.png` (sprite sheet)
6. Phaser `BootScene` loads via asset manifest JSON
7. Unused assets excluded from build (Vite handles)

**Day/night implementation:** Phaser color tint overlay (`setTint()`) + alpha-blended night overlay sprite. No separate asset variants needed.

---

## 8. Project Structure

```
crypto-tycoon/
├── public/
│   ├── assets/
│   │   ├── tilesets/           # Tiled tilesets
│   │   ├── sprites/            # Character, furniture, objects
│   │   ├── ui/                 # Icons, buttons, frames
│   │   ├── audio/              # BGM, SFX (F2+)
│   │   └── manifest.json       # Asset loading manifest
│   └── index.html
├── src/
│   ├── main.tsx                # Entry point, React root
│   ├── App.tsx                 # Phaser canvas + React overlay
│   ├── game/                   # Phaser-specific code
│   │   ├── config.ts           # Phaser game config
│   │   ├── scenes/
│   │   │   ├── BootScene.ts    # Asset loading, manifest parse
│   │   │   ├── PreloadScene.ts # Loading bar
│   │   │   └── OfficeScene.ts  # Main isometric room
│   │   ├── objects/
│   │   │   ├── Room.ts         # Tilemap manager, upgrade logic
│   │   │   ├── Computer.ts     # Interactive: open trading
│   │   │   ├── Newspaper.ts    # Interactive: open news
│   │   │   ├── Desk.ts         # Interactive: staff slot
│   │   │   ├── Door.ts         # Interactive: upgrade info
│   │   │   └── PlayerChar.ts   # Player avatar sprite
│   │   ├── isometric/          # Isometric math, grid utils
│   │   └── events.ts           # Game event bus
│   ├── systems/                # Pure logic, framework-agnostic
│   │   ├── market/
│   │   │   ├── MarketSimulator.ts
│   │   │   ├── PriceGenerator.ts
│   │   │   ├── NewsGenerator.ts
│   │   │   └── EventGenerator.ts
│   │   ├── trading/
│   │   │   ├── TradingEngine.ts
│   │   │   ├── OrderExecutor.ts
│   │   │   ├── Portfolio.ts
│   │   │   ├── MarginCalculator.ts
│   │   │   └── LiquidationHandler.ts
│   │   └── progression/
│   │       ├── PhaseManager.ts
│   │       ├── AchievementTracker.ts
│   │       └── UnlockRegistry.ts
│   ├── store/                  # Zustand stores
│   │   ├── gameStore.ts        # Core state, time control
│   │   ├── marketStore.ts      # Prices, history, events
│   │   ├── playerStore.ts      # Cash, AUM, phase, stats
│   │   ├── tradingStore.ts     # Positions, orders, P&L
│   │   └── uiStore.ts          # Modal states, notifications
│   ├── ui/                     # React components
│   │   ├── overlay/
│   │   │   ├── TradingDashboard.tsx
│   │   │   ├── MarketNews.tsx
│   │   │   ├── PortfolioView.tsx
│   │   │   ├── StaffManagement.tsx
│   │   │   ├── OfficeUpgrade.tsx
│   │   │   ├── AchievementList.tsx
│   │   │   ├── SettingsModal.tsx
│   │   │   └── SaveLoadModal.tsx
│   │   ├── hud/
│   │   │   ├── CashDisplay.tsx
│   │   │   ├── AUMDisplay.tsx
│   │   │   ├── PhaseIndicator.tsx
│   │   │   ├── TimeControl.tsx
│   │   │   ├── SpeedButtons.tsx
│   │   │   └── FloatingButtons.tsx
│   │   ├── shared/
│   │   │   ├── Modal.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── CoinIcon.tsx
│   │   │   ├── PriceChange.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── Tooltip.tsx
│   │   └── screens/
│   │       ├── TitleScreen.tsx
│   │       ├── DifficultySelect.tsx
│   │       └── GameOverScreen.tsx
│   ├── types/                  # TypeScript interfaces
│   │   ├── game.ts
│   │   ├── market.ts
│   │   ├── trading.ts
│   │   ├── office.ts
│   │   └── save.ts
│   ├── utils/                  # Helpers
│   │   ├── formatters.ts       # Currency, percentage
│   │   ├── calculations.ts     # P&L, margin math
│   │   ├── random.ts           # Seeded RNG
│   │   └── storage.ts          # localStorage wrapper
│   └── constants/              # Game balance values
│       ├── coins.ts
│       ├── phases.ts
│       ├── events.ts
│       └── economy.ts
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-10-16-crypto-tycoon-design.md
├── tests/
│   ├── unit/
│   │   ├── market/
│   │   ├── trading/
│   │   └── progression/
│   └── integration/
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 9. Testing Strategy

### 9.1 Unit Tests (Vitest)

| Module | Coverage Target | Key Tests |
|--------|-----------------|-----------|
| PriceGenerator | 100% | Random walk properties, no negative prices, volatility bounds |
| TradingEngine | 100% | Order execution, margin calc, liquidation trigger, cross-margin cascade |
| Portfolio | 100% | P&L accuracy, history tracking, stats |
| PhaseManager | 100% | Threshold checks, sustain requirement, upgrade fee |
| Save/Load | 100% | Round-trip integrity, migration paths |

### 9.2 Integration Tests

| Flow | Test |
|------|------|
| Full day cycle | Market open → tick → event → trade → close → save |
| Liquidation cascade | Multiple positions, one triggers, check order of closure |
| Phase promotion | Reach threshold, sustain, pay fee, verify unlocks |
| Save migration | Load v0.9 save, verify v1.0 structure |

### 9.3 Manual QA Checklist

- [ ] All interactive objects clickable and open correct modal
- [ ] Chart updates in real-time without lag (1 hour = 1 second)
- [ ] Time speed changes apply instantly
- [ ] Pause stops all simulation, resume continues correctly
- [ ] Liquidation shows dramatic feedback (screen shake, red flash, SFX)
- [ ] Office upgrade changes room visual immediately

---

## 10. Deferred Features (Post-MVP)

| Feature | Target Phase | Notes |
|---------|-------------|-------|
| Staff system (hire, train, assign) | Phase 2 | Full AI behavior, skill trees |
| Social media / X simulator | Phase 3 | Tweet drafting, follower growth, credibility |
| Memecoin launcher | Phase 4 | Tokenomics design, liquidity, marketing campaign |
| Audio (BGM, SFX) | Phase 2 | Ambient trading music, event sounds |
| Cloud save | Phase 2 | Firebase Auth + Firestore |
| Leaderboard | Phase 2 | Async, weekly reset, anti-cheat (server-validated) |
| Prestige / New Game+ | Phase 5 | Permanent bonuses, harder difficulty, exclusive skins |
| Mobile support | Post-launch | Touch controls, responsive layout |
| Multiplayer (async) | Post-launch | Market shared, compete on AUM |
| Mod support | Post-launch | Custom coins, events, scenarios |

---

## 11. Open Questions / Risks

| Risk | Mitigation |
|------|------------|
| Phaser + React integration complexity | Prototype event bridge in week 1; fallback to pure Phaser UI if problematic |
| Isometric art production bottleneck | Start with simple top-down 2D; upgrade to iso when artist available |
| Trading engine balance (too easy/hard) | Extensive playtesting with simulated runs; expose constants for tuning |
| Save file corruption | Checksum validation; backup auto-save; graceful error handling |
| Performance with many price points | Object pooling; chart decimation; worker thread for simulation |

---

## 12. Glossary

| Term | Definition |
|------|------------|
| AUM | Assets Under Management — total value of cash + positions |
| CC | Crypto Credits — premium currency |
| Cross-margin | Shared margin pool across all positions |
| Funding fee | Periodic cost for holding leveraged or short positions |
| Game hour | Unit of game time; 1 real second = 1 game hour at 1x speed |
| Liquidation | Forced closure of position when margin insufficient |
| Phase | Major progression milestone, unlocks new systems |
| WFH | Work From Home — phase 1, no rent |

---

*Document version 1.0 — Draft for review*
