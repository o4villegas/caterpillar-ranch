/**
 * Cursed Harvest - Memory Match Game
 *
 * Horror-themed memory card game with mutated crops from The Ranch
 * - 30 second duration
 * - 12 cards (6 pairs) in 4x3 grid
 * - Match pairs to earn points
 * - Speed bonus for quick matches
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { GameTimer } from '../lib/components/Games/GameTimer';
import { GameScore } from '../lib/components/Games/GameScore';
import { GameResults } from '../lib/components/Games/GameResults';
import { useGameState } from '../lib/components/Games/hooks/useGameState';
import { useCart } from '../lib/contexts/CartContext';
import { cn } from '../lib/utils';
import type { Route } from './+types/games.cursed-harvest';

// Card types - mutated crops
const CROPS = [
  { id: 'eyeball-tomato', emoji: '🍅', name: 'Eyeball Tomato' },
  { id: 'screaming-corn', emoji: '🌽', name: 'Screaming Corn' },
  { id: 'tendril-carrot', emoji: '🥕', name: 'Tendril Carrot' },
  { id: 'tooth-potato', emoji: '🥔', name: 'Tooth Potato' },
  { id: 'crying-onion', emoji: '🧅', name: 'Crying Onion' },
  { id: 'spine-cucumber', emoji: '🥒', name: 'Spine Cucumber' },
];

interface Card {
  uniqueId: number;
  cropId: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const GAME_DURATION = 30; // seconds
const MISMATCH_FLIP_DELAY = 600; // ms (25% faster - harder to remember)
const SPEED_BONUS_WINDOW = 2500; // ms - 2.5 seconds for speed bonus (17% harder)

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Cursed Harvest - Caterpillar Ranch' },
    { name: 'description', content: 'Match pairs of mutated crops!' }
  ];
}

export default function CursedHarvestRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get('product');

  const { addDiscount } = useCart();
  const game = useGameState(GAME_DURATION);

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [bestScore, setBestScore] = useState(0);

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
    const pairs = CROPS.flatMap((crop, index) => [
      {
        uniqueId: index * 2,
        cropId: crop.id,
        emoji: crop.emoji,
        isFlipped: false,
        isMatched: false,
      },
      {
        uniqueId: index * 2 + 1,
        cropId: crop.id,
        emoji: crop.emoji,
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
  const handleCardClick = useCallback((card: Card) => {
    if (game.status !== 'playing') return;
    if (processingRef.current) return;
    if (card.isFlipped || card.isMatched) return;
    if (flippedCards.length >= 2) return;

    // Flip the card
    setCards(prev =>
      prev.map(c =>
        c.uniqueId === card.uniqueId ? { ...c, isFlipped: true } : c
      )
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
      const firstCard = cards.find(c => c.uniqueId === firstId);
      const secondCard = cards.find(c => c.uniqueId === secondId);

      if (firstCard && secondCard && firstCard.cropId === secondCard.cropId) {
        // MATCH!
        const matchTime = Date.now() - (firstFlipTimeRef.current || 0);
        const speedBonus = matchTime <= SPEED_BONUS_WINDOW ? 2 : 0;

        game.addPoints(8 + speedBonus);

        // Mark as matched
        setCards(prev =>
          prev.map(c =>
            c.uniqueId === firstId || c.uniqueId === secondId
              ? { ...c, isMatched: true }
              : c
          )
        );

        setFlippedCards([]);
        firstFlipTimeRef.current = null;
        processingRef.current = false;
      } else {
        // MISMATCH - flip back after delay
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.uniqueId === firstId || c.uniqueId === secondId
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
          firstFlipTimeRef.current = null;
          processingRef.current = false;
        }, MISMATCH_FLIP_DELAY);
      }
    }
  }, [game, cards, flippedCards]);

  const handleStartGame = useCallback(() => {
    const shuffled = shuffleCards();
    setCards(shuffled);
    setFlippedCards([]);
    firstFlipTimeRef.current = null;
    processingRef.current = false;
    game.startGame();
  }, [game, shuffleCards]);

  const handleRetry = useCallback(() => {
    setShowResults(false);
    const shuffled = shuffleCards();
    setCards(shuffled);
    setFlippedCards([]);
    firstFlipTimeRef.current = null;
    processingRef.current = false;
    game.resetGame();
    setTimeout(() => game.startGame(), 100);
  }, [game, shuffleCards]);

  const handleApplyDiscount = useCallback((discount: number) => {
    if (discount > 0 && productSlug) {
      addDiscount({
        id: `game-harvest-${Date.now()}`,
        productId: productSlug,
        discountPercent: discount,
        gameType: 'harvest',
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
  }, [productSlug, addDiscount, navigate]);

  return (
    <div className="min-h-screen bg-ranch-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-ranch-lime mb-2">
            Cursed Harvest
          </h1>
          <p className="text-ranch-lavender text-sm">
            Match pairs of mutated crops from The Ranch's cursed garden
          </p>
          {bestScore > 0 && (
            <p className="text-ranch-cyan text-xs mt-1">
              Best Score: {bestScore}
            </p>
          )}
        </div>

        {/* Game UI - Before start */}
        {game.status === 'idle' && (
          <div className="text-center space-y-6">
            <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-8">
              <p className="text-lg text-ranch-cream leading-relaxed text-center">
                Match pairs of mutated crops
              </p>
              <p className="text-sm text-ranch-lavender mt-1 text-center">
                Find all pairs before time runs out
              </p>
            </div>
            <button
              onClick={handleStartGame}
              className="w-full px-6 py-4 bg-ranch-lime text-ranch-dark rounded-lg font-bold text-lg hover:bg-ranch-cyan transition-colors"
            >
              Start The Harvest
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

            {/* Game Board - 4x3 Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-ranch-purple/10 rounded-lg border-2 border-ranch-purple">
              {cards.map((card) => (
                <button
                  key={card.uniqueId}
                  onClick={() => handleCardClick(card)}
                  disabled={card.isFlipped || card.isMatched || processingRef.current}
                  className={cn(
                    'aspect-[3/4] rounded-lg transition-all duration-300',
                    'relative overflow-hidden',
                    card.isMatched && 'ring-2 ring-ranch-lime shadow-[0_0_20px_rgba(50,205,50,0.4)]',
                    !card.isFlipped && !card.isMatched && 'card-back',
                    card.isFlipped && 'card-front'
                  )}
                >
                  {/* Card Back */}
                  {!card.isFlipped && !card.isMatched && (
                    <div className="absolute inset-0 bg-ranch-purple border-2 border-ranch-lavender flex items-center justify-center card-pulse">
                      <div className="text-4xl opacity-30">👁️</div>
                    </div>
                  )}

                  {/* Card Front */}
                  {(card.isFlipped || card.isMatched) && (
                    <div className={cn(
                      'absolute inset-0 bg-gradient-to-br from-ranch-dark to-ranch-purple/80',
                      'border-2 flex items-center justify-center',
                      card.isMatched ? 'border-ranch-lime' : 'border-ranch-cyan'
                    )}>
                      <div className="text-5xl">{card.emoji}</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Game Results */}
        {showResults && (
          <GameResults
            score={game.score}
            onRetry={handleRetry}
            onApplyDiscount={handleApplyDiscount}
          />
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-organic {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.9; }
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
