// ============================================================
// MarginCalculator — Margin, liquidation, cross-margin health
// ============================================================

import type { Position } from '../../types/trading';
import {
  requiredMargin,
  maintenanceMargin,
  liquidationPrice,
  unrealizedPnl,
  crossMarginHealth,
  liquidatePositions,
  calculateAum,
  fundingFee,
  isLiquidated,
} from '../../utils/calculations';

export {
  requiredMargin,
  maintenanceMargin,
  liquidationPrice,
  unrealizedPnl,
  crossMarginHealth,
  liquidatePositions,
  calculateAum,
  fundingFee,
  isLiquidated,
};

export interface MarginSummary {
  totalMarginUsed: number;
  totalMaintenanceRequired: number;
  freeCash: number;
  equity: number;
  health: number;
  availableToTrade: number;
}

export class MarginCalculator {
  /**
   * Build a human-readable margin summary from player state.
   */
  summarize(
    cash: number,
    positions: readonly Position[],
    prices: Readonly<Record<string, number>>
  ): MarginSummary {
    const health = crossMarginHealth(cash, positions, prices);
    const aum = calculateAum(cash, positions, prices);
    const available = Math.max(0, aum - health.totalMaintenance);

    return {
      totalMarginUsed: health.totalMargin,
      totalMaintenanceRequired: health.totalMaintenance,
      freeCash: cash,
      equity: health.equity,
      health: health.health,
      availableToTrade: available,
    };
  }
}
