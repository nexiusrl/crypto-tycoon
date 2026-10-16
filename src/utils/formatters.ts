// ============================================================
// Formatters — Crypto Tycoon
// ============================================================

/**
 * Format an integer cent amount as a USD string.
 *   1234567 → "$12,345.67"
 *   -500    → "-$5.00"
 *   1       → "$0.01"
 */
export function formatCurrency(cents: number): string {
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const fraction = String(abs % 100).padStart(2, '0');
  const sign = cents < 0 ? '-' : '';
  const formatted = `${dollars.toLocaleString('en-US')}.${fraction}`;
  return `${sign}$${formatted}`;
}

/**
 * Compact currency for HUD / tight spaces.
 *   12_345_00 → "$12.3K"
 *   1_000_00_00 → "$1.0M"
 */
export function formatCurrencyCompact(cents: number): string {
  const dollars = cents / 100;
  const abs = Math.abs(dollars);
  const sign = dollars < 0 ? '-' : '';

  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}$${abs.toFixed(2)}`;
}

/**
 * Format a percentage change.
 *   0.153  → "+15.3%"
 *   -0.05  → "-5.0%"
 *   1.25   → "+125.0%"
 */
export function formatPercent(value: number, digits = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(digits)}%`;
}

/**
 * Format a plain percentage (no sign forced).
 *   0.05 → "5.0%"
 */
export function formatPercentPlain(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

/**
 * Format leverage as "10x".
 */
export function formatLeverage(leverage: number): string {
  return `${leverage}x`;
}

/**
 * Format game time as "D15 14:32".
 */
export function formatGameTime(day: number, hour: number, minute: number): string {
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return `D${day} ${h}:${m}`;
}

/**
 * Format a price in cents with appropriate precision.
 * BTC ($50,000) → "$50,000.00"
 * SHIB ($0.0001) → "$0.0001"
 */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1) {
    return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (dollars >= 0.01) {
    return `$${dollars.toFixed(4)}`;
  }
  return `$${dollars.toFixed(6)}`;
}

/**
 * Format a large number with K/M/B suffixes.
 */
export function formatNumberCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${abs.toFixed(0)}`;
}
