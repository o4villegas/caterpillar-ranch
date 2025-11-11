/**
 * WhisperDisplay Component
 *
 * Displays rare horror whispers with subtle fade animations
 * - Triggered by useRareEvents hook (1% chance on navigation)
 * - Shows random whisper from HORROR_COPY.whispers
 * - Low opacity (0.4) for "barely audible" visual effect
 * - Positioned at bottom center
 * - Uses Framer Motion for smooth animations
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getRandomWhisper } from '../constants/horror-copy';

interface WhisperDisplayProps {
  show: boolean;
}

export function WhisperDisplay({ show }: WhisperDisplayProps) {
  const [whisper, setWhisper] = useState('');

  // Select a random whisper when show becomes true
  useEffect(() => {
    if (show) {
      setWhisper(getRandomWhisper());
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.4, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{
            textShadow: '0 0 8px rgba(155, 143, 181, 0.6)',
          }}
        >
          <p
            className="text-ranch-lavender text-lg italic tracking-wide"
            style={{
              fontFamily: 'Handjet, monospace',
              fontWeight: 400,
            }}
          >
            {whisper}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
