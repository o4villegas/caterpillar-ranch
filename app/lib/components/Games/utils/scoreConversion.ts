/**
 * Score to Discount Conversion Utility
 *
 * Implements the universal score-to-discount mapping for all games.
 * Specification from CLAUDE.md (Score-to-Discount Conversion - All Games):
 *
 * 60+ points → 15% off (perfect/near-perfect play)
 * 50-59 points → 12% off (excellent play)
 * 40-49 points → 9% off (very good play)
 * 30-39 points → 6% off (good play)
 * 20-29 points → 3% off (decent play)
 * 0-19 points  → 0% off (can retry)
 */

export interface DiscountResult {
  discountPercent: number;
  message: string;
  canRetry: boolean;
}

/**
 * Calculate discount percentage based on game score
 *
 * @param score - Final game score (0-60+)
 * @returns Discount percentage (0, 3, 6, 9, 12, or 15)
 */
export function calculateDiscount(score: number): number {
  if (score >= 60) return 15;
  if (score >= 50) return 12;
  if (score >= 40) return 9;
  if (score >= 30) return 6;
  if (score >= 20) return 3;
  return 0;
}

/**
 * Get discount result with message and retry eligibility
 *
 * @param score - Final game score
 * @returns DiscountResult object with percent, message, and retry flag
 */
export function getDiscountResult(score: number): DiscountResult {
  const discountPercent = calculateDiscount(score);

  // Horror-themed success messages
  const messages: Record<number, string> = {
    15: "The Ranch is VERY pleased! Maximum blessing earned! 🐛💚",
    12: "Excellent performance! The colony approves! 🌿",
    9: "Well done! The caterpillars nod in approval. 🐛",
    6: "A decent offering. The Ranch accepts. ✨",
    3: "The Ranch notices your effort... 👀",
    0: "The Ranch is... unimpressed. Try again? 🌙",
  };

  return {
    discountPercent,
    message: messages[discountPercent] || "Score recorded.",
    canRetry: discountPercent === 0, // Only allow retry if no discount earned
  };
}

/**
 * Format discount for display
 *
 * @param discountPercent - Discount percentage (0-15)
 * @returns Formatted string (e.g., "15% Off")
 */
export function formatDiscount(discountPercent: number): string {
  if (discountPercent === 0) return "No Discount";
  return `${discountPercent}% Off`;
}

/**
 * Calculate score thresholds for progress indicators
 * Useful for showing "X more points for next tier" messages
 *
 * @param currentScore - Current score during gameplay
 * @returns Object with next threshold and points needed
 */
export function getNextThreshold(currentScore: number): { threshold: number; pointsNeeded: number; discountPercent: number } | null {
  const thresholds = [
    { threshold: 60, discountPercent: 15 },
    { threshold: 50, discountPercent: 12 },
    { threshold: 40, discountPercent: 9 },
    { threshold: 30, discountPercent: 6 },
    { threshold: 20, discountPercent: 3 },
  ];

  for (const { threshold, discountPercent } of thresholds) {
    if (currentScore < threshold) {
      return {
        threshold,
        pointsNeeded: threshold - currentScore,
        discountPercent,
      };
    }
  }

  // Already at max
  return null;
}
