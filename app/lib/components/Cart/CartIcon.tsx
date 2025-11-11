import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { cn } from '../../utils';

interface CartIconProps {
  onClick: () => void;
  className?: string;
}

export function CartIcon({ onClick, className }: CartIconProps) {
  const { cart, totals } = useCart();
  const itemCount = totals.itemCount;
  const hasItems = itemCount > 0;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative p-3 rounded-lg transition-all',
        'bg-ranch-purple/30 hover:bg-ranch-purple/50',
        'border-2 border-ranch-purple hover:border-ranch-cyan',
        'focus:outline-none focus:ring-2 focus:ring-ranch-cyan focus:ring-offset-2 focus:ring-offset-ranch-dark',
        hasItems && 'animate-wiggle-wrong',
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingCart className="w-6 h-6 text-ranch-cream" />

      <AnimatePresence>
        {hasItems && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={cn(
              'absolute -top-2 -right-2',
              'min-w-[24px] h-6 px-1.5',
              'flex items-center justify-center',
              'bg-ranch-pink rounded-full',
              'border-2 border-ranch-dark',
              'animate-heartbeat-pulse'
            )}
          >
            <span className="text-sm font-bold text-ranch-dark leading-none">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
