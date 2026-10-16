// ============================================================
// Seeded Random Number Generator — Crypto Tycoon
// ============================================================

/**
 * Linear Congruential Generator (LCG) — fast, deterministic,
 * good enough for game simulation. Seed with current game time
 * or a fixed value for reproducible tests.
 */
export class SeededRNG {
  private seed: number;
  private readonly a = 1664525;
  private readonly c = 1013904223;
  private readonly m = 2 ** 32;

  constructor(seed: number = Date.now()) {
    this.seed = seed >>> 0;
  }

  /** Advance the generator and return next integer in [0, 2^32). */
  nextInt(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed;
  }

  /** Float in [0, 1). */
  nextFloat(): number {
    return this.nextInt() / this.m;
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + this.nextFloat() * (max - min);
  }

  /** Integer in [min, max] inclusive. */
  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** Return true with probability p (0–1). */
  chance(p: number): boolean {
    return this.nextFloat() < p;
  }

  /** Pick a random element from an array. */
  pick<T>(arr: readonly T[]): T {
    return arr[this.rangeInt(0, arr.length - 1)];
  }

  /** Weighted random pick. Weights must be positive. */
  pickWeighted<T>(items: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.nextFloat() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  /** Gaussian via Box–Muller transform, mean 0, std dev 1. */
  normal(): number {
    let u = 0;
    let v = 0;
    // Avoid log(0)
    while (u === 0) u = this.nextFloat();
    while (v === 0) v = this.nextFloat();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /** Gaussian with specified mean and standard deviation. */
  normalDist(mean: number, stdDev: number): number {
    return mean + this.normal() * stdDev;
  }

  /** Reset to a new seed. */
  setSeed(seed: number): void {
    this.seed = seed >>> 0;
  }
}

/** Global instance for convenience (non-deterministic). */
export const rng = new SeededRNG();
