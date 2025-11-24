/**
 * Score to Discount Conversion Utility
 *
 * Theme: "The Chrysalis" — Earned Transcendence
 *
 * Difficulty tuned for:
 * - 15%: Top ~15-20% of players (very skilled, 2-3 errors max)
 * - 12%: Top ~25-30% (skilled play)
 * - 9%: Top ~40% (good play)
 * - 6%: Top ~55% (decent play)
 * - 3%: Top ~70% (minimal effort)
 * - 0%: Bottom ~30% (retry encouraged)
 *
 * Score thresholds:
 * 60+ points → 15% off (near-perfect play)
 * 50-59 points → 12% off (excellent play)
 * 40-49 points → 9% off (very good play)
 * 30-39 points → 6% off (good play)
 * 20-29 points → 3% off (decent play)
 * 0-19 points  → 0% off (can retry)
 */

export interface DiscountResult {
  discountPercent: number;
  message: string;
  subtext: string;
  emoji: string;
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
 * Get discount result with thematic message and retry eligibility
 *
 * Messages follow "Earned Transcendence" tone:
 * - Success = you guided them through, triumphant but solemn
 * - Failure = they trusted you, you weren't ready (encourages retry)
 *
 * @param score - Final game score
 * @returns DiscountResult object with percent, message, subtext, emoji, and retry flag
 */
export function getDiscountResult(score: number): DiscountResult {
  const discountPercent = calculateDiscount(score);

  const results: Record<number, Omit<DiscountResult, 'discountPercent' | 'canRetry'>> = {
    15: {
      message: 'Perfect care. They emerged exactly as they dreamed.',
      subtext: 'You guided them through dissolution, terror, and remaking. They fly now. Because of you.',
      emoji: '🦋',
    },
    12: {
      message: 'Strong guidance. They will fly.',
      subtext: 'The transformation was nearly perfect. Their wings catch the light.',
      emoji: '✨',
    },
    9: {
      message: 'They emerged. Some scars, but whole.',
      subtext: 'The chrysalis was dark, but they made it through.',
      emoji: '🌙',
    },
    6: {
      message: 'The transformation was incomplete.',
      subtext: 'They fly, but they remember the pain more than the beauty.',
      emoji: '🕯️',
    },
    3: {
      message: 'They emerged. Something is wrong with their wings.',
      subtext: 'They try to fly. They cannot. But they are alive.',
      emoji: '👁️',
    },
    0: {
      message: 'The chrysalis failed.',
      subtext: 'They trusted you to guide them through the dark. You were not ready.',
      emoji: '💀',
    },
  };

  const result = results[discountPercent];

  return {
    discountPercent,
    message: result.message,
    subtext: result.subtext,
    emoji: result.emoji,
    canRetry: discountPercent === 0,
  };
}

/**
 * Format discount for display
 *
 * @param discountPercent - Discount percentage (0-15)
 * @returns Formatted string
 */
export function formatDiscount(discountPercent: number): string {
  if (discountPercent === 0) return 'No Trust Earned';
  return `${discountPercent}% Trust`;
}

/**
 * Calculate score thresholds for progress indicators
 * Useful for showing "X more points for next tier" messages
 *
 * @param currentScore - Current score during gameplay
 * @returns Object with next threshold and points needed, or null if at max
 */
export function getNextThreshold(
  currentScore: number
): { threshold: number; pointsNeeded: number; discountPercent: number } | null {
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

/**
 * Get progress text for mid-game display
 *
 * @param currentScore - Current score
 * @returns Thematic progress message
 */
export function getProgressMessage(currentScore: number): string {
  const next = getNextThreshold(currentScore);
  const current = calculateDiscount(currentScore);

  if (!next) {
    return 'Maximum trust. They will emerge perfect.';
  }

  if (current === 0 && currentScore < 10) {
    return 'They watch. They wait to trust you.';
  }

  if (current === 0) {
    return `${next.pointsNeeded} more to earn their trust`;
  }

  return `${next.pointsNeeded} more for ${next.discountPercent}% trust`;
}
