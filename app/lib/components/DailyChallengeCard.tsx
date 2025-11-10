/**
 * DailyChallengeCard Component
 *
 * Displays the daily challenge progress and reward.
 * Shows progress bar, goal, and claim button when complete.
 *
 * Challenge: "Play 3 games today to unlock 25% off your entire order"
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useDailyChallenge } from '../hooks/useDailyChallenge';
import { HORROR_COPY } from '../constants/horror-copy';

export function DailyChallengeCard() {
  const { progress, goal, isComplete, discountPercent, canClaim, claimDiscount } = useDailyChallenge();
  const [isClaiming, setIsClaiming] = useState(false);

  const progressPercent = (progress / goal) * 100;

  const handleClaim = () => {
    setIsClaiming(true);

    setTimeout(() => {
      const code = claimDiscount();
      if (code) {
        toast.success('Daily Challenge Complete! 🎉', {
          description: `Your discount code: ${code}\nCopied to clipboard! Use at checkout for 25% off.`,
          duration: 8000,
        });

        // Copy to clipboard
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(code).catch(console.error);
        }
      }
      setIsClaiming(false);
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-gradient-to-br from-ranch-purple/30 to-ranch-dark/50 border-2 border-ranch-purple rounded-xl p-6 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="Calendar">
            📅
          </span>
          <h3 className="text-xl font-bold text-ranch-cream">
            Daily Challenge
          </h3>
        </div>
        {isComplete && (
          <Badge variant="success" className="text-sm font-bold">
            ✅ COMPLETE
          </Badge>
        )}
      </div>

      {/* Challenge description */}
      <p className="text-ranch-lavender mb-4">
        Play <span className="font-bold text-ranch-lime">{goal} games</span> today to unlock{' '}
        <span className="font-bold text-ranch-pink">{discountPercent}% off</span> your entire order
      </p>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-ranch-cream font-semibold">
            Progress: {progress} / {goal} games
          </span>
          <span className="text-sm text-ranch-lime font-bold">
            {Math.round(progressPercent)}%
          </span>
        </div>

        {/* Progress bar track */}
        <div className="h-3 bg-ranch-dark/50 rounded-full overflow-hidden border border-ranch-purple/50">
          <motion.div
            className="h-full bg-gradient-to-r from-ranch-lime to-ranch-cyan"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Claim button or status */}
      {canClaim ? (
        <Button
          onClick={handleClaim}
          disabled={isClaiming}
          className="w-full h-12 text-lg bg-gradient-to-r from-ranch-lime to-ranch-cyan hover:from-ranch-lime/80 hover:to-ranch-cyan/80 text-ranch-dark font-bold"
          size="lg"
        >
          {isClaiming ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                className="inline-block w-5 h-5 border-3 border-ranch-dark/30 border-t-ranch-dark rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
              Claiming...
            </span>
          ) : (
            <>🎁 Claim Your 25% Discount Code</>
          )}
        </Button>
      ) : isComplete ? (
        <div className="text-center py-3 px-4 bg-ranch-lime/20 border border-ranch-lime rounded-lg">
          <p className="text-ranch-cream font-semibold">
            ✅ Discount claimed! Check your clipboard.
          </p>
          <p className="text-xs text-ranch-lavender mt-1">
            Challenge resets at midnight UTC
          </p>
        </div>
      ) : (
        <div className="text-center py-3 px-4 bg-ranch-dark/40 border border-ranch-purple/50 rounded-lg">
          <p className="text-ranch-lavender text-sm">
            Play {goal - progress} more {goal - progress === 1 ? 'game' : 'games'} to unlock the discount
          </p>
          <p className="text-xs text-ranch-lavender/60 mt-1">
            Games are on product pages - click any product to start
          </p>
        </div>
      )}

      {/* Reset timer */}
      <div className="mt-4 text-center">
        <p className="text-xs text-ranch-lavender/70">
          Challenge resets daily at midnight UTC
        </p>
      </div>
    </motion.div>
  );
}
