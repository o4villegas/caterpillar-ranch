/**
 * Game Score Component
 *
 * Displays current score with horror theming and progress indicators
 * - Shows current score with animation on updates
 * - Displays current discount level
 * - Shows progress toward next discount tier
 * - Uses horror color palette
 */

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils';
import { calculateDiscount, getNextThreshold } from './utils/scoreConversion';

interface GameScoreProps {
  score: number;
  showProgress?: boolean; // Show "X more for next tier" message
  className?: string;
}

export function GameScore({ score, showProgress = true, className }: GameScoreProps) {
  const currentDiscount = calculateDiscount(score);
  const nextThreshold = getNextThreshold(score);

  // Color based on current discount level
  const getScoreColor = () => {
    if (currentDiscount >= 40) return 'text-ranch-lime'; // Max discount
    if (currentDiscount >= 30) return 'text-ranch-cyan'; // Great
    if (currentDiscount >= 20) return 'text-yellow-400'; // Good
    if (currentDiscount >= 10) return 'text-ranch-lavender'; // Okay
    return 'text-ranch-cream'; // No discount yet
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 px-6 py-3 rounded-lg',
        'bg-ranch-purple/20 border-2 border-ranch-purple',
        className
      )}
    >
      {/* Score display */}
      <div className="flex flex-col items-center">
        <span className="text-lg text-ranch-lavender uppercase tracking-wide">Score</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={score}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
            className={cn('text-4xl font-bold font-mono tabular-nums', getScoreColor())}
          >
            {score}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Current discount */}
      {currentDiscount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-ranch-lime/20 border border-ranch-lime"
        >
          <span className="text-ranch-lime text-lg font-bold">{currentDiscount}% Discount</span>
        </motion.div>
      )}

      {/* Progress to next tier */}
      {showProgress && nextThreshold && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-lg text-ranch-lavender text-center"
        >
          {nextThreshold.pointsNeeded} more for {nextThreshold.discountPercent}% off
        </motion.div>
      )}

      {/* Max discount reached */}
      {showProgress && !nextThreshold && currentDiscount === 40 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="text-lg text-ranch-lime font-bold text-center"
        >
          🎉 MAX DISCOUNT!
        </motion.div>
      )}
    </div>
  );
}
