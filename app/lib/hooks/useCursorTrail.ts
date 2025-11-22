import { useEffect } from 'react';

interface CursorTrailOptions {
  enabled?: boolean;
}

/**
 * Custom hook for cursor trail effect
 *
 * Creates fading lime-green dots that follow the cursor.
 * Part of the environmental horror layer - subtle, barely noticeable.
 *
 * Usage: Call in root component (app/root.tsx)
 */
export function useCursorTrail(options: CursorTrailOptions = {}) {
  const { enabled = true } = options;

  useEffect(() => {
    // Skip if disabled or user prefers reduced motion
    if (!enabled) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return; // Respect accessibility preferences
    }

    const trails: HTMLDivElement[] = [];
    const maxTrails = 15;

    const handleMouseMove = (e: MouseEvent) => {
      // Create trail element
      const trail = document.createElement('div');
      trail.className = 'cursor-trail';
      trail.style.left = `${e.clientX}px`;
      trail.style.top = `${e.clientY}px`;
      document.body.appendChild(trail);

      trails.push(trail);

      // Remove after animation completes
      setTimeout(() => {
        trail.remove();
        const index = trails.indexOf(trail);
        if (index > -1) {
          trails.splice(index, 1);
        }
      }, 800); // Match animation duration in CSS

      // Limit trail count to prevent memory issues
      if (trails.length > maxTrails) {
        const oldestTrail = trails.shift();
        oldestTrail?.remove();
      }
    };

    // Add event listener
    document.addEventListener('mousemove', handleMouseMove);

    // Cleanup function
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      // Remove any remaining trail elements
      trails.forEach((trail) => trail.remove());
    };
  }, [enabled]);
}
