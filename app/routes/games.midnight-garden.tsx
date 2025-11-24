/**
 * Midnight Garden — Divination Stage
 *
 * Theme: "The Chrysalis" — Read the signs of what they will become
 *
 * Horror-themed reflex game where players divine good omens from corruption.
 * The garden reveals what the transformation will bring.
 *
 * Difficulty tuned for:
 * - 15% discount: ~15-20% of players (15+ good, 0-1 bad clicks)
 * - Harsh penalty for clicking bad signs (-6 pts)
 * - Higher bad sign ratio (45%)
 * - Faster spawning and shorter visibility
 *
 * Mechanics:
 * - 25 second duration
 * - Click good omens (hope, growth)
 * - Avoid bad signs (corruption, decay)
 * - At 15+ points, bad signs start disguising
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { GameTimer } from '../lib/components/Games/GameTimer';
import { GameScore } from '../lib/components/Games/GameScore';
import { GameResults } from '../lib/components/Games/GameResults';
import { useGameState } from '../lib/components/Games/hooks/useGameState';
import { useCart } from '../lib/contexts/CartContext';
import { HORROR_COPY, getDreadMessage } from '../lib/constants/horror-copy';
import type { Route } from './+types/games.midnight-garden';

// Good omens (click these!) - signs of successful transformation
const GOOD_OMENS = [
  { id: 'light', emoji: '✨', name: 'Light', color: 'text-ranch-cyan' },
  { id: 'hope', emoji: '🌸', name: 'Hope', color: 'text-ranch-lime' },
  { id: 'dreamer', emoji: '🦋', name: 'Dreamer', color: 'text-ranch-lavender' },
];

// Bad signs (avoid these!) - signs of failed transformation
const BAD_SIGNS = [
  { id: 'decay', emoji: '🕷️', name: 'Decay', color: 'text-ranch-pink' },
  { id: 'rot', emoji: '🥀', name: 'Rot', color: 'text-gray-600' },
  { id: 'failed', emoji: '💀', name: 'Failed', color: 'text-red-600' },
];

interface Item {
  id: number;
  type: 'good' | 'bad';
  omenId: string;
  emoji: string;
  name: string;
  color: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  spawnTime: number;
  clicked: boolean;
  result?: 'success' | 'penalty'; // For visual feedback
}

// === DIFFICULTY SETTINGS (TUNED FOR ~15-20% MAX DISCOUNT) ===
const GAME_DURATION = 25; // seconds
const ITEM_LIFETIME = 1000; // ms - items visible for 1s (faster)
const SPAWN_INTERVAL = 450; // ms - spawn every 0.45s (faster pressure)
const MIN_ITEMS = 2; // minimum items on screen
const MAX_ITEMS = 5; // maximum items on screen (more chaos)
const CONFUSION_THRESHOLD = 12; // points - disguising starts earlier
const BAD_SIGN_CHANCE = 0.45; // 45% chance of bad sign (harder)

// Points
const GOOD_OMEN_POINTS = 4;
const BAD_SIGN_PENALTY = 6; // Harsh penalty
const MISSED_OMEN_PENALTY = 2; // Harsher missed penalty

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Midnight Garden — Divination | Caterpillar Ranch' },
    { name: 'description', content: 'Read the signs of what they will become. Prove your care.' },
  ];
}

export default function MidnightGardenRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get('product');

  const { addDiscount, removeDiscount, cart } = useCart();
  const game = useGameState(GAME_DURATION);

  const [items, setItems] = useState<Item[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);

  const nextItemId = useRef(0);
  const spawnTimerRef = useRef<number | undefined>(undefined);
  const lifetimeTimersRef = useRef<Map<number, number>>(new Map());

  // Load best score
  useEffect(() => {
    const saved = localStorage.getItem('game:midnight-garden:best-score');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Save best score
  useEffect(() => {
    if (game.score > bestScore) {
      setBestScore(game.score);
      localStorage.setItem('game:midnight-garden:best-score', game.score.toString());
    }
  }, [game.score, bestScore]);

  // Show results when game completes
  useEffect(() => {
    if (game.status === 'completed') {
      setShowResults(true);
    }
  }, [game.status]);

  // Spawn item function
  const spawnItem = useCallback(() => {
    // Don't spawn if we're at max items
    const activeItems = items.filter(item => !item.clicked);
    if (activeItems.length >= MAX_ITEMS) return;

    // Random type (55% good, 45% bad for harder gameplay)
    const isGood = Math.random() >= BAD_SIGN_CHANCE;
    const pool = isGood ? GOOD_OMENS : BAD_SIGNS;
    const omen = pool[Math.floor(Math.random() * pool.length)];

    // Random position (with padding from edges)
    const x = 10 + Math.random() * 80; // 10-90%
    const y = 10 + Math.random() * 70; // 10-80% (leave room at bottom)

    const id = nextItemId.current++;
    const newItem: Item = {
      id,
      type: isGood ? 'good' : 'bad',
      omenId: omen.id,
      emoji: omen.emoji,
      name: omen.name,
      color: omen.color,
      x,
      y,
      spawnTime: Date.now(),
      clicked: false,
    };

    setItems(prev => [...prev, newItem]);

    // Set lifetime timer - item fades after ITEM_LIFETIME
    const lifetimeTimer = window.setTimeout(() => {
      setItems(prev => prev.map(item => {
        if (item.id === id && !item.clicked) {
          // Missed good omen - penalty (harsher)
          if (item.type === 'good') {
            game.subtractPoints(MISSED_OMEN_PENALTY);
            setMistakeCount(m => m + 1);
          }
          return { ...item, clicked: true, result: undefined };
        }
        return item;
      }));

      // Remove from DOM after fade animation (300ms)
      setTimeout(() => {
        setItems(prev => prev.filter(item => item.id !== id));
        lifetimeTimersRef.current.delete(id);
      }, 300);
    }, ITEM_LIFETIME);

    lifetimeTimersRef.current.set(id, lifetimeTimer);
  }, [items, game]);

  // Spawn items during gameplay
  useEffect(() => {
    if (game.status !== 'playing') {
      // Clear all timers when not playing
      if (spawnTimerRef.current) window.clearInterval(spawnTimerRef.current);
      lifetimeTimersRef.current.forEach(timer => window.clearTimeout(timer));
      lifetimeTimersRef.current.clear();
      setItems([]);
      return;
    }

    // Spawn initial items immediately
    for (let i = 0; i < MIN_ITEMS; i++) {
      setTimeout(() => spawnItem(), i * 200); // Stagger initial spawns
    }

    // Spawn items at intervals
    spawnTimerRef.current = window.setInterval(() => {
      spawnItem();
    }, SPAWN_INTERVAL);

    return () => {
      if (spawnTimerRef.current) window.clearInterval(spawnTimerRef.current);
      lifetimeTimersRef.current.forEach(timer => window.clearTimeout(timer));
      lifetimeTimersRef.current.clear();
    };
  }, [game.status, spawnItem]);

  // Handle item click
  const handleItemClick = useCallback((itemId: number) => {
    if (game.status !== 'playing') return;

    setItems(prev => prev.map(item => {
      if (item.id === itemId && !item.clicked) {
        // Clear lifetime timer since item was clicked
        const timer = lifetimeTimersRef.current.get(itemId);
        if (timer) {
          window.clearTimeout(timer);
          lifetimeTimersRef.current.delete(itemId);
        }

        if (item.type === 'good') {
          // Good omen clicked - success!
          game.addPoints(GOOD_OMEN_POINTS);
          return { ...item, clicked: true, result: 'success' };
        } else {
          // Bad sign clicked - penalty!
          game.subtractPoints(BAD_SIGN_PENALTY);
          setMistakeCount(m => m + 1);
          return { ...item, clicked: true, result: 'penalty' };
        }
      }
      return item;
    }));

    // Remove clicked item after feedback animation (500ms)
    setTimeout(() => {
      setItems(prev => prev.filter(item => item.id !== itemId));
    }, 500);
  }, [game]);

  const handleStartGame = useCallback(() => {
    setItems([]);
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
        id: `game-garden-${Date.now()}`,
        productId: productSlug,
        discountPercent: discount,
        gameType: 'garden',
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

  // Determine if confusion mode is active (bad signs disguise as good)
  const confusionActive = game.score >= CONFUSION_THRESHOLD;

  // Progressive dread
  const dreadLevel = Math.min(mistakeCount * 0.06, 0.3);
  const dreadMessage = getDreadMessage(mistakeCount);

  return (
    <div
      className="min-h-screen bg-ranch-dark flex flex-col items-center justify-center p-4 transition-all duration-500"
      style={{
        backgroundColor: `rgba(26, 26, 26, ${1 + dreadLevel})`,
        filter: mistakeCount >= 3 ? `saturate(${1 - mistakeCount * 0.04})` : undefined,
      }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <p
            className="text-sm text-amber-500/70 uppercase tracking-widest mb-1"
            style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}
          >
            {HORROR_COPY.games.midnightGarden.careStage}
          </p>
          <h1
            className="text-3xl text-ranch-lime mb-2"
            style={{ fontFamily: 'Tourney, cursive', fontWeight: 800 }}
          >
            {HORROR_COPY.games.midnightGarden.title}
          </h1>
          <p
            className="text-ranch-lavender text-lg"
            style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}
          >
            {HORROR_COPY.games.midnightGarden.description}
          </p>
          {bestScore > 0 && (
            <p
              className="text-ranch-cyan text-lg mt-1"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}
            >
              Best: {bestScore}
            </p>
          )}
        </div>

        {/* Game UI - Before start */}
        {game.status === 'idle' && (
          <div className="text-center space-y-6">
            <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-8">
              <p
                className="text-lg text-ranch-cream leading-relaxed text-center"
                style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}
              >
                {HORROR_COPY.games.midnightGarden.instructions[0]}
              </p>
              <p
                className="text-lg text-ranch-lavender mt-2 text-center"
                style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}
              >
                {HORROR_COPY.games.midnightGarden.instructions[1]}
              </p>
              <p
                className="text-sm text-ranch-pink/70 mt-4 text-center"
                style={{ fontFamily: 'Tourney, cursive', fontWeight: 500 }}
              >
                Warning: Clicking bad signs costs {BAD_SIGN_PENALTY} points.
              </p>
            </div>
            <button
              onClick={handleStartGame}
              className="w-full px-6 py-4 bg-ranch-lime text-ranch-dark rounded-lg text-lg hover:bg-ranch-cyan transition-colors"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
            >
              {HORROR_COPY.games.midnightGarden.startButton}
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
                    className="text-ranch-pink text-sm"
                    style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}
                  >
                    {dreadMessage}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confusion warning */}
            {confusionActive && (
              <div className="bg-amber-500/20 border border-amber-500/40 rounded-lg p-2 text-center">
                <p
                  className="text-amber-400 text-sm"
                  style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}
                >
                  ⚠️ The garden deceives. Bad signs wear good masks.
                </p>
              </div>
            )}

            {/* Game Area - Night garden with spawning items */}
            <div className="relative h-96 bg-gradient-to-b from-ranch-purple/20 to-ranch-dark rounded-lg border-2 border-ranch-purple overflow-hidden">
              {/* Background fog effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-ranch-purple/10 via-transparent to-transparent pointer-events-none" />

              {/* Spawning items */}
              {items.map((item) => {
                // Apply confusion styling to bad signs when score >= 15
                const isDisguised = confusionActive && item.type === 'bad';
                const displayColor = isDisguised
                  ? 'text-ranch-lime opacity-80' // Bad signs look like good omens
                  : item.color;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    disabled={item.clicked}
                    className={`absolute transition-all duration-300 ${
                      item.clicked
                        ? 'opacity-0 scale-0'
                        : 'opacity-100 scale-100 animate-fade-in'
                    }`}
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      transform: 'translate(-50%, -50%)',
                      minWidth: '48px', // WCAG AAA touch target size
                      minHeight: '48px',
                    }}
                    aria-label={item.name}
                  >
                    <div
                      className={`text-4xl ${displayColor} ${
                        item.result === 'success'
                          ? 'animate-success-pulse'
                          : item.result === 'penalty'
                          ? 'animate-penalty-shake'
                          : item.type === 'good'
                          ? 'animate-gentle-float'
                          : 'animate-twitch'
                      }`}
                    >
                      {item.emoji}
                      {/* Visual feedback */}
                      {item.result === 'success' && (
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-ranch-lime text-lg font-bold">
                          +{GOOD_OMEN_POINTS}
                        </span>
                      )}
                      {item.result === 'penalty' && (
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-ranch-pink text-lg font-bold">
                          -{BAD_SIGN_PENALTY}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-ranch-lime/10 border border-ranch-lime/40 rounded p-2">
                <p
                  className="text-ranch-lime font-bold mb-1"
                  style={{ fontFamily: 'Tourney, cursive' }}
                >
                  Good Signs
                </p>
                <p className="text-ranch-cream/70">Click these! +{GOOD_OMEN_POINTS} pts</p>
              </div>
              <div className="bg-ranch-pink/10 border border-ranch-pink/40 rounded p-2">
                <p
                  className="text-ranch-pink font-bold mb-1"
                  style={{ fontFamily: 'Tourney, cursive' }}
                >
                  Bad Signs
                </p>
                <p className="text-ranch-cream/70">Avoid! -{BAD_SIGN_PENALTY} pts</p>
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

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes gentle-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes twitch {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-5deg);
          }
          75% {
            transform: rotate(5deg);
          }
        }

        @keyframes success-pulse {
          0%, 100% {
            transform: scale(1);
            filter: brightness(1);
          }
          50% {
            transform: scale(1.3);
            filter: brightness(1.5);
          }
        }

        @keyframes penalty-shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-8px);
          }
          75% {
            transform: translateX(8px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        .animate-gentle-float {
          animation: gentle-float 2s ease-in-out infinite;
        }

        .animate-twitch {
          animation: twitch 0.4s ease-in-out infinite;
        }

        .animate-success-pulse {
          animation: success-pulse 0.5s ease-out forwards;
        }

        .animate-penalty-shake {
          animation: penalty-shake 0.3s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}
