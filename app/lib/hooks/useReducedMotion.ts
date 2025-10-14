import { useEffect, useState } from 'react';

/**
 * Hook to detect user's reduced motion preference
 *
 * Returns true if user prefers reduced motion (for accessibility)
 * Use this to disable or simplify animations
 *
 * Usage:
 *   const reducedMotion = useReducedMotion();
 *
 *   <motion.div
 *     animate={reducedMotion ? {} : { scale: 1.05, rotate: 2 }}
 *   >
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReducedMotion;
}
