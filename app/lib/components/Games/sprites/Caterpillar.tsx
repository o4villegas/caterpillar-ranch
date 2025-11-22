/**
 * Caterpillar Sprite Components
 *
 * SVG-based caterpillars for The Culling game
 * - InvasiveCaterpillar: Red eyes, menacing - should be culled (+5 points)
 * - GoodCaterpillar: Green eyes, friendly - avoid hitting (-3 points)
 */

import { motion } from 'framer-motion';

interface CaterpillarProps {
  className?: string;
  size?: number;
}

/**
 * Invasive Caterpillar - Red eyes, aggressive appearance
 * This is the target to hit in The Culling game
 */
export function InvasiveCaterpillar({ className = '', size = 60 }: CaterpillarProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0, rotate: 180 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {/* Body segments - dark green with purple tint */}
      <ellipse cx="32" cy="48" rx="10" ry="6" fill="#2d5a3d" />
      <ellipse cx="26" cy="42" rx="9" ry="7" fill="#3a6b4a" />
      <ellipse cx="32" cy="36" rx="10" ry="8" fill="#2d5a3d" />
      <ellipse cx="38" cy="30" rx="9" ry="7" fill="#3a6b4a" />

      {/* Head - larger, menacing */}
      <circle cx="32" cy="20" r="14" fill="#4a3258" />
      <circle cx="32" cy="20" r="12" fill="#3a6b4a" />

      {/* Red glowing eyes */}
      <motion.circle
        cx="26"
        cy="18"
        r="5"
        fill="#1a1a1a"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 0.5 }}
      />
      <motion.circle
        cx="38"
        cy="18"
        r="5"
        fill="#1a1a1a"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 0.5 }}
      />
      <motion.circle
        cx="26"
        cy="18"
        r="3"
        fill="#ff3333"
        animate={{
          fill: ['#ff3333', '#ff0000', '#ff3333'],
          filter: ['drop-shadow(0 0 2px #ff0000)', 'drop-shadow(0 0 6px #ff0000)', 'drop-shadow(0 0 2px #ff0000)']
        }}
        transition={{ repeat: Infinity, duration: 0.8 }}
      />
      <motion.circle
        cx="38"
        cy="18"
        r="3"
        fill="#ff3333"
        animate={{
          fill: ['#ff3333', '#ff0000', '#ff3333'],
          filter: ['drop-shadow(0 0 2px #ff0000)', 'drop-shadow(0 0 6px #ff0000)', 'drop-shadow(0 0 2px #ff0000)']
        }}
        transition={{ repeat: Infinity, duration: 0.8 }}
      />

      {/* Antennae */}
      <line x1="25" y1="8" x2="20" y2="2" stroke="#3a6b4a" strokeWidth="2" strokeLinecap="round" />
      <line x1="39" y1="8" x2="44" y2="2" stroke="#3a6b4a" strokeWidth="2" strokeLinecap="round" />

      {/* Mandibles */}
      <path d="M26 26 Q22 30 24 32" stroke="#4a3258" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M38 26 Q42 30 40 32" stroke="#4a3258" strokeWidth="2" fill="none" strokeLinecap="round" />
    </motion.svg>
  );
}

/**
 * Good Caterpillar - Green eyes, friendly appearance
 * Avoid hitting this one in The Culling game
 */
export function GoodCaterpillar({ className = '', size = 60 }: CaterpillarProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0, rotate: -180 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {/* Body segments - bright lime green */}
      <ellipse cx="32" cy="48" rx="9" ry="5" fill="#32CD32" />
      <ellipse cx="27" cy="43" rx="8" ry="6" fill="#3ddc3d" />
      <ellipse cx="32" cy="37" rx="9" ry="7" fill="#32CD32" />
      <ellipse cx="37" cy="31" rx="8" ry="6" fill="#3ddc3d" />

      {/* Head - rounder, friendlier */}
      <circle cx="32" cy="20" r="13" fill="#32CD32" />
      <circle cx="32" cy="20" r="11" fill="#3ddc3d" />

      {/* Friendly green eyes */}
      <circle cx="27" cy="18" r="4" fill="#1a1a1a" />
      <circle cx="37" cy="18" r="4" fill="#1a1a1a" />
      <motion.circle
        cx="27"
        cy="18"
        r="2.5"
        fill="#00CED1"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
      <motion.circle
        cx="37"
        cy="18"
        r="2.5"
        fill="#00CED1"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />

      {/* Eye highlights */}
      <circle cx="28" cy="17" r="1" fill="white" opacity="0.8" />
      <circle cx="38" cy="17" r="1" fill="white" opacity="0.8" />

      {/* Antennae with cute balls */}
      <line x1="26" y1="9" x2="22" y2="3" stroke="#32CD32" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="9" x2="42" y2="3" stroke="#32CD32" strokeWidth="2" strokeLinecap="round" />
      <circle cx="22" cy="3" r="2" fill="#00CED1" />
      <circle cx="42" cy="3" r="2" fill="#00CED1" />

      {/* Smile */}
      <path d="M28 24 Q32 28 36 24" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
    </motion.svg>
  );
}

/**
 * Splat Effect - shown when caterpillar is hit
 */
export function SplatEffect({ color = '#32CD32', size = 80 }: { color?: string; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 1.5, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Main splat */}
      <circle cx="40" cy="40" r="15" fill={color} opacity="0.7" />

      {/* Splatter droplets */}
      <motion.circle
        cx="20" cy="30"
        r="5"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 0], x: [-10, -20], y: [0, -15] }}
        transition={{ duration: 0.3 }}
      />
      <motion.circle
        cx="60" cy="25"
        r="4"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 0], x: [10, 25], y: [0, -10] }}
        transition={{ duration: 0.35 }}
      />
      <motion.circle
        cx="55" cy="55"
        r="6"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.1, 0], x: [8, 18], y: [5, 15] }}
        transition={{ duration: 0.3 }}
      />
      <motion.circle
        cx="25" cy="58"
        r="4"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 0], x: [-8, -15], y: [8, 20] }}
        transition={{ duration: 0.32 }}
      />
      <motion.circle
        cx="40" cy="15"
        r="3"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 0], y: [-5, -20] }}
        transition={{ duration: 0.28 }}
      />
    </motion.svg>
  );
}
