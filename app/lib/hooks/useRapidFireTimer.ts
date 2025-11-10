/**
 * useRapidFireTimer Hook
 *
 * Manages the 6-hour rapid-fire countdown timer for limited-time discounts.
 * Resets every 6 hours (00:00, 06:00, 12:00, 18:00 UTC).
 *
 * Returns:
 * - timeRemaining: milliseconds until next reset
 * - formatted: { hours, minutes, seconds } for display
 * - isActive: boolean indicating if timer is running
 */

import { useEffect, useState } from 'react';

interface RapidFireTimer {
  timeRemaining: number; // milliseconds
  formatted: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  isActive: boolean;
  nextResetTime: Date;
}

const CYCLE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

/**
 * Calculates the next reset time based on current UTC time.
 * Resets occur at: 00:00, 06:00, 12:00, 18:00 UTC
 */
function getNextResetTime(): Date {
  const now = new Date();
  const currentHour = now.getUTCHours();

  // Find next reset hour (0, 6, 12, or 18)
  let nextResetHour: number;
  if (currentHour < 6) {
    nextResetHour = 6;
  } else if (currentHour < 12) {
    nextResetHour = 12;
  } else if (currentHour < 18) {
    nextResetHour = 18;
  } else {
    nextResetHour = 0; // Next day at midnight
  }

  const nextReset = new Date(now);
  nextReset.setUTCHours(nextResetHour, 0, 0, 0);

  // If next reset is midnight and we're past 18:00, add a day
  if (nextResetHour === 0 && currentHour >= 18) {
    nextReset.setUTCDate(nextReset.getUTCDate() + 1);
  }

  return nextReset;
}

/**
 * Formats milliseconds into hours, minutes, seconds
 */
function formatTime(ms: number): { hours: number; minutes: number; seconds: number } {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds };
}

export function useRapidFireTimer(): RapidFireTimer {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [nextResetTime, setNextResetTime] = useState<Date>(getNextResetTime());

  useEffect(() => {
    // Calculate initial time remaining
    const updateTimeRemaining = () => {
      const now = new Date();
      const remaining = nextResetTime.getTime() - now.getTime();

      if (remaining <= 0) {
        // Timer expired, calculate next reset
        const newResetTime = getNextResetTime();
        setNextResetTime(newResetTime);
        setTimeRemaining(newResetTime.getTime() - now.getTime());
      } else {
        setTimeRemaining(remaining);
      }
    };

    // Initial calculation
    updateTimeRemaining();

    // Update every second
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [nextResetTime]);

  const formatted = formatTime(timeRemaining);
  const isActive = timeRemaining > 0;

  return {
    timeRemaining,
    formatted,
    isActive,
    nextResetTime,
  };
}
