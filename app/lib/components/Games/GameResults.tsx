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
import { HORROR_COPY } from '../../constants/horror-copy';

interface GameResultsProps {
  score: number;
  onApplyDiscount: (discount: number) => void;
  className?: string;
}

export function GameResults({ score, onApplyDiscount, className }: GameResultsProps) {
  const result = getDiscountResult(score);
  const { discountPercent, message } = result;

  // Get tier-specific celebration data
  const getCelebration = () => {
    if (discountPercent >= 15) return HORROR_COPY.games.celebrations.tier15;
    if (discountPercent >= 12) return HORROR_COPY.games.celebrations.tier12;
    if (discountPercent >= 9) return HORROR_COPY.games.celebrations.tier9;
    if (discountPercent >= 6) return HORROR_COPY.games.celebrations.tier6;
    if (discountPercent >= 3) return HORROR_COPY.games.celebrations.tier3;
    return null;
  };

  const celebration = getCelebration();

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
    if (discountPercent >= 15) return 'text-ranch-lime'; // Max
    if (discountPercent >= 12) return 'text-ranch-cyan'; // Great
    if (discountPercent >= 9) return 'text-yellow-400'; // Good
    if (discountPercent >= 6) return 'text-ranch-lavender'; // Okay
    if (discountPercent >= 3) return 'text-ranch-cream'; // Minimal
    return 'text-ranch-pink'; // Failed
  };

  const getBgGlow = () => {
    if (discountPercent >= 15) return 'shadow-[0_0_40px_rgba(50,205,50,0.3)]';
    if (discountPercent >= 12) return 'shadow-[0_0_40px_rgba(0,206,209,0.3)]';
    if (discountPercent >= 9) return 'shadow-[0_0_40px_rgba(250,204,21,0.3)]';
    if (discountPercent >= 6) return 'shadow-[0_0_40px_rgba(155,143,181,0.3)]';
    if (discountPercent >= 3) return 'shadow-[0_0_40px_rgba(245,245,220,0.3)]';
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
        <span className="text-lg text-ranch-lavender uppercase tracking-wide" style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}>Final Score</span>
        <motion.div
          className={cn('text-6xl tabular-nums mt-2', getResultColor())}
          style={{ fontFamily: 'Handjet, monospace', fontWeight: 800 }}
          animate={discountPercent >= 15 ? { scale: [1, 1.1, 1] } : {}}
          transition={{
            duration: 0.6,
            repeat: discountPercent >= 15 ? Infinity : 0,
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
              'text-3xl',
              discountPercent > 0 ? 'text-ranch-lime' : 'text-ranch-pink'
            )}
            style={{ fontFamily: 'Handjet, monospace', fontWeight: 800 }}
          >
            {formatDiscount(discountPercent)}
          </div>
          <div className="text-lg text-ranch-lavender mt-1" style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}>
            {discountPercent > 0 ? 'Discount Earned!' : 'No Discount'}
          </div>
        </div>
      </motion.div>

      {/* Horror-themed message */}
      <motion.p
        variants={itemVariants}
        className="text-center text-ranch-cream text-lg max-w-md px-4"
        style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}
      >
        {message}
      </motion.p>

      {/* Tier-specific celebration */}
      {celebration && (
        <motion.div
          variants={itemVariants}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border",
            discountPercent >= 15 && "bg-ranch-lime/10 border-ranch-lime",
            discountPercent >= 12 && discountPercent < 15 && "bg-ranch-cyan/10 border-ranch-cyan",
            discountPercent >= 9 && discountPercent < 12 && "bg-yellow-400/10 border-yellow-400",
            discountPercent >= 6 && discountPercent < 9 && "bg-ranch-lavender/10 border-ranch-lavender",
            discountPercent >= 3 && discountPercent < 6 && "bg-ranch-cream/10 border-ranch-cream"
          )}
          animate={discountPercent >= 15 ? { rotate: [0, -2, 2, -2, 0] } : {}}
          transition={{
            duration: 0.5,
            repeat: discountPercent >= 15 ? Infinity : 0,
            repeatDelay: 2,
          }}
        >
          <span className="text-2xl">{celebration.emoji}</span>
          <span className={getResultColor()} style={{ fontFamily: 'Handjet, monospace', fontWeight: 800 }}>
            {celebration.message}
          </span>
          <span className="text-2xl">{celebration.emoji}</span>
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
          style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}
        >
          {discountPercent > 0 ? 'Claim Discount & Return' : 'Return to Product'}
        </Button>
      </motion.div>

      {/* Score breakdown hint (for transparency) */}
      <motion.div
        variants={itemVariants}
        className="text-lg text-ranch-lavender/60 text-center mt-2"
        style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}
      >
        {discountPercent === 0 && score < 20 && 'Need 20+ points for any discount'}
        {score >= 20 && score < 30 && 'Need 30+ points for 6% off'}
        {score >= 30 && score < 40 && 'Need 40+ points for 9% off'}
        {score >= 40 && score < 50 && 'Need 50+ points for 12% off'}
        {score >= 50 && score < 60 && 'Need 60+ points for maximum 15% off'}
      </motion.div>
    </motion.div>
  );
}
