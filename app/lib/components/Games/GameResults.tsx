/**
 * Game Results Component
 *
 * Displays game completion screen with:
 * - Final score display
 * - Earned discount percentage
 * - Horror-themed success/failure message
 * - Action buttons (retry or apply discount)
 * - Celebration/disappointment animations
 */

import { motion } from 'framer-motion';
import { cn } from '../../utils';
import { getDiscountResult, formatDiscount } from './utils/scoreConversion';
import { Button } from '../ui/button';

interface GameResultsProps {
  score: number;
  onApplyDiscount: (discount: number) => void;
  className?: string;
}

export function GameResults({ score, onApplyDiscount, className }: GameResultsProps) {
  const result = getDiscountResult(score);
  const { discountPercent, message } = result;

  // Animation variants for celebration/disappointment
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        type: 'spring' as const,
        stiffness: 200,
        damping: 20,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Color scheme based on discount earned
  const getResultColor = () => {
    if (discountPercent >= 40) return 'text-ranch-lime'; // Max
    if (discountPercent >= 30) return 'text-ranch-cyan'; // Great
    if (discountPercent >= 20) return 'text-yellow-400'; // Good
    if (discountPercent >= 10) return 'text-ranch-lavender'; // Okay
    return 'text-ranch-pink'; // Failed
  };

  const getBgGlow = () => {
    if (discountPercent >= 40) return 'shadow-[0_0_40px_rgba(50,205,50,0.3)]';
    if (discountPercent >= 30) return 'shadow-[0_0_40px_rgba(0,206,209,0.3)]';
    if (discountPercent >= 20) return 'shadow-[0_0_40px_rgba(250,204,21,0.3)]';
    if (discountPercent >= 10) return 'shadow-[0_0_40px_rgba(155,143,181,0.3)]';
    return 'shadow-[0_0_40px_rgba(255,20,147,0.3)]';
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'flex flex-col items-center gap-6 p-8 rounded-2xl',
        'bg-ranch-purple/30 border-2 border-ranch-purple',
        getBgGlow(),
        className
      )}
    >
      {/* Final Score */}
      <motion.div variants={itemVariants} className="text-center">
        <span className="text-sm text-ranch-lavender uppercase tracking-wide">Final Score</span>
        <motion.div
          className={cn('text-6xl font-bold font-mono tabular-nums mt-2', getResultColor())}
          animate={discountPercent >= 40 ? { scale: [1, 1.1, 1] } : {}}
          transition={{
            duration: 0.6,
            repeat: discountPercent >= 40 ? Infinity : 0,
            repeatType: 'reverse',
          }}
        >
          {score}
        </motion.div>
      </motion.div>

      {/* Discount Badge */}
      <motion.div
        variants={itemVariants}
        className={cn(
          'px-6 py-3 rounded-full border-2',
          discountPercent > 0
            ? 'bg-ranch-lime/20 border-ranch-lime'
            : 'bg-ranch-pink/20 border-ranch-pink'
        )}
      >
        <div className="text-center">
          <div
            className={cn(
              'text-3xl font-bold',
              discountPercent > 0 ? 'text-ranch-lime' : 'text-ranch-pink'
            )}
          >
            {formatDiscount(discountPercent)}
          </div>
          <div className="text-xs text-ranch-lavender mt-1">
            {discountPercent > 0 ? 'Discount Earned!' : 'No Discount'}
          </div>
        </div>
      </motion.div>

      {/* Horror-themed message */}
      <motion.p
        variants={itemVariants}
        className="text-center text-ranch-cream text-lg max-w-md px-4"
      >
        {message}
      </motion.p>

      {/* Max discount celebration */}
      {discountPercent === 40 && (
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ranch-lime/10 border border-ranch-lime"
          animate={{ rotate: [0, -2, 2, -2, 0] }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        >
          <span className="text-2xl">🎉</span>
          <span className="text-ranch-lime font-bold">MAXIMUM BLESSING!</span>
          <span className="text-2xl">🐛</span>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="flex flex-col gap-3 w-full max-w-sm mt-4">
        {/* Primary action: Apply discount (or proceed without discount if failed) */}
        <Button
          onClick={() => onApplyDiscount(discountPercent)}
          variant="horror"
          size="lg"
          className="w-full text-lg"
        >
          {discountPercent > 0 ? 'Claim Discount & Return' : 'Return to Product'}
        </Button>
      </motion.div>

      {/* Score breakdown hint (for transparency) */}
      <motion.div
        variants={itemVariants}
        className="text-xs text-ranch-lavender/60 text-center mt-2"
      >
        {discountPercent === 0 && score < 10 && 'Need 10+ points for any discount'}
        {score >= 10 && score < 20 && 'Need 20+ points for 20% off'}
        {score >= 20 && score < 35 && 'Need 35+ points for 30% off'}
        {score >= 35 && score < 45 && 'Need 45+ points for maximum 40% off'}
      </motion.div>
    </motion.div>
  );
}
