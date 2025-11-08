/**
 * Reusable Game State Hook
 *
 * Manages common game state across all 6 games:
 * - Score tracking
 * - Timer countdown
 * - Game status (not started, playing, completed)
 * - Score manipulation methods
 *
 * Usage:
 *   const game = useGameState(25); // 25 second game
 *   game.startGame();
 *   game.addPoints(5);
 *   game.endGame();
 */

import { useState, useEffect, useCallback } from 'react';

export type GameStatus = 'idle' | 'playing' | 'completed';

export interface GameState {
  // State
  score: number;
  timeLeft: number;
  status: GameStatus;

  // Methods
  startGame: () => void;
  endGame: () => void;
  addPoints: (points: number) => void;
  subtractPoints: (points: number) => void;
  setScore: (score: number) => void;
  resetGame: () => void;
}

/**
 * Game state hook
 *
 * @param gameDuration - Duration in seconds (25, 30, or 45)
 * @returns GameState object with state and methods
 */
export function useGameState(gameDuration: number): GameState {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gameDuration);
  const [status, setStatus] = useState<GameStatus>('idle');

  // Timer countdown logic
  useEffect(() => {
    if (status !== 'playing' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time's up! End game automatically
          setStatus('completed');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeLeft]);

  // Start game
  const startGame = useCallback(() => {
    setStatus('playing');
    setScore(0);
    setTimeLeft(gameDuration);
  }, [gameDuration]);

  // End game manually
  const endGame = useCallback(() => {
    setStatus('completed');
  }, []);

  // Add points to score
  const addPoints = useCallback((points: number) => {
    setScore((s) => Math.max(0, s + points)); // Prevent negative scores
  }, []);

  // Subtract points from score (for penalties)
  const subtractPoints = useCallback((points: number) => {
    setScore((s) => Math.max(0, s - points)); // Prevent negative scores
  }, []);

  // Reset game to initial state
  const resetGame = useCallback(() => {
    setScore(0);
    setTimeLeft(gameDuration);
    setStatus('idle');
  }, [gameDuration]);

  return {
    score,
    timeLeft,
    status,
    startGame,
    endGame,
    addPoints,
    subtractPoints,
    setScore,
    resetGame,
  };
}
