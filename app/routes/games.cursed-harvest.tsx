/**
 * Cursed Harvest — Nourishment Stage
 *
 * Theme: "The Chrysalis" — Gather the nutrients they need
 *
 * Horror-themed memory match game where players gather the right nutrients
 * for caterpillars to fuel their transformation.
 *
 * Difficulty tuned for:
 * - 15% discount: ~15-20% of players (allows 2 mismatches OR 6 missed speed bonuses)
 * - Mismatch penalty (-4 pts)
 * - Faster flip-back on mismatch (harder to memorize)
 *
 * Mechanics:
 * - 30 second duration
 * - 12 cards (6 pairs) in 4x3 grid
 * - Match pair: +10 points (max 60 base)
 * - Speed bonus: +2 if matched within 3s (max 12 bonus)
 * - Mismatch: -4 points
 * - Total max: 72 points (headroom for errors)
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
import { cn } from '../lib/utils';
import { HORROR_COPY, getDreadMessage } from '../lib/constants/horror-copy';
import type { Route } from './+types/games.cursed-harvest';

// Nutrient types - what caterpillars need to transform
const NUTRIENTS = [
  { id: 'moonleaf', emoji: '🌿', name: 'Moonleaf' },
  { id: 'duskberry', emoji: '🫐', name: 'Duskberry' },
  { id: 'silkroot', emoji: '🥕', name: 'Silkroot' },
  { id: 'nightpetal', emoji: '🌸', name: 'Nightpetal' },
  { id: 'dewdrop', emoji: '💧', name: 'Dewdrop' },
  { id: 'stardust', emoji: '✨', name: 'Stardust' },
];

interface Card {
  uniqueId: number;
  nutrientId: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// === DIFFICULTY SETTINGS (REBALANCED FOR MOBILE + FORGIVENESS) ===
const GAME_DURATION = 20; // seconds (shorter for mobile attention spans)
const MISMATCH_FLIP_DELAY = 600; // ms (more time to memorize)
const SPEED_BONUS_WINDOW = 3000; // ms - 3 seconds for speed bonus (easier)

// Points (more forgiving)
// Max: 6 pairs × 10 = 60 base + 6 × 2 speed = 72 total
const MATCH_POINTS = 10;
const SPEED_BONUS_POINTS = 2;
const MISMATCH_PENALTY = 2; // Reduced (was 4) - more forgiving

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Cursed Harvest — Nourishment | Caterpillar Ranch' },
    { name: 'description', content: 'Gather the nutrients they need. Prove your care.' },
  ];
}

export default function CursedHarvestRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get('product');
  const shouldReduceMotion = useReducedMotion();

  const { addDiscount, removeDiscount, cart } = useCart();
  const game = useGameState(GAME_DURATION);

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);

  const firstFlipTimeRef = useRef<number | null>(null);
  const processingRef = useRef(false);

  // Initialize cards
  useEffect(() => {
    const shuffledCards = shuffleCards();
    setCards(shuffledCards);
  }, []);

  // Load best score
  useEffect(() => {
    const saved = localStorage.getItem('game:cursed-harvest:best-score');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Save best score
  useEffect(() => {
    if (game.score > bestScore) {
      setBestScore(game.score);
      localStorage.setItem('game:cursed-harvest:best-score', game.score.toString());
    }
  }, [game.score, bestScore]);

  // Show results when game completes
  useEffect(() => {
    if (game.status === 'completed') {
      setShowResults(true);
    }
  }, [game.status]);

  // Create and shuffle cards
  const shuffleCards = useCallback(() => {
    const pairs = NUTRIENTS.flatMap((nutrient, index) => [
      {
        uniqueId: index * 2,
        nutrientId: nutrient.id,
        emoji: nutrient.emoji,
        isFlipped: false,
        isMatched: false,
      },
      {
        uniqueId: index * 2 + 1,
        nutrientId: nutrient.id,
        emoji: nutrient.emoji,
        isFlipped: false,
        isMatched: false,
      },
    ]);

    // Fisher-Yates shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    return pairs;
  }, []);

  // Handle card click
  const handleCardClick = useCallback(
    (card: Card) => {
      if (game.status !== 'playing') return;
      if (processingRef.current) return;
      if (card.isFlipped || card.isMatched) return;
      if (flippedCards.length >= 2) return;

      // Flip the card
      setCards((prev) =>
        prev.map((c) => (c.uniqueId === card.uniqueId ? { ...c, isFlipped: true } : c))
      );

      const newFlippedCards = [...flippedCards, card.uniqueId];
      setFlippedCards(newFlippedCards);

      // Track first flip time for speed bonus
      if (newFlippedCards.length === 1) {
        firstFlipTimeRef.current = Date.now();
      }

      // Check for match when 2 cards are flipped
      if (newFlippedCards.length === 2) {
        processingRef.current = true;

        const [firstId, secondId] = newFlippedCards;
        const firstCard = cards.find((c) => c.uniqueId === firstId);
        const secondCard = cards.find((c) => c.uniqueId === secondId);

        if (firstCard && secondCard && firstCard.nutrientId === secondCard.nutrientId) {
          // MATCH!
          const matchTime = Date.now() - (firstFlipTimeRef.current || 0);
          const speedBonus = matchTime <= SPEED_BONUS_WINDOW ? SPEED_BONUS_POINTS : 0;

          game.addPoints(MATCH_POINTS + speedBonus);

          // Mark as matched
          setCards((prev) =>
            prev.map((c) =>
              c.uniqueId === firstId || c.uniqueId === secondId ? { ...c, isMatched: true } : c
            )
          );

          setFlippedCards([]);
          firstFlipTimeRef.current = null;
          processingRef.current = false;
        } else {
          // MISMATCH - apply penalty and flip back
          game.subtractPoints(MISMATCH_PENALTY);
          setMistakeCount((prev) => prev + 1);

          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.uniqueId === firstId || c.uniqueId === secondId ? { ...c, isFlipped: false } : c
              )
            );
            setFlippedCards([]);
            firstFlipTimeRef.current = null;
            processingRef.current = false;
          }, MISMATCH_FLIP_DELAY);
        }
      }
    },
    [game, cards, flippedCards]
  );

  const handleStartGame = useCallback(() => {
    const shuffled = shuffleCards();
    setCards(shuffled);
    setFlippedCards([]);
    setMistakeCount(0);
    setShowResults(false);
    firstFlipTimeRef.current = null;
    processingRef.current = false;
    game.startGame();
  }, [game, shuffleCards]);

  const handleApplyDiscount = useCallback(
    (discount: number) => {
      if (discount > 0 && productSlug) {
        const existingDiscount = cart.discounts.find((d) => d.productId === productSlug);

        if (existingDiscount) {
          removeDiscount(existingDiscount.id);
        }

        addDiscount({
          id: `game-harvest-${Date.now()}`,
          productId: productSlug,
          discountPercent: discount,
          gameType: 'harvest',
          earnedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          applied: false,
        });
      }

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
            {HORROR_COPY.games.cursedHarvest.careStage}
          </p>
          <h1
            className="text-3xl text-ranch-lime mb-2 font-display-800"
          >
            {HORROR_COPY.games.cursedHarvest.title}
          </h1>
          <p
            className="text-ranch-lavender text-lg font-display-600"
          >
            {HORROR_COPY.games.cursedHarvest.description}
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
                {HORROR_COPY.games.cursedHarvest.instructions[0]}
              </p>

              {/* Visual instruction examples */}
              <div className="grid grid-cols-2 gap-3 my-4">
                {/* How to play */}
                <div className="bg-ranch-dark/50 rounded-lg p-3 border-2 border-ranch-cyan/50">
                  <div className="flex justify-center items-center gap-2 mb-2">
                    <div className="w-12 h-14 bg-ranch-purple border-2 border-ranch-lavender rounded-lg flex items-center justify-center">
                      <span className="text-xl opacity-40">🌙</span>
                    </div>
                    <span className="text-ranch-cyan text-lg">→</span>
                    <div className="w-12 h-14 bg-ranch-dark border-2 border-ranch-cyan rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🌿</span>
                    </div>
                  </div>
                  <p className="text-ranch-cyan font-display-700 text-sm">FLIP CARDS</p>
                  <p className="text-ranch-cream/70 text-xs mt-1">Tap to reveal nutrients</p>
                </div>

                {/* Match pairs */}
                <div className="bg-ranch-dark/50 rounded-lg p-3 border-2 border-ranch-lime/50">
                  <div className="flex justify-center items-center gap-1 mb-2">
                    <div className="w-12 h-14 bg-ranch-dark border-2 border-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                      <span className="text-2xl">🫐</span>
                    </div>
                    <div className="w-12 h-14 bg-ranch-dark border-2 border-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                      <span className="text-2xl">🫐</span>
                    </div>
                  </div>
                  <p className="text-ranch-lime font-display-700 text-sm">MATCH PAIRS</p>
                  <p className="text-ranch-cream/70 text-xs mt-1">+{MATCH_POINTS} points per match</p>
                </div>
              </div>

              {/* Nutrients preview */}
              <div className="bg-ranch-dark/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-ranch-lavender/60 uppercase tracking-wider mb-2">Nutrients to Find</p>
                <div className="flex justify-center gap-2 text-2xl">
                  {NUTRIENTS.map((n) => (
                    <span key={n.id} title={n.name}>{n.emoji}</span>
                  ))}
                </div>
              </div>

              <p
                className="text-sm text-ranch-lavender text-center font-display-600"
              >
                {HORROR_COPY.games.cursedHarvest.instructions[1]}
              </p>
              <p
                className="text-sm text-ranch-pink/70 mt-2 text-center font-display-500"
              >
                ⚠️ Mismatch: -{MISMATCH_PENALTY} points | Speed bonus (&lt;3s): +{SPEED_BONUS_POINTS}
              </p>
            </div>
            <button
              onClick={handleStartGame}
              className="w-full px-6 py-4 bg-ranch-lime text-ranch-dark rounded-lg text-lg hover:bg-ranch-cyan transition-colors font-display-700"
            >
              {HORROR_COPY.games.cursedHarvest.startButton}
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

            {/* Game Board - 4x3 Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-ranch-purple/10 rounded-lg border-2 border-ranch-purple">
              {cards.map((card, index) => (
                <button
                  key={card.uniqueId}
                  onClick={() => handleCardClick(card)}
                  disabled={card.isFlipped || card.isMatched || processingRef.current}
                  aria-label={card.isMatched ? `${card.emoji} matched` : card.isFlipped ? card.emoji : `Card ${index + 1}`}
                  className={cn(
                    'aspect-[3/4] rounded-lg transition-all duration-300',
                    'relative overflow-hidden',
                    card.isMatched &&
                      'ring-2 ring-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.4)]',
                    !card.isFlipped && !card.isMatched && 'card-back',
                    card.isFlipped && 'card-front'
                  )}
                >
                  {/* Card Back */}
                  {!card.isFlipped && !card.isMatched && (
                    <div className="absolute inset-0 bg-ranch-purple border-2 border-ranch-lavender flex items-center justify-center card-pulse">
                      <div className="text-3xl opacity-40">🌙</div>
                    </div>
                  )}

                  {/* Card Front */}
                  {(card.isFlipped || card.isMatched) && (
                    <div
                      className={cn(
                        'absolute inset-0 bg-gradient-to-br from-ranch-dark to-ranch-purple/80',
                        'border-2 flex items-center justify-center',
                        card.isMatched ? 'border-amber-500' : 'border-ranch-cyan'
                      )}
                    >
                      <div className="text-4xl">{card.emoji}</div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Point Info */}
            <div className="text-center text-xs text-ranch-lavender/60">
              <span>Match: +{MATCH_POINTS} | </span>
              <span>Speed (&lt;3s): +{SPEED_BONUS_POINTS} | </span>
              <span className="text-ranch-pink/70">Mismatch: -{MISMATCH_PENALTY}</span>
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
        @keyframes pulse-organic {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.85; }
        }

        @keyframes card-flip-in {
          0% { transform: rotateY(90deg); opacity: 0; }
          100% { transform: rotateY(0deg); opacity: 1; }
        }

        .card-pulse {
          animation: pulse-organic 3s ease-in-out infinite;
        }

        .card-front {
          animation: card-flip-in 0.3s ease-out;
        }

        .card-back {
          animation: card-flip-in 0.3s ease-out reverse;
        }
      `}</style>
    </div>
  );
}
