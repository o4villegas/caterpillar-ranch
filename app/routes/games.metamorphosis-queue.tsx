/**
 * The Emergence — Birth Stage
 *
 * Theme: "The Chrysalis" — Help them break free at the right moment
 *
 * Horror-themed precision timing game where players guide the emergence.
 * Click too early, they dissolve. Too late, they suffocate.
 *
 * Difficulty tuned for:
 * - 15% discount: ~15-20% of players (6+ perfect, minimal errors)
 * - Narrower green window (0.25s)
 * - Harsher miss/failure penalties
 *
 * Mechanics:
 * - 25 second duration
 * - 5 cocoons pulsing toward emergence
 * - Click during GREEN window for perfect timing
 * - What emerges depends on your timing
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { GameTimer } from '../lib/components/Games/GameTimer';
import { GameScore } from '../lib/components/Games/GameScore';
import { GameResults } from '../lib/components/Games/GameResults';
import { useGameState } from '../lib/components/Games/hooks/useGameState';
import { useCart } from '../lib/contexts/CartContext';
import { useReducedMotion } from '../lib/hooks/useReducedMotion';
import { HORROR_COPY, getDreadMessage } from '../lib/constants/horror-copy';
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

// === DIFFICULTY SETTINGS (REBALANCED FOR MOBILE + FORGIVENESS) ===
const GAME_DURATION = 25; // seconds (more opportunities for timing)
const NUM_COCOONS = 4; // Better mobile visibility

// State timing (ms) - wider windows for forgiveness
const DORMANT_DURATION = 1500; // Shorter rest (faster cycles)
const PURPLE_DURATION = 1500; // Warning stage
const PINK_DURATION = 1200; // Approaching
const GREEN_DURATION = 450; // Perfect window (0.45s - more forgiving)
const GREEN_BUFFER = 200; // +/- 0.2s for "good" timing (more forgiving)
const RED_DURATION = 800; // Too late window (more time to try)
const RESULT_DISPLAY_DURATION = 1000; // Result display (faster)

// Points (more forgiving)
const PERFECT_POINTS = 10;
const GOOD_POINTS = 5;
const FAILED_PENALTY = 2; // Reduced (was 4) - more forgiving
const MISSED_PENALTY = 3; // Reduced (was 6) - more forgiving

// Emojis - transformation results
const COCOON_EMOJI = '🥚'; // Chrysalis
const PERFECT_RESULT = '🦋'; // Beautiful emergence
const FAILED_RESULT = '💀'; // Failed transformation
const MISSED_RESULT = '💨'; // Never emerged

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'The Emergence — Birth | Caterpillar Ranch' },
    { name: 'description', content: 'Help them break free at the right moment. Their transformation depends on you.' },
  ];
}

export default function MetamorphosisQueueRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get('product');
  const shouldReduceMotion = useReducedMotion();

  const { addDiscount, removeDiscount, cart } = useCart();
  const game = useGameState(GAME_DURATION);

  const [cocoons, setCocoons] = useState<Cocoon[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);

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
    game.subtractPoints(MISSED_PENALTY);
    setMistakeCount((prev) => prev + 1);
    setCocoons(prev => prev.map(c => {
      if (c.id === cocoonId) {
        return {
          ...c,
          result: 'missed' as TransformResult,
          resultEmoji: MISSED_RESULT,
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
      let emoji = FAILED_RESULT;

      // Determine timing quality
      if (c.state === 'green') {
        // Perfect timing!
        result = 'perfect';
        points = PERFECT_POINTS;
        emoji = PERFECT_RESULT;
      } else if (c.state === 'pink' && timeSinceStateStart >= PINK_DURATION - GREEN_BUFFER) {
        // Good timing (within buffer before green)
        result = 'good';
        points = GOOD_POINTS;
        emoji = PERFECT_RESULT;
      } else if (c.state === 'red' && timeSinceStateStart <= GREEN_BUFFER) {
        // Good timing (within buffer after green)
        result = 'good';
        points = GOOD_POINTS;
        emoji = PERFECT_RESULT;
      } else {
        // Too early or too late - failed transformation
        result = 'failed';
        points = -FAILED_PENALTY;
        emoji = FAILED_RESULT;
        setMistakeCount((prev) => prev + 1);
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
    setMistakeCount(0);
    setShowResults(false);
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

    // Small delay to ensure cart state is persisted to localStorage before navigation
    setTimeout(() => {
      if (productSlug) {
        navigate(`/products/${productSlug}`);
      } else {
        navigate('/');
      }
    }, 50);
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

  // Progressive dread
  const dreadLevel = Math.min(mistakeCount * 0.06, 0.3);
  const dreadMessage = getDreadMessage(mistakeCount);

  return (
    <div
      className="min-h-screen bg-ranch-dark flex flex-col items-center justify-center p-4 transition-all duration-500"
      style={shouldReduceMotion ? {} : {
        backgroundColor: `rgba(26, 26, 26, ${1 + dreadLevel})`,
        filter: mistakeCount >= 3 ? `saturate(${1 - mistakeCount * 0.04})` : undefined,
      }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <p
            className="text-sm text-amber-500/70 uppercase tracking-widest mb-1 font-display-600"
          >
            {HORROR_COPY.games.metamorphosisQueue.careStage}
          </p>
          <h1
            className="text-3xl text-ranch-lime mb-2 font-display-800"
          >
            {HORROR_COPY.games.metamorphosisQueue.title}
          </h1>
          <p
            className="text-ranch-lavender text-lg font-display-600"
          >
            {HORROR_COPY.games.metamorphosisQueue.description}
          </p>
          {bestScore > 0 && (
            <p
              className="text-ranch-cyan text-lg mt-1 font-display-600"
            >
              Best: {bestScore}
            </p>
          )}
        </div>

        {/* Game UI - Before start */}
        {game.status === 'idle' && (
          <div className="text-center space-y-6">
            <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6">
              <p className="text-lg text-ranch-cream leading-relaxed text-center font-display-600 mb-4">
                {HORROR_COPY.games.metamorphosisQueue.instructions[0]}
              </p>

              {/* Visual Instructions - Color sequence */}
              <div className="flex justify-center items-center gap-1 my-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-ranch-purple rounded-lg" />
                  <span className="text-xs text-ranch-lavender mt-1">Wait</span>
                </div>
                <span className="text-ranch-cream/50">→</span>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-ranch-pink rounded-lg" />
                  <span className="text-xs text-ranch-lavender mt-1">Ready</span>
                </div>
                <span className="text-ranch-cream/50">→</span>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-ranch-lime rounded-lg ring-2 ring-ranch-lime shadow-[0_0_15px_rgba(50,205,50,0.5)]" />
                  <span className="text-xs text-ranch-lime mt-1 font-bold">TAP!</span>
                </div>
                <span className="text-ranch-cream/50">→</span>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-red-600 rounded-lg" />
                  <span className="text-xs text-ranch-pink mt-1">Late!</span>
                </div>
              </div>

              {/* Outcome examples */}
              <div className="grid grid-cols-2 gap-3 my-4">
                {/* Perfect timing */}
                <div className="bg-ranch-dark/50 rounded-lg p-3 border-2 border-ranch-lime/50">
                  <div className="flex justify-center mb-2">
                    <span className="text-4xl">{PERFECT_RESULT}</span>
                  </div>
                  <p className="text-ranch-lime font-display-700 text-sm">PERFECT</p>
                  <p className="text-ranch-cream/70 text-xs mt-1">Tap during GREEN</p>
                  <p className="text-ranch-cyan text-xs mt-1">+{PERFECT_POINTS} points</p>
                </div>

                {/* Failed/Missed */}
                <div className="bg-ranch-dark/50 rounded-lg p-3 border-2 border-ranch-pink/50">
                  <div className="flex justify-center gap-2 mb-2">
                    <span className="text-4xl">{FAILED_RESULT}</span>
                  </div>
                  <p className="text-ranch-pink font-display-700 text-sm">FAILED</p>
                  <p className="text-ranch-cream/70 text-xs mt-1">Wrong timing</p>
                  <p className="text-ranch-pink text-xs mt-1">-{FAILED_PENALTY} to -{MISSED_PENALTY} points</p>
                </div>
              </div>

              <p className="text-sm text-ranch-lavender/60 mt-4 font-display-500">
                {NUM_COCOONS} cocoons. Watch for GREEN!
              </p>
            </div>
            <button
              onClick={handleStartGame}
              className="w-full px-6 py-4 bg-ranch-lime text-ranch-dark rounded-lg text-lg hover:bg-ranch-cyan transition-colors font-display-700"
            >
              {HORROR_COPY.games.metamorphosisQueue.startButton}
            </button>
          </div>
        )}

        {/* Game UI - Playing */}
        {game.status === 'playing' && (
          <div className="space-y-4">
            {/* HUD */}
            <div className="flex gap-4">
              <GameTimer timeLeft={game.timeLeft} className="flex-1" />
              <GameScore score={game.score} showProgress={true} className="flex-1" />
            </div>

            {/* Progressive Dread Message */}
            <AnimatePresence>
              {dreadMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-ranch-pink/20 border border-ranch-pink/40 rounded-lg p-2 text-center"
                >
                  <p
                    className="text-ranch-pink text-sm font-display-600"
                  >
                    {dreadMessage}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

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
                  aria-label={`Cocoon ${cocoon.id + 1} - ${cocoon.state}`}
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
                              : 'text-ranch-lavender/70'
                          }`}
                        >
                          {cocoon.result === 'perfect'
                            ? `EMERGED! +${PERFECT_POINTS}`
                            : cocoon.result === 'good'
                            ? `GOOD! +${GOOD_POINTS}`
                            : cocoon.result === 'failed'
                            ? `FAILED -${FAILED_PENALTY}`
                            : `LOST -${MISSED_PENALTY}`}
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
            onRetry={handleStartGame}
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
