/**
 * The Culling — Protection Stage
 *
 * Theme: "The Chrysalis" — Protect the vulnerable from parasites
 *
 * Horror-themed whack-a-mole where players defend pre-chrysalis caterpillars
 * from invasive parasites that would corrupt their transformation.
 *
 * Difficulty tuned for:
 * - 15% discount: ~15-20% of players (very skilled, max 1-2 parasite misses)
 * - Moderate penalties for hitting good caterpillars (-4 pts)
 * - Faster spawn/visibility for pressure
 *
 * Mechanics:
 * - 25 second duration
 * - 3x3 grid of emergence holes
 * - Hit parasites (red eyes): +5 points
 * - Hit good caterpillars: -8 points (HARSH)
 * - Progressive dread as mistakes accumulate
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
import {
  InvasiveCaterpillar,
  GoodCaterpillar,
  SplatEffect,
} from '../lib/components/Games/sprites/Caterpillar';
import type { Route } from './+types/games.the-culling';

// Caterpillar types
type CaterpillarType = 'invasive' | 'good';

interface Caterpillar {
  id: number;
  holeIndex: number;
  type: CaterpillarType;
  isVisible: boolean;
}

// === DIFFICULTY SETTINGS (REBALANCED FOR MOBILE + FORGIVENESS) ===
const GAME_DURATION = 20; // seconds (shorter for mobile attention spans)
const APPEARANCE_INTERVAL = 750; // ms between spawns (slightly slower)
const VISIBILITY_DURATION = 1000; // ms caterpillar stays visible (more time to react)
const GOOD_CATERPILLAR_CHANCE = 0.3; // 30% chance of good caterpillar (fewer traps)

// Points (more forgiving)
const HIT_PARASITE_POINTS = 5; // Correct hit
const HIT_GOOD_PENALTY = 4; // Reduced penalty (was 8) - more forgiving

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'The Culling — Protection | Caterpillar Ranch' },
    {
      name: 'description',
      content: 'Protect the vulnerable from parasites. Prove your care.',
    },
  ];
}

export default function TheCullingRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get('product');
  const shouldReduceMotion = useReducedMotion();

  const { addDiscount, removeDiscount, cart } = useCart();
  const game = useGameState(GAME_DURATION);

  const [caterpillars, setCaterpillars] = useState<Caterpillar[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [splats, setSplats] = useState<{ id: number; holeIndex: number; color: string }[]>([]);
  const [mistakeCount, setMistakeCount] = useState(0);

  const nextCaterpillarId = useRef(0);
  const nextSplatId = useRef(0);
  const spawnTimerRef = useRef<number | undefined>(undefined);
  const caterpillarTimersRef = useRef<Map<number, number>>(new Map());

  // Load best score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('game:the-culling:best-score');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Save best score to localStorage
  useEffect(() => {
    if (game.score > bestScore) {
      setBestScore(game.score);
      localStorage.setItem('game:the-culling:best-score', game.score.toString());
    }
  }, [game.score, bestScore]);

  // Spawn caterpillar function
  const spawnCaterpillar = useCallback(() => {
    // Random hole (0-8)
    const holeIndex = Math.floor(Math.random() * 9);

    // Determine type
    const type: CaterpillarType =
      Math.random() < GOOD_CATERPILLAR_CHANCE ? 'good' : 'invasive';

    const id = nextCaterpillarId.current++;
    const newCaterpillar: Caterpillar = {
      id,
      holeIndex,
      type,
      isVisible: true,
    };

    setCaterpillars((prev) => [...prev, newCaterpillar]);

    // Auto-hide after visibility duration
    const hideTimer = window.setTimeout(() => {
      setCaterpillars((prev) => prev.filter((c) => c.id !== id));
      caterpillarTimersRef.current.delete(id);
    }, VISIBILITY_DURATION);

    caterpillarTimersRef.current.set(id, hideTimer);
  }, []);

  // Spawn caterpillars during gameplay
  useEffect(() => {
    if (game.status !== 'playing') {
      // Clear all timers when not playing
      if (spawnTimerRef.current) window.clearInterval(spawnTimerRef.current);
      caterpillarTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      caterpillarTimersRef.current.clear();
      setCaterpillars([]);
      return;
    }

    // Spawn caterpillars at intervals
    spawnTimerRef.current = window.setInterval(() => {
      spawnCaterpillar();
    }, APPEARANCE_INTERVAL);

    return () => {
      if (spawnTimerRef.current) window.clearInterval(spawnTimerRef.current);
    };
  }, [game.status, spawnCaterpillar]);

  // Show results when game completes
  useEffect(() => {
    if (game.status === 'completed') {
      setShowResults(true);
    }
  }, [game.status]);

  const handleCaterpillarClick = useCallback(
    (caterpillar: Caterpillar) => {
      if (game.status !== 'playing') return;

      // Add splat effect at this hole
      const splatId = nextSplatId.current++;
      const splatColor = caterpillar.type === 'invasive' ? '#4a3258' : '#ff3333';
      setSplats((prev) => [
        ...prev,
        { id: splatId, holeIndex: caterpillar.holeIndex, color: splatColor },
      ]);

      // Remove splat after animation
      setTimeout(() => {
        setSplats((prev) => prev.filter((s) => s.id !== splatId));
      }, 400);

      // Remove caterpillar immediately
      setCaterpillars((prev) => prev.filter((c) => c.id !== caterpillar.id));

      // Clear its hide timer
      const timer = caterpillarTimersRef.current.get(caterpillar.id);
      if (timer) {
        window.clearTimeout(timer);
        caterpillarTimersRef.current.delete(caterpillar.id);
      }

      // Apply score
      if (caterpillar.type === 'invasive') {
        game.addPoints(HIT_PARASITE_POINTS);
      } else {
        game.subtractPoints(HIT_GOOD_PENALTY);
        setMistakeCount((prev) => prev + 1);
      }
    },
    [game]
  );

  const handleStartGame = useCallback(() => {
    setMistakeCount(0);
    setShowResults(false);
    setCaterpillars([]);
    game.startGame();
  }, [game]);

  const handleApplyDiscount = useCallback(
    (discount: number) => {
      if (discount > 0 && productSlug) {
        // Remove existing discount for this product (replace, not accumulate)
        const existingDiscount = cart.discounts.find((d) => d.productId === productSlug);

        if (existingDiscount) {
          removeDiscount(existingDiscount.id);
        }

        // Add new discount
        addDiscount({
          id: `game-culling-${Date.now()}`,
          productId: productSlug,
          discountPercent: discount,
          gameType: 'culling',
          earnedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          applied: false,
        });
      }

      // Small delay to ensure cart state is persisted
      setTimeout(() => {
        if (productSlug) {
          navigate(`/products/${productSlug}`);
        } else {
          navigate('/');
        }
      }, 50);
    },
    [productSlug, cart.discounts, addDiscount, removeDiscount, navigate]
  );

  // Calculate background darkness based on mistakes (progressive dread)
  const dreadLevel = Math.min(mistakeCount * 0.08, 0.4); // Max 40% darker
  const dreadMessage = getDreadMessage(mistakeCount);

  return (
    <div
      className="min-h-screen bg-ranch-dark flex flex-col items-center justify-center p-4 transition-all duration-500"
      style={shouldReduceMotion ? {} : {
        backgroundColor: `rgba(26, 26, 26, ${1 + dreadLevel})`,
        filter: mistakeCount >= 3 ? `saturate(${1 - mistakeCount * 0.05})` : undefined,
      }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <p
            className="text-sm text-amber-500/70 uppercase tracking-widest mb-1 font-display-600"
          >
            {HORROR_COPY.games.theCulling.careStage}
          </p>
          <h1
            className="text-3xl text-ranch-lime mb-2 font-display-800"
          >
            {HORROR_COPY.games.theCulling.title}
          </h1>
          <p
            className="text-ranch-lavender text-lg font-display-600"
          >
            {HORROR_COPY.games.theCulling.description}
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
              <p
                className="text-lg text-ranch-cream leading-relaxed text-center font-display-600 mb-4"
              >
                {HORROR_COPY.games.theCulling.instructions[0]}
              </p>

              {/* Visual instruction examples */}
              <div className="grid grid-cols-2 gap-4 my-6">
                {/* Hit this - Invasive */}
                <div className="bg-ranch-dark/50 rounded-lg p-4 border-2 border-ranch-pink/50">
                  <div className="flex justify-center mb-2">
                    <div className="relative">
                      <InvasiveCaterpillar size={70} />
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-ranch-pink rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-ranch-pink font-display-700 text-sm">HIT THIS</p>
                  <p className="text-ranch-cream/70 text-xs mt-1">Red Eyes = Parasite</p>
                  <p className="text-ranch-lime text-xs mt-1">+{HIT_PARASITE_POINTS} points</p>
                </div>

                {/* Don't hit - Good */}
                <div className="bg-ranch-dark/50 rounded-lg p-4 border-2 border-ranch-lime/50">
                  <div className="flex justify-center mb-2">
                    <div className="relative">
                      <GoodCaterpillar size={70} />
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-ranch-dark border-2 border-ranch-lime rounded-full flex items-center justify-center">
                        <span className="text-ranch-lime text-xs font-bold">✓</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-ranch-lime font-display-700 text-sm">DON'T HIT</p>
                  <p className="text-ranch-cream/70 text-xs mt-1">Cyan Eyes = Protected</p>
                  <p className="text-ranch-pink text-xs mt-1">-{HIT_GOOD_PENALTY} points</p>
                </div>
              </div>

              <p
                className="text-sm text-ranch-lavender text-center font-display-500"
              >
                {HORROR_COPY.games.theCulling.instructions[1]}
              </p>
            </div>
            <button
              onClick={handleStartGame}
              className="w-full px-6 py-4 bg-ranch-lime text-ranch-dark rounded-lg text-lg hover:bg-ranch-cyan transition-colors font-display-700"
            >
              {HORROR_COPY.games.theCulling.startButton}
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

            {/* Game Board - 3x3 Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-ranch-purple/10 rounded-lg border-2 border-ranch-purple">
              {Array.from({ length: 9 }).map((_, index) => {
                const caterpillar = caterpillars.find(
                  (c) => c.holeIndex === index && c.isVisible
                );
                const splat = splats.find((s) => s.holeIndex === index);

                return (
                  <div
                    key={index}
                    className="aspect-square bg-ranch-dark border-2 border-ranch-purple/50 rounded-lg relative overflow-hidden"
                  >
                    {/* Hole */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-8 bg-ranch-purple/30 rounded-full shadow-inner" />
                    </div>

                    {/* Splat Effect */}
                    <AnimatePresence>
                      {splat && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                          <SplatEffect color={splat.color} size={80} />
                        </div>
                      )}
                    </AnimatePresence>

                    {/* Caterpillar */}
                    <AnimatePresence>
                      {caterpillar && (
                        <button
                          onClick={() => handleCaterpillarClick(caterpillar)}
                          className="absolute inset-0 flex items-center justify-center z-10 hover:scale-110 transition-transform cursor-pointer"
                          aria-label={
                            caterpillar.type === 'invasive'
                              ? 'Remove parasite'
                              : 'Protected caterpillar - do not touch!'
                          }
                        >
                          {caterpillar.type === 'invasive' ? (
                            <InvasiveCaterpillar size={55} />
                          ) : (
                            <GoodCaterpillar size={55} />
                          )}
                        </button>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-ranch-purple/20 border border-ranch-purple/40 rounded p-2">
                <p
                  className="text-ranch-pink font-bold mb-1 font-display"
                >
                  Red Eyes = Parasite
                </p>
                <p className="text-ranch-cream/70">Remove them! +{HIT_PARASITE_POINTS} pts</p>
              </div>
              <div className="bg-ranch-lime/10 border border-ranch-lime/40 rounded p-2">
                <p
                  className="text-ranch-lime font-bold mb-1 font-display"
                >
                  Cyan Eyes = Protected
                </p>
                <p className="text-ranch-cream/70">Don't touch! -{HIT_GOOD_PENALTY} pts</p>
              </div>
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
    </div>
  );
}
