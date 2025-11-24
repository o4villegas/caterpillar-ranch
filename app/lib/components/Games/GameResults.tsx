/**
 * Game Results Component — "The Chrysalis" Theme
 *
 * Displays game completion screen with:
 * - Final score with earned transcendence framing
 * - Trust percentage (discount) earned
 * - Thematic success/failure messaging
 * - Retry button for failed attempts
 * - Apply discount and return
 *
 * Tone: Reverent, bittersweet for success; encouraging for failure
 */

import { motion } from 'framer-motion';
import { cn } from '../../utils';
import { getDiscountResult, formatDiscount } from './utils/scoreConversion';
import { Button } from '../ui/button';

interface GameResultsProps {
  score: number;
  onApplyDiscount: (discount: number) => void;
  onRetry?: () => void;
  className?: string;
}

export function GameResults({ score, onApplyDiscount, onRetry, className }: GameResultsProps) {
  const result = getDiscountResult(score);
  const { discountPercent, message, subtext, emoji, canRetry } = result;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        type: 'spring' as const,
        stiffness: 150,
        damping: 20,
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  // Color scheme based on trust earned
  const getResultColor = () => {
    if (discountPercent >= 15) return 'text-amber-400'; // Perfect - golden
    if (discountPercent >= 12) return 'text-ranch-cyan'; // Strong
    if (discountPercent >= 9) return 'text-ranch-lavender'; // Good
    if (discountPercent >= 6) return 'text-gray-400'; // Incomplete
    if (discountPercent >= 3) return 'text-gray-500'; // Barely
    return 'text-ranch-pink'; // Failed
  };

  const getBgGlow = () => {
    if (discountPercent >= 15) return 'shadow-[0_0_60px_rgba(251,191,36,0.3)]'; // Amber glow
    if (discountPercent >= 12) return 'shadow-[0_0_40px_rgba(0,206,209,0.25)]';
    if (discountPercent >= 9) return 'shadow-[0_0_30px_rgba(155,143,181,0.2)]';
    if (discountPercent >= 6) return 'shadow-[0_0_20px_rgba(107,114,128,0.15)]';
    if (discountPercent >= 3) return 'shadow-[0_0_15px_rgba(107,114,128,0.1)]';
    return 'shadow-[0_0_40px_rgba(255,20,147,0.2)]'; // Failed - pink glow
  };

  const getBorderColor = () => {
    if (discountPercent >= 15) return 'border-amber-500/50';
    if (discountPercent >= 12) return 'border-ranch-cyan/50';
    if (discountPercent >= 9) return 'border-ranch-lavender/50';
    if (discountPercent >= 6) return 'border-gray-500/50';
    if (discountPercent >= 3) return 'border-gray-600/50';
    return 'border-ranch-pink/50';
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'flex flex-col items-center gap-8 p-10 rounded-2xl',
        'bg-gradient-to-b from-ranch-purple/40 to-ranch-dark/90',
        'border-2',
        getBorderColor(),
        getBgGlow(),
        className
      )}
    >
      {/* Emoji Result Icon */}
      <motion.div
        variants={itemVariants}
        className="text-7xl"
        animate={
          discountPercent >= 15
            ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }
            : discountPercent === 0
              ? { scale: [1, 0.95, 1], opacity: [1, 0.7, 1] }
              : {}
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      >
        {emoji}
      </motion.div>

      {/* Main Message */}
      <motion.div variants={itemVariants} className="text-center space-y-3">
        <h2
          className={cn('text-2xl', getResultColor())}
          style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
        >
          {message}
        </h2>
        <p
          className="text-ranch-cream/80 text-lg max-w-sm leading-relaxed"
          style={{ fontFamily: 'Tourney, cursive', fontWeight: 500 }}
        >
          {subtext}
        </p>
      </motion.div>

      {/* Score Display */}
      <motion.div variants={itemVariants} className="text-center">
        <span
          className="text-sm text-ranch-lavender/60 uppercase tracking-widest"
          style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}
        >
          Final Score
        </span>
        <motion.div
          className={cn('text-5xl tabular-nums mt-1', getResultColor())}
          style={{ fontFamily: 'Tourney, cursive', fontWeight: 800 }}
          animate={discountPercent >= 15 ? { scale: [1, 1.05, 1] } : {}}
          transition={{
            duration: 1.5,
            repeat: discountPercent >= 15 ? Infinity : 0,
            repeatType: 'reverse',
          }}
        >
          {score}
        </motion.div>
      </motion.div>

      {/* Trust Badge */}
      <motion.div
        variants={itemVariants}
        className={cn(
          'px-8 py-4 rounded-xl border-2',
          discountPercent > 0
            ? 'bg-amber-500/10 border-amber-500/40'
            : 'bg-ranch-pink/10 border-ranch-pink/40'
        )}
      >
        <div className="text-center">
          <div
            className={cn(
              'text-3xl',
              discountPercent > 0 ? 'text-amber-400' : 'text-ranch-pink'
            )}
            style={{ fontFamily: 'Tourney, cursive', fontWeight: 800 }}
          >
            {formatDiscount(discountPercent)}
          </div>
          <div
            className="text-sm text-ranch-lavender/70 mt-1"
            style={{ fontFamily: 'Tourney, cursive', fontWeight: 500 }}
          >
            {discountPercent > 0 ? 'Earned' : 'Try Again'}
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 w-full max-w-xs mt-2">
        {/* Primary: Apply discount or return */}
        <Button
          onClick={() => onApplyDiscount(discountPercent)}
          variant="horror"
          size="lg"
          className={cn(
            'w-full text-lg',
            discountPercent >= 15 && 'bg-amber-500 hover:bg-amber-400 text-ranch-dark'
          )}
          style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}
        >
          {discountPercent > 0 ? 'Claim Trust & Return' : 'Return Without Trust'}
        </Button>

        {/* Secondary: Retry (only shown if failed and onRetry provided) */}
        {canRetry && onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="lg"
            className="w-full text-lg border-ranch-lavender/40 text-ranch-lavender hover:bg-ranch-lavender/10"
            style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}
          >
            Try Again — They Deserve Better
          </Button>
        )}
      </motion.div>

      {/* Progress hint for near-misses */}
      <motion.div
        variants={itemVariants}
        className="text-sm text-ranch-lavender/50 text-center"
        style={{ fontFamily: 'Tourney, cursive', fontWeight: 500 }}
      >
        {discountPercent === 0 && score >= 15 && score < 20 && (
          <span>So close. {20 - score} more points would have earned their trust.</span>
        )}
        {discountPercent === 3 && score >= 25 && (
          <span>{30 - score} more points for stronger trust.</span>
        )}
        {discountPercent === 6 && score >= 35 && (
          <span>{40 - score} more points for deeper trust.</span>
        )}
        {discountPercent === 9 && score >= 45 && (
          <span>{50 - score} more points for near-perfect care.</span>
        )}
        {discountPercent === 12 && score >= 55 && (
          <span>{60 - score} more points for perfect emergence.</span>
        )}
        {discountPercent === 15 && (
          <span>Perfect. They will remember your care.</span>
        )}
      </motion.div>
    </motion.div>
  );
}
