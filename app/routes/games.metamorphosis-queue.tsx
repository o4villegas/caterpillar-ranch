/**
 * Metamorphosis Queue - Timing Game
 *
 * Horror-themed precision timing game where players preserve transforming caterpillars
 * - 25 second duration
 * - 5 cocoons that pulse and change color as transformation approaches
 * - Click during GREEN window (0.4s) for perfect timing
 * - Early/late clicks or missed transformations result in grotesque outcomes
 * - Visual feedback: beautiful moths vs. deformed moths
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { GameTimer } from '../lib/components/Games/GameTimer';
import { GameScore } from '../lib/components/Games/GameScore';
import { GameResults } from '../lib/components/Games/GameResults';
import { useGameState } from '../lib/components/Games/hooks/useGameState';
import { useCart } from '../lib/contexts/CartContext';
import { HORROR_COPY } from '../lib/constants/horror-copy';
import type { Route } from './+types/games.metamorphosis-queue';

type CocoonState = 'dormant' | 'purple' | 'pink' | 'green' | 'red' | 'completed';
type TransformResult = 'perfect' | 'good' | 'failed' | 'missed';

interface Cocoon {
  id: number;
  state: CocoonState;
  stateStartTime: number;
  clickable: boolean;
  result?: TransformResult;
  resultEmoji?: string; // Moth emoji shown after completion
}

const GAME_DURATION = 25; // seconds
const NUM_COCOONS = 5;

// State timing (ms)
const DORMANT_DURATION = 2000; // Rest between cycles
const PURPLE_DURATION = 2000; // Warning stage
const PINK_DURATION = 1500; // Approaching transformation
const GREEN_DURATION = 300; // Perfect timing window (0.3s - 25% harder)
const GREEN_BUFFER = 150; // +/- 0.15s around green for "good" timing (25% harder)
const RED_DURATION = 800; // Too late window
const RESULT_DISPLAY_DURATION = 1500; // How long to show result

// Emojis
const COCOON_EMOJI = '🥚'; // Cocoon placeholder
const PERFECT_MOTH = '🦋'; // Beautiful moth
const FAILED_MOTH = '🦟'; // Deformed moth (mosquito as grotesque substitute)
const EXPLOSION_PARTICLES = '💨'; // Explosion effect

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Metamorphosis Queue - Caterpillar Ranch' },
    { name: 'description', content: 'Preserve the transformations with perfect timing!' }
  ];
}

export default function MetamorphosisQueueRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get('product');

  const { addDiscount, removeDiscount, cart } = useCart();
  const game = useGameState(GAME_DURATION);

  const [cocoons, setCocoons] = useState<Cocoon[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  const stateTimersRef = useRef<Map<number, number>>(new Map());

  // Load best score
  useEffect(() => {
    const saved = localStorage.getItem('game:metamorphosis-queue:best-score');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Save best score
  useEffect(() => {
    if (game.score > bestScore) {
      setBestScore(game.score);
      localStorage.setItem('game:metamorphosis-queue:best-score', game.score.toString());
    }
  }, [game.score, bestScore]);

  // Show results when game completes
  useEffect(() => {
    if (game.status === 'completed') {
      setShowResults(true);
    }
  }, [game.status]);

  // Initialize cocoons
  useEffect(() => {
    if (game.status !== 'playing') {
      // Clear timers
      stateTimersRef.current.forEach(timer => window.clearTimeout(timer));
      stateTimersRef.current.clear();
      setCocoons([]);
      return;
    }

    // Create cocoons with staggered start times
    const initialCocoons: Cocoon[] = Array.from({ length: NUM_COCOONS }, (_, i) => ({
      id: i,
      state: 'dormant',
      stateStartTime: Date.now() + i * 500, // Stagger by 0.5s
      clickable: false,
    }));

    setCocoons(initialCocoons);

    // Start state machines for each cocoon
    initialCocoons.forEach(cocoon => {
      scheduleNextState(cocoon.id, 'dormant', cocoon.id * 500);
    });

    return () => {
      stateTimersRef.current.forEach(timer => window.clearTimeout(timer));
      stateTimersRef.current.clear();
    };
  }, [game.status]);

  // State machine scheduler
  const scheduleNextState = useCallback((cocoonId: number, currentState: CocoonState, delay: number = 0) => {
    if (game.status !== 'playing') return;

    const timer = window.setTimeout(() => {
      setCocoons(prev => prev.map(c => {
        if (c.id !== cocoonId || c.state === 'completed') return c;

        let nextState: CocoonState;
        let nextDelay: number;
        let clickable = false;

        switch (currentState) {
          case 'dormant':
            nextState = 'purple';
            nextDelay = PURPLE_DURATION;
            clickable = true; // Can click anytime after dormant
            break;
          case 'purple':
            nextState = 'pink';
            nextDelay = PINK_DURATION;
            clickable = true;
            break;
          case 'pink':
            nextState = 'green';
            nextDelay = GREEN_DURATION;
            clickable = true;
            break;
          case 'green':
            nextState = 'red';
            nextDelay = RED_DURATION;
            clickable = true;
            break;
          case 'red':
            // Missed transformation - auto-fail
            handleMissedTransformation(cocoonId);
            nextState = 'completed';
            nextDelay = RESULT_DISPLAY_DURATION;
            clickable = false;
            break;
          case 'completed':
            // Restart cycle
            nextState = 'dormant';
            nextDelay = DORMANT_DURATION;
            clickable = false;
            break;
          default:
            return c;
        }

        // Schedule next state transition
        if (nextState !== 'completed') {
          scheduleNextState(cocoonId, nextState, nextDelay);
        } else {
          // After result display, restart cycle
          scheduleNextState(cocoonId, 'completed', nextDelay);
        }

        return {
          ...c,
          state: nextState,
          stateStartTime: Date.now(),
          clickable,
        };
      }));
    }, delay);

    stateTimersRef.current.set(cocoonId, timer);
  }, [game.status]);

  // Handle missed transformation
  const handleMissedTransformation = useCallback((cocoonId: number) => {
    setCocoons(prev => prev.map(c => {
      if (c.id === cocoonId) {
        game.subtractPoints(5);
        return {
          ...c,
          result: 'missed' as TransformResult,
          resultEmoji: EXPLOSION_PARTICLES,
        };
      }
      return c;
    }));
  }, [game]);

  // Handle cocoon click
  const handleCocoonClick = useCallback((cocoonId: number) => {
    if (game.status !== 'playing') return;

    setCocoons(prev => prev.map(c => {
      if (c.id !== cocoonId || !c.clickable || c.state === 'completed') return c;

      // Clear the state timer for this cocoon
      const timer = stateTimersRef.current.get(cocoonId);
      if (timer) {
        window.clearTimeout(timer);
        stateTimersRef.current.delete(cocoonId);
      }

      const now = Date.now();
      const timeSinceStateStart = now - c.stateStartTime;
      let result: TransformResult;
      let points = 0;
      let emoji = FAILED_MOTH;

      // Determine timing quality
      if (c.state === 'green') {
        // Perfect timing!
        result = 'perfect';
        points = 10;
        emoji = PERFECT_MOTH;
      } else if (c.state === 'pink' && timeSinceStateStart >= PINK_DURATION - GREEN_BUFFER) {
        // Good timing (within 0.2s before green)
        result = 'good';
        points = 5;
        emoji = PERFECT_MOTH;
      } else if (c.state === 'red' && timeSinceStateStart <= GREEN_BUFFER) {
        // Good timing (within 0.2s after green)
        result = 'good';
        points = 5;
        emoji = PERFECT_MOTH;
      } else {
        // Too early or too late
        result = 'failed';
        points = -3;
        emoji = FAILED_MOTH;
      }

      if (points > 0) {
        game.addPoints(points);
      } else {
        game.subtractPoints(Math.abs(points));
      }

      // Schedule restart after result display
      scheduleNextState(cocoonId, 'completed', RESULT_DISPLAY_DURATION);

      return {
        ...c,
        state: 'completed',
        stateStartTime: now,
        clickable: false,
        result,
        resultEmoji: emoji,
      };
    }));
  }, [game, scheduleNextState]);

  const handleStartGame = useCallback(() => {
    setCocoons([]);
    game.startGame();
  }, [game]);

  const handleApplyDiscount = useCallback((discount: number) => {
    if (discount > 0 && productSlug) {
      // Remove existing discount for this product (replace, not accumulate)
      const existingDiscount = cart.discounts.find(
        (d) => d.productId === productSlug
      );

      if (existingDiscount) {
        removeDiscount(existingDiscount.id);
      }

      // Add new discount
      addDiscount({
        id: `game-metamorphosis-${Date.now()}`,
        productId: productSlug,
        discountPercent: discount,
        gameType: 'metamorphosis',
        earnedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        applied: false
      });
    }

    if (productSlug) {
      navigate(`/products/${productSlug}`);
    } else {
      navigate('/');
    }
  }, [productSlug, cart.discounts, addDiscount, removeDiscount, navigate]);

  // Helper to get cocoon background color
  const getCocoonColor = (state: CocoonState): string => {
    switch (state) {
      case 'dormant':
        return 'bg-gray-700';
      case 'purple':
        return 'bg-ranch-purple';
      case 'pink':
        return 'bg-ranch-pink';
      case 'green':
        return 'bg-ranch-lime';
      case 'red':
        return 'bg-red-600';
      case 'completed':
        return 'bg-gray-800';
      default:
        return 'bg-gray-700';
    }
  };

  // Helper to get visual intensity class
  const getIntensityClass = (state: CocoonState): string => {
    switch (state) {
      case 'purple':
        return 'animate-pulse-slow';
      case 'pink':
        return 'animate-pulse-medium';
      case 'green':
        return 'animate-pulse-fast ring-4 ring-ranch-lime';
      case 'red':
        return 'animate-shake';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-ranch-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-ranch-lime mb-2">
            Metamorphosis Queue
          </h1>
          <p className="text-ranch-lavender text-lg">
            Click cocoons at the exact moment of emergence
          </p>
          {bestScore > 0 && (
            <p className="text-ranch-cyan text-lg mt-1">
              Best Score: {bestScore}
            </p>
          )}
        </div>

        {/* Game UI - Before start */}
        {game.status === 'idle' && (
          <div className="text-center space-y-6">
            <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-8">
              <p className="text-lg text-ranch-cream leading-relaxed text-center" style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}>
                {HORROR_COPY.games.metamorphosisQueue.instructions[0]}
              </p>
              <p className="text-lg text-ranch-lavender mt-1 text-center" style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}>
                {HORROR_COPY.games.metamorphosisQueue.instructions[1]}
              </p>
            </div>
            <button
              onClick={handleStartGame}
              className="w-full px-6 py-4 bg-ranch-lime text-ranch-dark rounded-lg font-bold text-lg hover:bg-ranch-cyan transition-colors"
              style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
            >
              {HORROR_COPY.games.metamorphosisQueue.startButton}
            </button>
          </div>
        )}

        {/* Game UI - Playing */}
        {game.status === 'playing' && (
          <div className="space-y-6">
            {/* HUD */}
            <div className="flex gap-4">
              <GameTimer timeLeft={game.timeLeft} className="flex-1" />
              <GameScore score={game.score} showProgress={true} className="flex-1" />
            </div>

            {/* Color guide */}
            <div className="bg-ranch-purple/10 border border-ranch-purple rounded-lg p-3">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-ranch-purple rounded-full" />
                  <span className="text-ranch-cream">Warning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-ranch-pink rounded-full" />
                  <span className="text-ranch-cream">Approaching</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-ranch-lime rounded-full" />
                  <span className="text-ranch-lime font-bold">CLICK!</span>
                </div>
              </div>
            </div>

            {/* Cocoon queue */}
            <div className="space-y-3">
              {cocoons.map((cocoon) => (
                <button
                  key={cocoon.id}
                  onClick={() => handleCocoonClick(cocoon.id)}
                  disabled={!cocoon.clickable || cocoon.state === 'dormant'}
                  className={`w-full h-20 rounded-lg transition-all duration-200 ${getCocoonColor(cocoon.state)} ${
                    getIntensityClass(cocoon.state)
                  } ${
                    cocoon.clickable && cocoon.state !== 'dormant' ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  {/* Cocoon content */}
                  <div className="flex items-center justify-center h-full relative">
                    {cocoon.state === 'completed' && cocoon.result ? (
                      // Show result
                      <div className="text-center">
                        <div className="text-4xl mb-1">{cocoon.resultEmoji}</div>
                        <div
                          className={`text-sm font-bold ${
                            cocoon.result === 'perfect'
                              ? 'text-ranch-lime'
                              : cocoon.result === 'good'
                              ? 'text-ranch-cyan'
                              : cocoon.result === 'failed'
                              ? 'text-ranch-pink'
                              : 'text-gray-500'
                          }`}
                        >
                          {cocoon.result === 'perfect'
                            ? 'PERFECT! +10'
                            : cocoon.result === 'good'
                            ? 'GOOD! +5'
                            : cocoon.result === 'failed'
                            ? 'FAILED -3'
                            : 'MISSED -5'}
                        </div>
                      </div>
                    ) : (
                      // Show cocoon
                      <div className="relative">
                        <div className="text-5xl">{COCOON_EMOJI}</div>
                        {/* Thrashing silhouette inside cocoon */}
                        {cocoon.state !== 'dormant' && cocoon.state !== 'completed' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-2xl opacity-40 animate-thrash">🐛</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Game Results */}
        {showResults && (
          <GameResults
            score={game.score}
            onApplyDiscount={handleApplyDiscount}
          />
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.02);
            opacity: 1;
          }
        }

        @keyframes pulse-medium {
          0%, 100% {
            transform: scale(1);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }

        @keyframes pulse-fast {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 20px rgba(50, 205, 50, 0.5);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 0 40px rgba(50, 205, 50, 0.8);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }

        @keyframes thrash {
          0%, 100% {
            transform: rotate(0deg) translateY(0);
          }
          25% {
            transform: rotate(-15deg) translateY(-2px);
          }
          75% {
            transform: rotate(15deg) translateY(2px);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .animate-pulse-medium {
          animation: pulse-medium 1.5s ease-in-out infinite;
        }

        .animate-pulse-fast {
          animation: pulse-fast 0.4s ease-in-out infinite;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out infinite;
        }

        .animate-thrash {
          animation: thrash 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
