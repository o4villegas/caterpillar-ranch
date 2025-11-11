/**
 * Game Timer Component
 *
 * Displays countdown timer with horror theming
 * - Shows time remaining in seconds
 * - Color changes as time runs low (green → yellow → red)
 * - Pulse animation when time is critical (<5s)
 * - Respects prefers-reduced-motion
 */

import { motion } from 'framer-motion';
import { cn } from '../../utils';

interface GameTimerProps {
  timeLeft: number;
  className?: string;
}

export function GameTimer({ timeLeft, className }: GameTimerProps) {
  // Color logic based on time remaining
  const getTimeColor = () => {
    if (timeLeft <= 5) return 'text-ranch-pink'; // Critical (red/pink)
    if (timeLeft <= 10) return 'text-yellow-400'; // Warning (yellow)
    return 'text-ranch-lime'; // Good (green)
  };

  // Pulse animation when critical
  const shouldPulse = timeLeft <= 5 && timeLeft > 0;

  return (
    <motion.div
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg',
        'bg-ranch-purple/20 border-2',
        timeLeft <= 5 ? 'border-ranch-pink' : 'border-ranch-purple',
        className
      )}
      animate={shouldPulse ? { scale: [1, 1.05, 1] } : {}}
      transition={{
        duration: 0.6,
        repeat: shouldPulse ? Infinity : 0,
        ease: 'easeInOut',
      }}
    >
      {/* Clock icon (Unicode) */}
      <span className={cn('text-2xl', getTimeColor())}>⏱</span>

      {/* Time display */}
      <div className="flex flex-col">
        <span className="text-lg text-ranch-lavender uppercase tracking-wide">Time Left</span>
        <motion.span
          className={cn('text-2xl font-mono font-bold tabular-nums', getTimeColor())}
          key={timeLeft} // Trigger animation on change
          initial={{ scale: 1.2, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {timeLeft}s
        </motion.span>
      </div>
    </motion.div>
  );
}
