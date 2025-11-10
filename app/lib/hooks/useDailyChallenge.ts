/**
 * useDailyChallenge Hook
 *
 * Manages daily challenge tracking with midnight UTC reset.
 * Stores progress in localStorage and awards 25% discount on completion.
 *
 * Challenge: "Play 3 games today to unlock 25% off your entire order"
 *
 * Returns:
 * - progress: number of games completed (0-3)
 * - goal: target games to complete (always 3)
 * - isComplete: boolean if challenge is complete
 * - discountPercent: 25 if complete, 0 otherwise
 * - nextResetTime: Date of next midnight UTC reset
 * - incrementProgress: function to add a game completion
 * - canClaim: boolean if discount can be claimed
 * - claimDiscount: function to claim the 25% discount
 */

import { useEffect, useState } from 'react';

interface DailyChallenge {
  progress: number;
  goal: number;
  isComplete: boolean;
  discountPercent: number;
  nextResetTime: Date;
  canClaim: boolean;
  incrementProgress: () => void;
  claimDiscount: () => string | null; // Returns discount code
}

interface StoredChallenge {
  progress: number;
  lastResetDate: string; // ISO 8601 date string (YYYY-MM-DD)
  claimed: boolean;
  discountCode: string | null;
}

const CHALLENGE_GOAL = 3; // Play 3 games
const DISCOUNT_PERCENT = 25; // 25% off
const STORAGE_KEY = 'caterpillar-ranch-daily-challenge';

/**
 * Gets the current date in YYYY-MM-DD format (UTC)
 */
function getCurrentDateUTC(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // "2025-01-10"
}

/**
 * Gets the next midnight UTC reset time
 */
function getNextResetTime(): Date {
  const now = new Date();
  const nextReset = new Date(now);
  nextReset.setUTCHours(24, 0, 0, 0); // Next midnight UTC
  return nextReset;
}

/**
 * Generates a unique discount code for the daily challenge
 */
function generateDiscountCode(): string {
  const date = getCurrentDateUTC().replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DAILY-${date}-${random}`;
}

/**
 * Loads challenge data from localStorage, resets if new day
 */
function loadChallenge(): StoredChallenge {
  if (typeof window === 'undefined') {
    // SSR: return default
    return {
      progress: 0,
      lastResetDate: getCurrentDateUTC(),
      claimed: false,
      discountCode: null,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // No data, create new challenge
      const newChallenge: StoredChallenge = {
        progress: 0,
        lastResetDate: getCurrentDateUTC(),
        claimed: false,
        discountCode: null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newChallenge));
      return newChallenge;
    }

    const parsed: StoredChallenge = JSON.parse(stored);
    const currentDate = getCurrentDateUTC();

    // Check if we need to reset (new day)
    if (parsed.lastResetDate !== currentDate) {
      const resetChallenge: StoredChallenge = {
        progress: 0,
        lastResetDate: currentDate,
        claimed: false,
        discountCode: null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resetChallenge));
      return resetChallenge;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load daily challenge:', error);
    return {
      progress: 0,
      lastResetDate: getCurrentDateUTC(),
      claimed: false,
      discountCode: null,
    };
  }
}

/**
 * Saves challenge data to localStorage
 */
function saveChallenge(challenge: StoredChallenge): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(challenge));
  } catch (error) {
    console.error('Failed to save daily challenge:', error);
  }
}

export function useDailyChallenge(): DailyChallenge {
  const [challenge, setChallenge] = useState<StoredChallenge>(loadChallenge);
  const [nextResetTime, setNextResetTime] = useState<Date>(getNextResetTime());

  // Check for reset at midnight
  useEffect(() => {
    const checkReset = () => {
      const currentDate = getCurrentDateUTC();
      if (challenge.lastResetDate !== currentDate) {
        // New day, reset challenge
        const resetChallenge: StoredChallenge = {
          progress: 0,
          lastResetDate: currentDate,
          claimed: false,
          discountCode: null,
        };
        setChallenge(resetChallenge);
        saveChallenge(resetChallenge);
        setNextResetTime(getNextResetTime());
      }
    };

    // Check every minute for reset
    const interval = setInterval(checkReset, 60000);
    return () => clearInterval(interval);
  }, [challenge.lastResetDate]);

  const isComplete = challenge.progress >= CHALLENGE_GOAL;
  const canClaim = isComplete && !challenge.claimed;

  const incrementProgress = () => {
    if (challenge.progress >= CHALLENGE_GOAL) return; // Already complete

    const updated: StoredChallenge = {
      ...challenge,
      progress: challenge.progress + 1,
    };

    setChallenge(updated);
    saveChallenge(updated);
  };

  const claimDiscount = (): string | null => {
    if (!canClaim) return null;

    const discountCode = generateDiscountCode();
    const updated: StoredChallenge = {
      ...challenge,
      claimed: true,
      discountCode,
    };

    setChallenge(updated);
    saveChallenge(updated);

    return discountCode;
  };

  return {
    progress: challenge.progress,
    goal: CHALLENGE_GOAL,
    isComplete,
    discountPercent: isComplete ? DISCOUNT_PERCENT : 0,
    nextResetTime,
    canClaim,
    incrementProgress,
    claimDiscount,
  };
}
