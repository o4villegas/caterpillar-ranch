/**
 * Score to Discount Conversion Utility
 *
 * Implements the universal score-to-discount mapping for all games.
 * Specification from CLAUDE.md (Score-to-Discount Conversion - All Games):
 *
 * 45-50 points → 40% off
 * 35-44 points → 30% off
 * 20-34 points → 20% off
 * 10-19 points → 10% off
 * 0-9 points  → 0% off (can retry)
 */

export interface DiscountResult {
  discountPercent: number;
  message: string;
  canRetry: boolean;
}

/**
 * Calculate discount percentage based on game score
 *
 * @param score - Final game score (0-50+)
 * @returns Discount percentage (0, 10, 20, 30, or 40)
 */
export function calculateDiscount(score: number): number {
  if (score >= 45) return 40;
  if (score >= 35) return 30;
  if (score >= 20) return 20;
  if (score >= 10) return 10;
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
    40: "The Ranch is VERY pleased! Maximum blessing earned! 🐛💚",
    30: "Excellent performance! The colony approves! 🌿",
    20: "Well done! The caterpillars nod in approval. 🐛",
    10: "A decent offering. The Ranch accepts. ✨",
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
 * @param discountPercent - Discount percentage (0-40)
 * @returns Formatted string (e.g., "40% Off")
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
    { threshold: 45, discountPercent: 40 },
    { threshold: 35, discountPercent: 30 },
    { threshold: 20, discountPercent: 20 },
    { threshold: 10, discountPercent: 10 },
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
