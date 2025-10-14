/**
 * Night Sky Component
 *
 * Renders a starfield background with randomly blinking stars
 * Part of the environmental horror layer
 */

import { useEffect, useState } from 'react';

interface Star {
  id: number;
  x: number; // Percentage position
  y: number; // Percentage position
  size: number; // 1-3px
  animationDelay: number; // seconds
  animationDuration: number; // seconds
}

export function NightSky() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Generate 75 random stars on mount
    const starCount = 75;
    const generatedStars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      generatedStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1, // 1-3px
        animationDelay: Math.random() * 10, // 0-10s delay before first blink
        animationDuration: Math.random() * 3 + 2, // 2-5s blink cycle
      });
    }

    setStars(generatedStars);
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
      style={{ opacity: 0.6 }}
    >
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-ranch-cream star-blink"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.animationDelay}s`,
            animationDuration: `${star.animationDuration}s`,
          }}
        />
      ))}
    </div>
  );
}
