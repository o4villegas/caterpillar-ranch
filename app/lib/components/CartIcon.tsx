/**
 * Cart Icon Component
 *
 * Displays cart icon with item count badge
 * - Wiggle animation when items are added (wiggle-wrong animation from app.css)
 * - Heartbeat pulse on hover
 * - Horror-themed styling (lime green with purple accents)
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { cn } from '../utils';

interface CartIconProps {
  onClick?: () => void;
  className?: string;
}

export function CartIcon({ onClick, className }: CartIconProps) {
  const { totals } = useCart();
  const [shouldWiggle, setShouldWiggle] = useState(false);
  const [prevItemCount, setPrevItemCount] = useState(totals.itemCount);

  // Trigger wiggle animation when item count increases
  useEffect(() => {
    if (totals.itemCount > prevItemCount) {
      setShouldWiggle(true);
      setTimeout(() => setShouldWiggle(false), 600); // Duration of wiggle-wrong animation
    }
    setPrevItemCount(totals.itemCount);
  }, [totals.itemCount, prevItemCount]);

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-3 rounded-full',
        'bg-ranch-purple/20 hover:bg-ranch-purple/40',
        'border-2 border-ranch-purple hover:border-ranch-lime',
        'transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-ranch-lime focus:ring-offset-2 focus:ring-offset-ranch-dark',
        shouldWiggle && 'animate-wiggle-wrong',
        className
      )}
      aria-label={`Shopping cart with ${totals.itemCount} ${totals.itemCount === 1 ? 'item' : 'items'}`}
    >
      {/* Cart Icon (Shopping Bag SVG) */}
      <svg
        className={cn(
          'w-6 h-6 text-ranch-lime transition-colors duration-300',
          totals.itemCount > 0 && 'group-hover:text-ranch-cyan'
        )}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>

      {/* Item Count Badge */}
      <AnimatePresence mode="wait">
        {totals.itemCount > 0 && (
          <motion.div
            key={totals.itemCount}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className={cn(
              'absolute -top-1 -right-1',
              'min-w-[20px] h-5 px-1',
              'flex items-center justify-center',
              'bg-ranch-pink text-ranch-dark',
              'text-xs font-bold',
              'rounded-full',
              'border-2 border-ranch-dark',
              'shadow-lg',
              // Heartbeat pulse animation on hover
              'group-hover:animate-heartbeat-pulse'
            )}
          >
            {totals.itemCount > 99 ? '99+' : totals.itemCount}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discount Indicator (if any discounts applied) */}
      {totals.effectiveDiscountPercent > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'absolute -bottom-1 left-1/2 -translate-x-1/2',
            'px-2 py-0.5',
            'bg-ranch-lime text-ranch-dark',
            'text-[10px] font-bold',
            'rounded-full',
            'border border-ranch-dark',
            'shadow-md',
            'whitespace-nowrap'
          )}
        >
          {Math.round(totals.effectiveDiscountPercent)}% OFF
        </motion.div>
      )}
    </button>
  );
}
