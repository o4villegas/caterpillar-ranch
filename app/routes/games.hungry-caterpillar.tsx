/**
 * The Final Feeding — Preparation Stage
 *
 * Theme: "The Chrysalis" — The last meal before the dark
 *
 * Horror-themed snake game where the caterpillar must gather enough
 * nourishment to survive the transformation inside the chrysalis.
 *
 * Difficulty tuned for:
 * - 15% discount: ~15-20% of players (10+ food, no collision)
 * - Collision = instant failure (harsh)
 * - Faster movement speed
 *
 * Mechanics:
 * - 45 second duration
 * - Classic snake with arrow keys + swipe
 * - Gather nourishment (leaves) to grow
 * - Transform at the end if survived
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { GameTimer } from '../lib/components/Games/GameTimer';
import { GameScore } from '../lib/components/Games/GameScore';
import { GameResults } from '../lib/components/Games/GameResults';
import { useGameState } from '../lib/components/Games/hooks/useGameState';
import { useCart } from '../lib/contexts/CartContext';
import { HORROR_COPY } from '../lib/constants/horror-copy';
import type { Route } from './+types/games.hungry-caterpillar';

// === DIFFICULTY SETTINGS (TUNED FOR ~15-20% MAX DISCOUNT) ===
const GRID_SIZE = 15; // 15x15 grid
const CELL_SIZE = 20; // pixels
const GAME_DURATION = 45; // seconds
const MOVE_INTERVAL = 100; // ms between moves (faster - harder)
const INITIAL_LENGTH = 3;

// Points
const FOOD_POINTS = 4; // Slightly reduced from 5
const LENGTH_BONUS = 2; // Per segment at end
const PERFECT_BONUS = 15; // 10+ food without collision

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Position {
  x: number;
  y: number;
}

interface GameState {
  snake: Position[];
  direction: Direction;
  food: Position | null;
  gameOver: boolean;
  foodEaten: number;
  showTransformation: boolean;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'The Final Feeding — Preparation | Caterpillar Ranch' },
    { name: 'description', content: 'The last meal before the dark. Prove your care.' },
  ];
}

export default function HungryCaterpillarRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get('product');

  const { addDiscount, removeDiscount, cart } = useCart();
  const game = useGameState(GAME_DURATION);

  const [gameState, setGameState] = useState<GameState>({
    snake: [
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 },
    ],
    direction: 'RIGHT',
    food: { x: 10, y: 10 },
    gameOver: false,
    foodEaten: 0,
    showTransformation: false,
  });

  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [showResults, setShowResults] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [touchStart, setTouchStart] = useState<Position | null>(null);

  const moveIntervalRef = useRef<number | undefined>(undefined);

  // Load best score
  useEffect(() => {
    const saved = localStorage.getItem('game:hungry-caterpillar:best-score');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Save best score
  useEffect(() => {
    if (game.score > bestScore) {
      setBestScore(game.score);
      localStorage.setItem('game:hungry-caterpillar:best-score', game.score.toString());
    }
  }, [game.score, bestScore]);

  // Generate random food position
  const generateFood = useCallback((snake: Position[]): Position => {
    let newFood: Position;
    let attempts = 0;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      attempts++;
    } while (
      attempts < 100 &&
      snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)
    );
    return newFood;
  }, []);

  // Move snake
  const moveSnake = useCallback(() => {
    if (gameState.gameOver || game.status !== 'playing') return;

    setGameState(prev => {
      const newSnake = [...prev.snake];
      const head = { ...newSnake[0] };

      // Apply direction
      switch (nextDirection) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return { ...prev, gameOver: true };
      }

      // Check self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        return { ...prev, gameOver: true };
      }

      // Add new head
      newSnake.unshift(head);

      // Check food collision
      if (prev.food && head.x === prev.food.x && head.y === prev.food.y) {
        // Ate food! Don't remove tail (snake grows)
        const newFoodCount = prev.foodEaten + 1;
        game.addPoints(FOOD_POINTS);

        return {
          ...prev,
          snake: newSnake,
          food: generateFood(newSnake),
          direction: nextDirection,
          foodEaten: newFoodCount,
        };
      }

      // Remove tail (normal movement)
      newSnake.pop();

      return {
        ...prev,
        snake: newSnake,
        direction: nextDirection,
      };
    });
  }, [gameState.gameOver, game, nextDirection, generateFood]);

  // Game loop
  useEffect(() => {
    if (game.status !== 'playing' || gameState.gameOver) {
      if (moveIntervalRef.current) {
        window.clearInterval(moveIntervalRef.current);
      }
      return;
    }

    moveIntervalRef.current = window.setInterval(moveSnake, MOVE_INTERVAL);

    return () => {
      if (moveIntervalRef.current) {
        window.clearInterval(moveIntervalRef.current);
      }
    };
  }, [game.status, gameState.gameOver, moveSnake]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (game.status !== 'playing' || gameState.gameOver) return;

      const key = e.key;
      const currentDir = gameState.direction;

      // Prevent reversing direction
      if (key === 'ArrowUp' && currentDir !== 'DOWN') {
        setNextDirection('UP');
        e.preventDefault();
      } else if (key === 'ArrowDown' && currentDir !== 'UP') {
        setNextDirection('DOWN');
        e.preventDefault();
      } else if (key === 'ArrowLeft' && currentDir !== 'RIGHT') {
        setNextDirection('LEFT');
        e.preventDefault();
      } else if (key === 'ArrowRight' && currentDir !== 'LEFT') {
        setNextDirection('RIGHT');
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game.status, gameState.gameOver, gameState.direction]);

  // Handle touch controls (swipe)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart || game.status !== 'playing' || gameState.gameOver) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const currentDir = gameState.direction;

    // Determine swipe direction (need at least 30px movement)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      // Horizontal swipe
      if (deltaX > 0 && currentDir !== 'LEFT') {
        setNextDirection('RIGHT');
      } else if (deltaX < 0 && currentDir !== 'RIGHT') {
        setNextDirection('LEFT');
      }
    } else if (Math.abs(deltaY) > 30) {
      // Vertical swipe
      if (deltaY > 0 && currentDir !== 'UP') {
        setNextDirection('DOWN');
      } else if (deltaY < 0 && currentDir !== 'DOWN') {
        setNextDirection('UP');
      }
    }

    setTouchStart(null);
  }, [touchStart, game.status, gameState.gameOver, gameState.direction]);

  // Handle game completion
  useEffect(() => {
    if (game.status === 'completed' && !gameState.gameOver) {
      // Game time ran out - show transformation
      setGameState(prev => ({ ...prev, showTransformation: true }));

      // Calculate final score bonuses
      const lengthBonus = gameState.snake.length * LENGTH_BONUS;
      const perfectBonus = gameState.foodEaten >= 10 && !gameState.gameOver ? PERFECT_BONUS : 0;

      game.addPoints(lengthBonus + perfectBonus);

      // Show transformation for 2 seconds, then results
      setTimeout(() => {
        setShowResults(true);
      }, 2000);
    } else if (gameState.gameOver) {
      // Hit wall or self - game over immediately (harsh)
      const lengthBonus = gameState.snake.length * LENGTH_BONUS;
      game.addPoints(lengthBonus);
      game.endGame();
      setShowResults(true);
    }
  }, [game.status, gameState.gameOver, gameState.showTransformation, gameState.snake.length]);

  const handleStartGame = useCallback(() => {
    setGameState({
      snake: [
        { x: 7, y: 7 },
        { x: 6, y: 7 },
        { x: 5, y: 7 },
      ],
      direction: 'RIGHT',
      food: { x: 10, y: 10 },
      gameOver: false,
      foodEaten: 0,
      showTransformation: false,
    });
    setNextDirection('RIGHT');
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
        id: `game-snake-${Date.now()}`,
        productId: productSlug,
        discountPercent: discount,
        gameType: 'snake',
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

  return (
    <div className="min-h-screen bg-ranch-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <p
            className="text-sm text-amber-500/70 uppercase tracking-widest mb-1 font-display-600"
          >
            {HORROR_COPY.games.hungryCaterpillar.careStage}
          </p>
          <h1
            className="text-3xl text-ranch-lime mb-2 font-display-800"
          >
            {HORROR_COPY.games.hungryCaterpillar.title}
          </h1>
          <p
            className="text-ranch-lavender text-lg font-display-600"
          >
            {HORROR_COPY.games.hungryCaterpillar.description}
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
            <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-8">
              <p
                className="text-lg text-ranch-cream leading-relaxed text-center font-display-600"
              >
                {HORROR_COPY.games.hungryCaterpillar.instructions[0]}
              </p>
              <p
                className="text-lg text-ranch-lavender mt-2 text-center font-display-600"
              >
                {HORROR_COPY.games.hungryCaterpillar.instructions[1]}
              </p>
              <p
                className="text-sm text-ranch-pink/70 mt-4 text-center font-display-500"
              >
                Warning: Collision ends the transformation immediately.
              </p>
            </div>
            <button
              onClick={handleStartGame}
              className="w-full px-6 py-4 bg-ranch-lime text-ranch-dark rounded-lg text-lg hover:bg-ranch-cyan transition-colors font-display-700"
            >
              {HORROR_COPY.games.hungryCaterpillar.startButton}
            </button>
          </div>
        )}

        {/* Game UI - Playing */}
        {game.status === 'playing' && !gameState.showTransformation && (
          <div className="space-y-4">
            {/* HUD */}
            <div className="flex gap-4">
              <GameTimer timeLeft={game.timeLeft} className="flex-1" />
              <GameScore score={game.score} showProgress={true} className="flex-1" />
            </div>

            {/* Stats */}
            <div className="flex justify-between text-ranch-lavender text-lg px-2">
              <span>Length: {gameState.snake.length}</span>
              <span>Eaten: {gameState.foodEaten} 🍃</span>
            </div>

            {/* Game Board */}
            <div
              role="application"
              aria-label="Snake game - swipe or use arrow keys"
              className="relative bg-ranch-purple/10 rounded-lg border-2 border-ranch-purple overflow-hidden"
              style={{
                width: GRID_SIZE * CELL_SIZE,
                height: GRID_SIZE * CELL_SIZE,
                margin: '0 auto',
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Grid */}
              <div className="absolute inset-0">
                {Array.from({ length: GRID_SIZE }).map((_, y) =>
                  Array.from({ length: GRID_SIZE }).map((_, x) => (
                    <div
                      key={`${x}-${y}`}
                      className="absolute border border-ranch-purple/20"
                      style={{
                        left: x * CELL_SIZE,
                        top: y * CELL_SIZE,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                      }}
                    />
                  ))
                )}
              </div>

              {/* Food */}
              {gameState.food && (
                <div
                  className="absolute flex items-center justify-center food-pulse"
                  style={{
                    left: gameState.food.x * CELL_SIZE,
                    top: gameState.food.y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                  }}
                >
                  <span className="text-lg">🍃</span>
                </div>
              )}

              {/* Snake */}
              {gameState.snake.map((segment, index) => (
                <div
                  key={index}
                  className={`absolute flex items-center justify-center ${
                    index > 0 ? 'segment-pulse' : ''
                  }`}
                  style={{
                    left: segment.x * CELL_SIZE,
                    top: segment.y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    zIndex: gameState.snake.length - index,
                  }}
                >
                  {index === 0 ? (
                    <span className="text-lg">🐛</span>
                  ) : (
                    <div className="w-4 h-4 bg-ranch-lime rounded-full border border-ranch-cyan" />
                  )}
                </div>
              ))}

              {/* Game Over Overlay */}
              {gameState.gameOver && (
                <div className="absolute inset-0 bg-ranch-dark/90 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-2">💀</div>
                    <p
                      className="text-ranch-pink text-xl font-display-700"
                    >
                      THE GATHERING FAILED
                    </p>
                    <p
                      className="text-ranch-lavender text-lg mt-1 font-display-500"
                    >
                      Gathered: {gameState.foodEaten} nourishment
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Controls Hint */}
            <p className="text-ranch-lavender text-lg text-center">
              Swipe or use arrow keys to move
            </p>
          </div>
        )}

        {/* Transformation Cutscene */}
        {gameState.showTransformation && (
          <div className="space-y-4">
            <div className="bg-ranch-purple/20 border-2 border-amber-500/50 rounded-lg p-8 text-center shadow-[0_0_40px_rgba(251,191,36,0.2)]">
              <div className="text-8xl mb-4 transformation-animation">
                🐛 → 🦋
              </div>
              <p
                className="text-amber-400 text-2xl mb-2 font-display-700"
              >
                THEY ARE READY TO TRANSFORM
              </p>
              <p
                className="text-ranch-lavender font-display-500"
              >
                Gathered: {gameState.foodEaten} nourishment
              </p>
              <p
                className="text-ranch-cyan text-lg mt-2 font-display-600"
              >
                {gameState.foodEaten >= 10 ? '✨ Perfect Preparation! +15' : ''}
              </p>
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
        @keyframes pulse-food {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }

        @keyframes pulse-segment {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes transform {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.5) rotate(180deg); opacity: 0.5; }
          100% { transform: scale(1) rotate(360deg); opacity: 1; }
        }

        .food-pulse {
          animation: pulse-food 1s ease-in-out infinite;
        }

        .segment-pulse {
          animation: pulse-segment 2s ease-in-out infinite;
          animation-delay: calc(var(--segment-index, 0) * 0.1s);
        }

        .transformation-animation {
          animation: transform 2s ease-in-out;
        }
      `}</style>
    </div>
  );
}
