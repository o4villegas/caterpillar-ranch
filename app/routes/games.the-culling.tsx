/**
 * The Culling - Whack-A-Mole Game
 *
 * Horror-themed game where players "cull" invasive caterpillars
 * - 25 second duration
 * - 3x3 grid of holes
 * - Hit invasive caterpillars: +5 points
 * - Hit good caterpillars: -3 points (penalty)
 * - Tuned for high success rate: 40% discount achievable by ~90% of players
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { GameTimer } from '../lib/components/Games/GameTimer';
import { GameScore } from '../lib/components/Games/GameScore';
import { GameResults } from '../lib/components/Games/GameResults';
import { useGameState } from '../lib/components/Games/hooks/useGameState';
import { getDiscountResult } from '../lib/components/Games/utils/scoreConversion';
import { useCart } from '../lib/contexts/CartContext';
import { HORROR_COPY } from '../lib/constants/horror-copy';
import type { Route } from './+types/games.the-culling';

// Caterpillar types
type CaterpillarType = 'invasive' | 'good';

interface Caterpillar {
  id: number;
  holeIndex: number;
  type: CaterpillarType;
  isVisible: boolean;
}

const GAME_DURATION = 25; // seconds
const APPEARANCE_INTERVAL = 700; // ms between spawns (12% faster)
const VISIBILITY_DURATION = 1000; // ms caterpillar stays visible (17% faster)
const GOOD_CATERPILLAR_CHANCE = 0.25; // 25% chance of good caterpillar (more tricky)

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'The Culling - Caterpillar Ranch' },
    { name: 'description', content: 'Cull the invasive caterpillars!' }
  ];
}

export default function TheCullingRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get('product');

  const { addDiscount, removeDiscount, cart } = useCart();
  const game = useGameState(GAME_DURATION);

  const [caterpillars, setCaterpillars] = useState<Caterpillar[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  const nextCaterpillarId = useRef(0);
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
    const type: CaterpillarType = Math.random() < GOOD_CATERPILLAR_CHANCE ? 'good' : 'invasive';

    const id = nextCaterpillarId.current++;
    const newCaterpillar: Caterpillar = {
      id,
      holeIndex,
      type,
      isVisible: true
    };

    setCaterpillars(prev => [...prev, newCaterpillar]);

    // Auto-hide after visibility duration
    const hideTimer = window.setTimeout(() => {
      setCaterpillars(prev => prev.filter(c => c.id !== id));
      caterpillarTimersRef.current.delete(id);
    }, VISIBILITY_DURATION);

    caterpillarTimersRef.current.set(id, hideTimer);
  }, []);

  // Spawn caterpillars during gameplay
  useEffect(() => {
    if (game.status !== 'playing') {
      // Clear all timers when not playing
      if (spawnTimerRef.current) window.clearInterval(spawnTimerRef.current);
      caterpillarTimersRef.current.forEach(timer => window.clearTimeout(timer));
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

  const handleCaterpillarClick = useCallback((caterpillar: Caterpillar) => {
    if (game.status !== 'playing') return;

    // Remove caterpillar immediately
    setCaterpillars(prev => prev.filter(c => c.id !== caterpillar.id));

    // Clear its hide timer
    const timer = caterpillarTimersRef.current.get(caterpillar.id);
    if (timer) {
      window.clearTimeout(timer);
      caterpillarTimersRef.current.delete(caterpillar.id);
    }

    // Apply score
    if (caterpillar.type === 'invasive') {
      game.addPoints(5); // Correct hit
    } else {
      game.subtractPoints(3); // Penalty for hitting good caterpillar
    }
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
        id: `game-culling-${Date.now()}`,
        productId: productSlug,
        discountPercent: discount,
        gameType: 'culling',
        earnedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        applied: false
      });
    }

    // Return to product page
    if (productSlug) {
      navigate(`/products/${productSlug}`);
    } else {
      navigate('/');
    }
  }, [productSlug, cart.discounts, addDiscount, removeDiscount, navigate]);

  return (
    <div className="min-h-screen bg-ranch-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl text-ranch-lime mb-2" style={{ fontFamily: 'Tourney, cursive', fontWeight: 800 }}>
            The Culling
          </h1>
          <p className="text-ranch-lavender text-lg" style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}>
            Tap invasive caterpillars (red eyes) before they burrow!
          </p>
          {bestScore > 0 && (
            <p className="text-ranch-cyan text-lg mt-1" style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}>
              Best Score: {bestScore}
            </p>
          )}
        </div>

        {/* Game UI - Before start */}
        {game.status === 'idle' && (
          <div className="text-center space-y-6">
            <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-8">
              <p className="text-lg text-ranch-cream leading-relaxed text-center" style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}>
                {HORROR_COPY.games.theCulling.instructions[0]}
              </p>
              <p className="text-lg text-ranch-lavender mt-1 text-center" style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}>
                {HORROR_COPY.games.theCulling.instructions[1]}
              </p>
            </div>
            <button
              onClick={() => game.startGame()}
              className="w-full px-6 py-4 bg-ranch-lime text-ranch-dark rounded-lg text-lg hover:bg-ranch-cyan transition-colors"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
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

            {/* Game Board - 3x3 Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-ranch-purple/10 rounded-lg border-2 border-ranch-purple">
              {Array.from({ length: 9 }).map((_, index) => {
                const caterpillar = caterpillars.find(
                  c => c.holeIndex === index && c.isVisible
                );

                return (
                  <div
                    key={index}
                    className="aspect-square bg-ranch-dark border-2 border-ranch-purple/50 rounded-lg relative overflow-hidden"
                  >
                    {/* Hole */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-8 bg-ranch-purple/30 rounded-full" />
                    </div>

                    {/* Caterpillar */}
                    {caterpillar && (
                      <button
                        onClick={() => handleCaterpillarClick(caterpillar)}
                        className="absolute inset-0 flex items-center justify-center caterpillar-pop-up"
                      >
                        <div className="text-5xl relative">
                          🐛
                          {/* Eyes overlay */}
                          <div className={`absolute inset-0 flex items-center justify-center text-xl ${
                            caterpillar.type === 'invasive' ? 'text-red-500' : 'text-green-500'
                          }`}>
                            👀
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                );
              })}
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
        @keyframes pop-up {
          0% { transform: translateY(100%); opacity: 0; }
          20% { transform: translateY(-10%); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }

        .caterpillar-pop-up {
          animation: pop-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
