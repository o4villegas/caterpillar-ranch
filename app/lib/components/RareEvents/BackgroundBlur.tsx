/**
 * Background Blur Rare Event Component
 *
 * Creates an unsettling "something's watching" moment:
 * - Blurs entire page (3px backdrop-filter)
 * - Shows vague floating shapes (purple/lavender orbs)
 * - Radial gradient dot pattern overlay
 * - 1.5s total duration
 * - Respects prefers-reduced-motion
 *
 * Triggered randomly (1% chance on navigation)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface BackgroundBlurProps {
  show: boolean;
}

interface Shape {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function BackgroundBlur({ show }: BackgroundBlurProps) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Generate random positions for floating shapes
  useEffect(() => {
    if (show) {
      const generatedShapes: Shape[] = [];
      const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
      const height = typeof window !== 'undefined' ? window.innerHeight : 1080;

      for (let i = 0; i < 5; i++) {
        generatedShapes.push({
          id: i,
          startX: Math.random() * width,
          startY: Math.random() * height,
          endX: Math.random() * width,
          endY: Math.random() * height,
        });
      }

      setShapes(generatedShapes);
    }
  }, [show]);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Blur overlay layer - z-index 9998 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.3 }}
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: 9998,
              backdropFilter: prefersReducedMotion ? 'none' : 'blur(3px)',
              WebkitBackdropFilter: prefersReducedMotion ? 'none' : 'blur(3px)',
            }}
            aria-hidden="true"
          />

          {/* Vague shapes layer - z-index 9997 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.3 }}
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: 9997,
              backgroundImage: 'radial-gradient(circle, rgba(155,143,181,0.3) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
            aria-hidden="true"
          >
            {/* Random floating shapes */}
            {shapes.map((shape) => (
              <motion.div
                key={shape.id}
                initial={{
                  x: shape.startX,
                  y: shape.startY,
                  scale: 0,
                }}
                animate={{
                  x: prefersReducedMotion ? shape.startX : shape.endX,
                  y: prefersReducedMotion ? shape.startY : shape.endY,
                  scale: prefersReducedMotion ? 1 : [0, 1, 0],
                }}
                transition={{
                  duration: prefersReducedMotion ? 0.01 : 1.5,
                  ease: 'easeInOut',
                }}
                className="absolute w-5 h-5 rounded-full blur-xl"
                style={{
                  background:
                    shape.id % 2 === 0
                      ? 'rgba(155, 143, 181, 0.3)' // Lavender
                      : 'rgba(74, 50, 88, 0.3)',   // Deep purple
                }}
              />
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
