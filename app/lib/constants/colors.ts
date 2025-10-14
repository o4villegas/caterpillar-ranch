/**
 * Caterpillar Ranch Color Palette
 *
 * Based on styling-reference.png - the horror aesthetic mascot.
 * Core vibe: "Tim Burton meets Animal Crossing meets Don't Starve"
 *
 * Philosophy: Cute + Wrong = Unsettling but delightful
 */

export const COLORS = {
  // Primary greens (from caterpillar body in reference image)
  primary: {
    cyan: '#00CED1',        // Bright cyan-green, caterpillar segments
    lime: '#32CD32',        // Lime green, highlights and success states
    cyanRgb: '0, 206, 209', // For rgba() usage
    limeRgb: '50, 205, 50', // For rgba() usage
  },

  // Accent pinks (from "RANCCH" drip text and blush)
  accent: {
    pink: '#FF1493',        // Hot pink/magenta, warnings and drip text
    pinkRgb: '255, 20, 147', // For rgba() usage
  },

  // Purples (backgrounds and shadows)
  purple: {
    lavender: '#9B8FB5',    // Light purple, UI elements
    deep: '#4A3258',        // Deep purple, page backgrounds
    lavenderRgb: '155, 143, 181',
    deepRgb: '74, 50, 88',
  },

  // Neutrals
  neutral: {
    cream: '#F5F5DC',       // Cream/beige, text on dark backgrounds
    offWhite: '#FAFAFA',    // Off-white, highlights
    dark: '#1a1a1a',        // Near-black, primary dark background
    darkRgb: '26, 26, 26',
  },

  // Semantic colors (mapped from palette)
  semantic: {
    success: '#32CD32',     // Lime green
    warning: '#FF1493',     // Hot pink
    error: '#FF1493',       // Hot pink
    info: '#00CED1',        // Cyan
  },
} as const;

/**
 * CSS custom properties for use in stylesheets
 * Use these in app.css for consistent theming
 */
export const CSS_VARS = {
  '--color-primary-cyan': COLORS.primary.cyan,
  '--color-primary-lime': COLORS.primary.lime,
  '--color-accent-pink': COLORS.accent.pink,
  '--color-purple-lavender': COLORS.purple.lavender,
  '--color-purple-deep': COLORS.purple.deep,
  '--color-neutral-cream': COLORS.neutral.cream,
  '--color-neutral-dark': COLORS.neutral.dark,
  '--color-success': COLORS.semantic.success,
  '--color-warning': COLORS.semantic.warning,
  '--color-error': COLORS.semantic.error,
  '--color-info': COLORS.semantic.info,
} as const;

/**
 * Tailwind-compatible color palette
 * Add these to tailwind.config if using custom colors
 */
export const TAILWIND_COLORS = {
  'ranch-cyan': COLORS.primary.cyan,
  'ranch-lime': COLORS.primary.lime,
  'ranch-pink': COLORS.accent.pink,
  'ranch-lavender': COLORS.purple.lavender,
  'ranch-purple': COLORS.purple.deep,
  'ranch-cream': COLORS.neutral.cream,
  'ranch-dark': COLORS.neutral.dark,
} as const;
