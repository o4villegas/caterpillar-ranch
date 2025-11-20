/**
 * ColorSwatch Component
 *
 * Circular color selector for product variants
 * Nike-style design with hover tooltips and visual states
 */

import { motion } from 'framer-motion';
import { cn } from '~/lib/utils';

export interface ColorSwatchProps {
  color: string;
  hexCode: string;
  isSelected: boolean;
  isAvailable: boolean;
  onClick: () => void;
  className?: string;
}

export function ColorSwatch({
  color,
  hexCode,
  isSelected,
  isAvailable,
  onClick,
  className,
}: ColorSwatchProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!isAvailable}
      className={cn(
        'group relative',
        'w-10 h-10 rounded-full',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-ranch-cyan focus:ring-offset-2 focus:ring-offset-ranch-dark',
        isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-40',
        className
      )}
      whileHover={isAvailable ? { scale: 1.1 } : undefined}
      whileTap={isAvailable ? { scale: 0.95 } : undefined}
      aria-label={`${color} ${isAvailable ? '' : '(out of stock)'}`}
    >
      {/* Outer ring for selection state */}
      <div
        className={cn(
          'absolute inset-0 rounded-full transition-all duration-200',
          isSelected
            ? 'ring-2 ring-ranch-lime shadow-[0_0_12px_rgba(50,205,50,0.5)]'
            : 'ring-1 ring-ranch-purple/30'
        )}
      />

      {/* Color circle */}
      <div
        className={cn(
          'absolute inset-1 rounded-full',
          'transition-all duration-200',
          isAvailable ? '' : 'grayscale'
        )}
        style={{ backgroundColor: hexCode }}
      >
        {/* White/black border for contrast */}
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            // Add border based on color brightness for better visibility
            hexCode.toLowerCase() === '#ffffff' || hexCode.toLowerCase() === '#f5f5dc'
              ? 'border border-ranch-purple/20'
              : ''
          )}
        />

        {/* Out of stock diagonal line */}
        {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-0.5 bg-ranch-pink rotate-45 transform" />
          </div>
        )}
      </div>

      {/* Tooltip on hover */}
      <div
        className={cn(
          'absolute -bottom-8 left-1/2 -translate-x-1/2',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity duration-200',
          'pointer-events-none',
          'whitespace-nowrap',
          'px-2 py-1 rounded',
          'bg-ranch-dark border border-ranch-purple',
          'text-xs text-ranch-cream',
          'z-10'
        )}
      >
        {color}
        {!isAvailable && ' (Out of Stock)'}
      </div>
    </motion.button>
  );
}

/**
 * ColorSwatchGroup Component
 *
 * Container for multiple color swatches with consistent spacing
 */
interface ColorSwatchGroupProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export function ColorSwatchGroup({
  children,
  label,
  className,
}: ColorSwatchGroupProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {label && (
        <label className="text-sm font-medium text-ranch-cream">{label}</label>
      )}
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );
}
