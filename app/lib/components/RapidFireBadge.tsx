/**
 * RapidFireBadge Component
 *
 * Displays a live countdown timer for rapid-fire products.
 * Shows time remaining until next 6-hour discount cycle reset.
 *
 * Usage:
 * <RapidFireBadge />
 */

import { motion } from 'framer-motion';
import { Badge } from './ui/badge';
import { useRapidFireTimer } from '../hooks/useRapidFireTimer';

export function RapidFireBadge() {
  const { formatted, isActive } = useRapidFireTimer();

  if (!isActive) {
    return null; // Don't render if timer isn't active
  }

  const { hours, minutes, seconds } = formatted;

  // Format time as HH:MM:SS
  const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="inline-flex items-center gap-2"
    >
      <Badge
        variant="destructive"
        className="text-xs font-bold heartbeat-pulse"
      >
        ⚡ RAPID-FIRE
      </Badge>
      <motion.div
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-ranch-pink/20 border border-ranch-pink"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(255, 20, 147, 0.4)',
            '0 0 0 4px rgba(255, 20, 147, 0)',
          ],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <span className="text-xs font-mono font-bold text-ranch-pink" aria-live="polite" aria-atomic="true">
          {timeString}
        </span>
        <span className="text-[10px] text-ranch-pink/80 font-medium">
          LEFT
        </span>
      </motion.div>
    </motion.div>
  );
}
