/**
 * DailyChallengeContext
 *
 * Provides daily challenge state and actions throughout the app.
 * Allows game completions to increment challenge progress.
 */

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useDailyChallenge } from '../hooks/useDailyChallenge';

interface DailyChallengeContextValue {
  progress: number;
  goal: number;
  isComplete: boolean;
  discountPercent: number;
  incrementProgress: () => void;
}

const DailyChallengeContext = createContext<DailyChallengeContextValue | null>(null);

export function DailyChallengeProvider({ children }: { children: ReactNode }) {
  const challenge = useDailyChallenge();

  return (
    <DailyChallengeContext.Provider value={challenge}>
      {children}
    </DailyChallengeContext.Provider>
  );
}

export function useDailyChallengeContext(): DailyChallengeContextValue {
  const context = useContext(DailyChallengeContext);
  if (!context) {
    throw new Error('useDailyChallengeContext must be used within DailyChallengeProvider');
  }
  return context;
}
