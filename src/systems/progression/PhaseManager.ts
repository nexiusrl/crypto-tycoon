// ============================================================
// PhaseManager — 5-phase progression, thresholds, promotion
// ============================================================

/**
 * AUM thresholds (in integer cents) required to reach each phase.
 * Index 0 → Phase 1 ($0), index 4 → Phase 5 ($100,000,000).
 */
export const PHASE_AUM_THRESHOLDS: readonly number[] = [
  0, // Phase 1 — Solo Trader (start)
  100_000_00, // Phase 2 — $100,000
  1_000_000_00, // Phase 3 — $1,000,000
  10_000_000_00, // Phase 4 — $10,000,000
  100_000_000_00, // Phase 5 — $100,000,000
];

/** Consecutive game days AUM must stay above the threshold. */
export const SUSTAINED_DAYS_REQUIRED = 5;

/** One-time upgrade fee as a fraction of the target phase's threshold. */
export const UPGRADE_FEE_RATE = 0.1;

/** Highest reachable phase. */
export const MAX_PHASE = PHASE_AUM_THRESHOLDS.length;

export interface PhaseInfo {
  name: string;
  aumThreshold: number; // cents
  rentPerDay: number; // cents
  description: string;
}

export interface PhaseDefinition extends PhaseInfo {
  phase: number;
}

export interface PromotionResult {
  eligible: boolean;
  nextPhase: number;
  fee: number; // cents
  sustainedDays: number;
  daysRemaining: number;
}

const PHASE_NAMES: readonly string[] = [
  'Solo Trader',
  'Small Team',
  'Startup',
  'Crypto Fund',
  'Web3 Empire',
];

/** Daily office rent in cents for each phase (Phase 1 is WFH = $0). */
const PHASE_RENT_PER_DAY: readonly number[] = [
  0, // $0 (WFH)
  500_00, // $500
  2_000_00, // $2,000
  10_000_00, // $10,000
  50_000_00, // $50,000
];

const PHASE_DESCRIPTIONS: readonly string[] = [
  'Trading from your bedroom. One desk, one dream — no rent to worry about.',
  'Move into a coworking space and hire your first team members.',
  'A proper office with research, marketing, and a growing staff.',
  'A full trading floor. Launch memecoins and run influencer campaigns.',
  'Own the exchange, build the ecosystem, and rule web3.',
];

export const PHASE_DEFINITIONS: readonly PhaseDefinition[] = PHASE_NAMES.map(
  (name, i) => ({
    phase: i + 1,
    name,
    aumThreshold: PHASE_AUM_THRESHOLDS[i],
    rentPerDay: PHASE_RENT_PER_DAY[i],
    description: PHASE_DESCRIPTIONS[i],
  })
);

/** Clamp a phase number to the valid 1–MAX_PHASE range. */
function clampPhase(phase: number): number {
  return Math.max(1, Math.min(MAX_PHASE, Math.floor(phase)));
}

/** Look up static info for a phase (clamped to the valid 1–5 range). */
export function getPhaseInfo(phase: number): PhaseInfo {
  const def = PHASE_DEFINITIONS[clampPhase(phase) - 1];
  return {
    name: def.name,
    aumThreshold: def.aumThreshold,
    rentPerDay: def.rentPerDay,
    description: def.description,
  };
}

export interface PhaseManagerState {
  currentPhase: number;
  /** Game day the current above-threshold streak began, or null. */
  streakStartDay: number | null;
}

/**
 * Tracks the player's current phase and how many consecutive game days
 * their AUM has been sustained above the next phase's threshold.
 */
export class PhaseManager {
  private currentPhase: number;
  private streakStartDay: number | null = null;

  constructor(initialPhase = 1) {
    this.currentPhase = clampPhase(initialPhase);
  }

  /** The phase the player is currently in (1–5). */
  getCurrentPhase(): number {
    return this.currentPhase;
  }

  /** Static info for an arbitrary phase (clamped to 1–5). */
  getPhaseInfo(phase: number): PhaseInfo {
    return getPhaseInfo(phase);
  }

  /**
   * Evaluate promotion eligibility for the given AUM and game day.
   *
   * The next phase's AUM threshold must be sustained for
   * `SUSTAINED_DAYS_REQUIRED` consecutive game days; the streak resets
   * whenever AUM dips below it. Safe to call every tick — it is idempotent
   * within a single game day.
   */
  checkPromotion(aum: number, day: number): PromotionResult {
    if (this.currentPhase >= MAX_PHASE) {
      return {
        eligible: false,
        nextPhase: MAX_PHASE,
        fee: 0,
        sustainedDays: 0,
        daysRemaining: 0,
      };
    }

    const nextPhase = this.currentPhase + 1;
    const threshold = PHASE_AUM_THRESHOLDS[nextPhase - 1];
    const fee = Math.floor(threshold * UPGRADE_FEE_RATE);

    // Dropped below the threshold → lose the streak.
    if (aum < threshold) {
      this.streakStartDay = null;
      return {
        eligible: false,
        nextPhase,
        fee,
        sustainedDays: 0,
        daysRemaining: SUSTAINED_DAYS_REQUIRED,
      };
    }

    // Above threshold: start the streak on the first qualifying day and
    // count it inclusively (day N of a streak that began on day S = N − S + 1).
    if (this.streakStartDay === null) {
      this.streakStartDay = day;
    }
    const sustainedDays = Math.max(0, day - this.streakStartDay + 1);

    return {
      eligible: sustainedDays >= SUSTAINED_DAYS_REQUIRED,
      nextPhase,
      fee,
      sustainedDays,
      daysRemaining: Math.max(0, SUSTAINED_DAYS_REQUIRED - sustainedDays),
    };
  }

  /**
   * Advance to the next phase. Returns the new phase number.
   * Callers should verify eligibility (via `checkPromotion`) and pay the fee.
   */
  promote(): number {
    if (this.currentPhase < MAX_PHASE) {
      this.currentPhase += 1;
      this.streakStartDay = null;
    }
    return this.currentPhase;
  }

  /** Snapshot the mutable progression state (for saves). */
  getState(): PhaseManagerState {
    return {
      currentPhase: this.currentPhase,
      streakStartDay: this.streakStartDay,
    };
  }

  /** Restore progression state (from a save). */
  load(state: Partial<PhaseManagerState>): void {
    if (typeof state.currentPhase === 'number') {
      this.currentPhase = clampPhase(state.currentPhase);
    }
    this.streakStartDay = state.streakStartDay ?? null;
  }

  /** Reset to a fresh phase-1 progression. */
  reset(phase = 1): void {
    this.currentPhase = clampPhase(phase);
    this.streakStartDay = null;
  }
}

/** Shared singleton — mirrors the player's live progression. */
export const phaseManager = new PhaseManager();
