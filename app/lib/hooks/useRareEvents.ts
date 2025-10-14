import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

export type RareEventType = 'eye' | 'darken' | 'whisper' | null;

/**
 * Hook for triggering rare horror events
 *
 * Events have a 1% chance of triggering on navigation
 * Each event lasts ~2 seconds before clearing
 *
 * Usage:
 *   const rareEvent = useRareEvents();
 *   <EyeInCorner show={rareEvent === 'eye'} />
 */
export function useRareEvents(): RareEventType {
  const location = useLocation();
  const [activeEvent, setActiveEvent] = useState<RareEventType>(null);

  useEffect(() => {
    // 1% chance on navigation
    const triggerRareEvent = () => {
      const rand = Math.random();

      if (rand < 0.01) { // 1% chance
        const events: RareEventType[] = ['eye', 'darken', 'whisper'];
        const eventIndex = Math.floor(Math.random() * events.length);
        const event = events[eventIndex];

        setActiveEvent(event);

        // Clear event after duration
        const duration = event === 'darken' ? 1500 : 2000; // Darken is slightly shorter
        setTimeout(() => setActiveEvent(null), duration);
      }
    };

    triggerRareEvent();
  }, [location.pathname]); // Trigger on navigation

  return activeEvent;
}
