/**
 * Path of the Pupa — Guidance Stage
 *
 * Theme: "The Chrysalis" — Guide lost caterpillars to nourishment
 *
 * Horror-themed path-drawing game where players draw paths for baby
 * caterpillars to follow to reach food (glowing leaves).
 *
 * Mobile-optimized: Touch-friendly drawing, forgiving gameplay
 *
 * Mechanics:
 * - 20 second duration (shorter for mobile attention spans)
 * - Baby caterpillars spawn at random edges
 * - Draw paths with finger/mouse to guide them
 * - Caterpillars follow paths automatically
 * - Obstacles slow AND penalize (forgiving but consequential)
 *
 * Scoring:
 * - Caterpillar reaches food: +8 points
 * - Speed bonus (<2 sec): +2 points
 * - Multi-feed bonus: +3 per extra caterpillar
 * - Obstacle hit: -2 points + slowdown
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
import { HORROR_COPY } from '../lib/constants/horror-copy';
import type { Route } from './+types/games.path-of-the-pupa';

// === DIFFICULTY SETTINGS ===
const GAME_DURATION = 20; // seconds (shorter for mobile)
const CATERPILLAR_SPAWN_INTERVAL = 2500; // ms between spawns
const CATERPILLAR_SPEED = 2; // pixels per frame
const OBSTACLE_SLOWDOWN = 0.3; // 70% speed reduction when hitting obstacle
const PATH_FADE_TIME = 3000; // ms before path fades
const FOOD_COUNT = 4; // Number of food items

// Points
const FED_POINTS = 8;
const SPEED_BONUS = 2;
const MULTI_FEED_BONUS = 3;
const OBSTACLE_PENALTY = 2;

interface Point {
  x: number;
  y: number;
}

interface Path {
  id: number;
  points: Point[];
  createdAt: number;
}

interface Caterpillar {
  id: number;
  x: number;
  y: number;
  targetIndex: number;
  path: Point[] | null;
  spawnTime: number;
  fed: boolean;
  lastObstacleHit: number; // Timestamp of last obstacle hit (for cooldown)
}

interface FoodItem {
  id: number;
  x: number;
  y: number;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
}

interface FeedEffect {
  id: number;
  x: number;
  y: number;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Path of the Pupa — Guidance | Caterpillar Ranch' },
    {
      name: 'description',
      content: 'Draw paths to guide caterpillars to nourishment. Prove your care.',
    },
  ];
}

export default function PathOfThePupaRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get('product');
  const shouldReduceMotion = useReducedMotion();

  const { addDiscount, removeDiscount, cart } = useCart();
  const game = useGameState(GAME_DURATION);

  const [paths, setPaths] = useState<Path[]>([]);
  const [caterpillars, setCaterpillars] = useState<Caterpillar[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [feedEffects, setFeedEffects] = useState<FeedEffect[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const nextPathId = useRef(0);
  const nextCaterpillarId = useRef(0);
  const nextEffectId = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const spawnTimerRef = useRef<number | undefined>(undefined);

  // === BUG FIX: Use refs to avoid stale closures in animation loop ===
  const pathsRef = useRef<Path[]>([]);
  const foodItemsRef = useRef<FoodItem[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const gameRef = useRef(game);

  // === BUG FIX: Track effect timeouts for cleanup ===
  const effectTimeoutsRef = useRef<number[]>([]);

  // Keep refs in sync
  useEffect(() => {
    pathsRef.current = paths;
  }, [paths]);
  useEffect(() => {
    foodItemsRef.current = foodItems;
  }, [foodItems]);
  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // === BUG FIX: Clear timeouts on unmount ===
  useEffect(() => {
    return () => {
      effectTimeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // === BUG FIX: Clear paths when game status changes ===
  useEffect(() => {
    if (game.status !== 'playing') {
      setPaths([]);
    }
  }, [game.status]);

  // Load best score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('game:path-of-the-pupa:best-score');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Save best score
  useEffect(() => {
    if (game.score > bestScore) {
      setBestScore(game.score);
      localStorage.setItem('game:path-of-the-pupa:best-score', game.score.toString());
    }
  }, [game.score, bestScore]);

  // Initialize food items and obstacles
  useEffect(() => {
    if (game.status === 'playing') {
      // Generate food positions (spread across middle area)
      const food: FoodItem[] = [];
      for (let i = 0; i < FOOD_COUNT; i++) {
        food.push({
          id: i,
          x: 60 + (i % 2) * 200 + Math.random() * 40,
          y: 120 + Math.floor(i / 2) * 120 + Math.random() * 40,
        });
      }
      setFoodItems(food);

      // Generate some obstacles
      const obs: Obstacle[] = [];
      for (let i = 0; i < 3; i++) {
        obs.push({
          id: i,
          x: 80 + Math.random() * 200,
          y: 100 + Math.random() * 200,
        });
      }
      setObstacles(obs);
    }
  }, [game.status]);

  // Spawn caterpillars at edges
  const spawnCaterpillar = useCallback(() => {
    const id = nextCaterpillarId.current++;
    const edge = Math.floor(Math.random() * 4);

    let x: number, y: number;
    switch (edge) {
      case 0: // Top
        x = 40 + Math.random() * 280;
        y = 10;
        break;
      case 1: // Right
        x = 350;
        y = 40 + Math.random() * 280;
        break;
      case 2: // Bottom
        x = 40 + Math.random() * 280;
        y = 390;
        break;
      default: // Left
        x = 10;
        y = 40 + Math.random() * 280;
        break;
    }

    setCaterpillars((prev) => [
      ...prev,
      {
        id,
        x,
        y,
        targetIndex: 0,
        path: null,
        spawnTime: Date.now(),
        fed: false,
        lastObstacleHit: 0,
      },
    ]);
  }, []);

  // Spawn timer
  useEffect(() => {
    if (game.status !== 'playing') {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      return;
    }

    // Initial spawns
    spawnCaterpillar();
    setTimeout(spawnCaterpillar, 500);

    spawnTimerRef.current = window.setInterval(() => {
      spawnCaterpillar();
    }, CATERPILLAR_SPAWN_INTERVAL);

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [game.status, spawnCaterpillar]);

  // Clean up old paths
  useEffect(() => {
    if (game.status !== 'playing') return;

    const interval = setInterval(() => {
      const now = Date.now();
      setPaths((prev) =>
        prev.filter((p) => now - p.createdAt < PATH_FADE_TIME)
      );
    }, 500);

    return () => clearInterval(interval);
  }, [game.status]);

  // Physics/movement update loop
  // === BUG FIX: Only depend on game.status to avoid restart thrashing ===
  useEffect(() => {
    if (game.status !== 'playing') {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const updateCaterpillars = () => {
      // Collect scoring events to process after state update
      const scoringEvents: { type: 'fed' | 'obstacle'; points: number; foodId?: number; x?: number; y?: number }[] = [];

      setCaterpillars((prev) => {
        const updated: Caterpillar[] = [];
        const currentPaths = pathsRef.current;
        const currentFood = foodItemsRef.current;
        const currentObstacles = obstaclesRef.current;
        const now = Date.now();

        for (const cat of prev) {
          if (cat.fed) continue;

          let newX = cat.x;
          let newY = cat.y;
          let newTargetIndex = cat.targetIndex;
          let newPath = cat.path;
          let newLastObstacleHit = cat.lastObstacleHit;
          let speedMultiplier = 1;

          // Find nearest path if no path assigned
          if (!cat.path) {
            const nearestPath = currentPaths.find((p) => {
              if (p.points.length < 2) return false;
              const start = p.points[0];
              const dx = start.x - cat.x;
              const dy = start.y - cat.y;
              return Math.sqrt(dx * dx + dy * dy) < 60;
            });

            if (nearestPath) {
              newPath = nearestPath.points;
              newTargetIndex = 0;
            }
          }

          // === BUG FIX: Check collision with obstacles BEFORE movement ===
          // Apply slowdown effect + penalty (with cooldown to prevent spam)
          for (const obs of currentObstacles) {
            const dx = obs.x - newX;
            const dy = obs.y - newY;
            if (Math.sqrt(dx * dx + dy * dy) < 25) {
              speedMultiplier = OBSTACLE_SLOWDOWN; // Apply slowdown

              // Only penalize once per second per obstacle
              if (now - newLastObstacleHit > 1000) {
                newLastObstacleHit = now;
                scoringEvents.push({ type: 'obstacle', points: -OBSTACLE_PENALTY });
              }
            }
          }

          // Move along path with speed multiplier
          const effectiveSpeed = CATERPILLAR_SPEED * speedMultiplier;

          if (newPath && newTargetIndex < newPath.length) {
            const target = newPath[newTargetIndex];
            const dx = target.x - newX;
            const dy = target.y - newY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < effectiveSpeed) {
              newX = target.x;
              newY = target.y;
              newTargetIndex++;
            } else {
              newX += (dx / dist) * effectiveSpeed;
              newY += (dy / dist) * effectiveSpeed;
            }
          } else if (newPath) {
            // Path ended, wander toward center
            const centerX = 180;
            const centerY = 200;
            const dx = centerX - newX;
            const dy = centerY - newY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > effectiveSpeed) {
              newX += (dx / dist) * effectiveSpeed * 0.3;
              newY += (dy / dist) * effectiveSpeed * 0.3;
            }
          }

          // Check collision with food
          let wasFed = false;
          for (const food of currentFood) {
            const dx = food.x - newX;
            const dy = food.y - newY;
            if (Math.sqrt(dx * dx + dy * dy) < 30) {
              wasFed = true;

              // Calculate points
              const timeElapsed = (Date.now() - cat.spawnTime) / 1000;
              let points = FED_POINTS;
              if (timeElapsed < 2) {
                points += SPEED_BONUS;
              }

              // === BUG FIX: Track food to remove ===
              scoringEvents.push({
                type: 'fed',
                points,
                foodId: food.id,
                x: food.x,
                y: food.y,
              });

              break;
            }
          }

          if (!wasFed) {
            updated.push({
              ...cat,
              x: newX,
              y: newY,
              targetIndex: newTargetIndex,
              path: newPath,
              lastObstacleHit: newLastObstacleHit,
            });
          }
        }

        return updated;
      });

      // === BUG FIX: Process scoring events outside state updater to avoid stale closures ===
      for (const event of scoringEvents) {
        if (event.type === 'fed') {
          gameRef.current.addPoints(event.points);

          // === BUG FIX: Remove food when eaten ===
          if (event.foodId !== undefined) {
            setFoodItems((prev) => prev.filter((f) => f.id !== event.foodId));
          }

          // Add feed effect
          if (event.x !== undefined && event.y !== undefined) {
            const effectId = nextEffectId.current++;
            setFeedEffects((e) => [
              ...e,
              { id: effectId, x: event.x!, y: event.y! },
            ]);

            // === BUG FIX: Track timeout for cleanup ===
            const timeoutId = window.setTimeout(() => {
              setFeedEffects((e) => e.filter((ef) => ef.id !== effectId));
            }, 600);
            effectTimeoutsRef.current.push(timeoutId);
          }
        } else if (event.type === 'obstacle') {
          gameRef.current.subtractPoints(Math.abs(event.points));
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateCaterpillars);
    };

    animationFrameRef.current = requestAnimationFrame(updateCaterpillars);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [game.status]); // === BUG FIX: Only restart on status change, not every render ===

  // Show results when game completes
  useEffect(() => {
    if (game.status === 'completed') {
      setShowResults(true);
    }
  }, [game.status]);

  // Handle drawing start
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (game.status !== 'playing') return;

      const rect = gameAreaRef.current?.getBoundingClientRect();
      if (!rect) return;

      // === BUG FIX: Bounds checking ===
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

      setIsDrawing(true);
      setCurrentPath([{ x, y }]);

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [game.status]
  );

  // Handle drawing
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return;

      const rect = gameAreaRef.current?.getBoundingClientRect();
      if (!rect) return;

      // === BUG FIX: Bounds checking ===
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

      // Add point if far enough from last point
      setCurrentPath((prev) => {
        if (prev.length === 0) return [{ x, y }];

        const last = prev[prev.length - 1];
        const dx = x - last.x;
        const dy = y - last.y;
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          return [...prev, { x, y }];
        }
        return prev;
      });
    },
    [isDrawing]
  );

  // Handle drawing end
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return;

      // Save path if long enough
      if (currentPath.length >= 3) {
        const id = nextPathId.current++;
        setPaths((prev) => [
          ...prev,
          {
            id,
            points: currentPath,
            createdAt: Date.now(),
          },
        ]);
      }

      setIsDrawing(false);
      setCurrentPath([]);

      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    },
    [isDrawing, currentPath]
  );

  const handleStartGame = useCallback(() => {
    setShowResults(false);
    setPaths([]);
    setCaterpillars([]);
    setFeedEffects([]);
    // === BUG FIX: Reset drawing state on retry ===
    setIsDrawing(false);
    setCurrentPath([]);
    game.startGame();
  }, [game]);

  const handleApplyDiscount = useCallback(
    (discount: number) => {
      if (discount > 0 && productSlug) {
        const existingDiscount = cart.discounts.find((d) => d.productId === productSlug);
        if (existingDiscount) {
          removeDiscount(existingDiscount.id);
        }

        addDiscount({
          id: `game-path-of-the-pupa-${Date.now()}`,
          productId: productSlug,
          discountPercent: discount,
          gameType: 'path-of-the-pupa',
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

  // Convert path to SVG path string
  const pathToSvg = (points: Point[]): string => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  return (
    <div className="min-h-screen bg-ranch-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-sm text-amber-500/70 uppercase tracking-widest mb-1 font-display-600">
            {HORROR_COPY.games.pathOfThePupa.careStage}
          </p>
          <h1 className="text-3xl text-ranch-lime mb-2 font-display-800">
            {HORROR_COPY.games.pathOfThePupa.title}
          </h1>
          <p className="text-ranch-lavender text-lg font-display-600">
            {HORROR_COPY.games.pathOfThePupa.description}
          </p>
          {bestScore > 0 && (
            <p className="text-ranch-cyan text-lg mt-1 font-display-600">
              Best: {bestScore}
            </p>
          )}
        </div>

        {/* Game UI - Before start */}
        {game.status === 'idle' && (
          <div className="text-center space-y-6">
            <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-8">
              <p className="text-lg text-ranch-cream leading-relaxed text-center font-display-600">
                {HORROR_COPY.games.pathOfThePupa.instructions[0]}
              </p>
              <p className="text-lg text-ranch-lavender mt-2 text-center font-display-600">
                {HORROR_COPY.games.pathOfThePupa.instructions[1]}
              </p>
              <p className="text-sm text-ranch-lime/70 mt-4 text-center font-display-500">
                Obstacles slow AND penalize. Avoid them when possible!
              </p>
            </div>

            {/* Visual Demo */}
            <div className="bg-ranch-dark/50 border border-ranch-purple/30 rounded-lg p-4">
              <p className="text-xs text-ranch-lavender/60 uppercase tracking-wider mb-3">How to Play</p>
              <div className="flex items-center justify-center gap-4 text-2xl">
                <span>🐛</span>
                <span className="text-ranch-lime">✏️</span>
                <span className="text-ranch-lavender">〰️</span>
                <span className="text-ranch-lime">→</span>
                <span>🍃</span>
              </div>
              <p className="text-sm text-ranch-cream/60 mt-2">
                Draw paths from caterpillars to leaves!
              </p>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full px-6 py-4 bg-ranch-lime text-ranch-dark rounded-lg text-lg hover:bg-ranch-cyan transition-colors font-display-700"
            >
              {HORROR_COPY.games.pathOfThePupa.startButton}
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

            {/* Game Area */}
            <div
              ref={gameAreaRef}
              className="relative bg-gradient-to-b from-ranch-purple/10 to-ranch-dark/90 border-2 border-ranch-purple rounded-lg overflow-hidden touch-none cursor-crosshair"
              style={{ width: '100%', height: '420px' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* SVG for paths */}
              <svg className="absolute inset-0 pointer-events-none">
                {/* Existing paths (fading) */}
                {paths.map((path) => {
                  const age = Date.now() - path.createdAt;
                  const opacity = Math.max(0, 1 - age / PATH_FADE_TIME);
                  return (
                    <path
                      key={path.id}
                      d={pathToSvg(path.points)}
                      stroke="#32CD32"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={opacity * 0.7}
                      style={{
                        filter: `drop-shadow(0 0 4px rgba(50, 205, 50, ${opacity * 0.5}))`,
                      }}
                    />
                  );
                })}

                {/* Current drawing path */}
                {isDrawing && currentPath.length >= 2 && (
                  <path
                    d={pathToSvg(currentPath)}
                    stroke="#00CED1"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      filter: 'drop-shadow(0 0 6px rgba(0, 206, 209, 0.8))',
                    }}
                  />
                )}
              </svg>

              {/* Obstacles */}
              {obstacles.map((obs) => (
                <div
                  key={obs.id}
                  className="absolute text-2xl opacity-60"
                  style={{
                    left: obs.x - 15,
                    top: obs.y - 15,
                    width: 30,
                    height: 30,
                  }}
                >
                  🌵
                </div>
              ))}

              {/* Food items */}
              <AnimatePresence>
                {foodItems.map((food) => (
                  <motion.div
                    key={food.id}
                    className="absolute"
                    style={{
                      left: food.x - 20,
                      top: food.y - 20,
                      width: 40,
                      height: 40,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                      opacity: 1,
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      delay: food.id * 0.3,
                    }}
                  >
                    <span className="text-3xl drop-shadow-[0_0_8px_rgba(50,205,50,0.6)]">
                      🍃
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Feed effects */}
              <AnimatePresence>
                {feedEffects.map((effect) => (
                  <motion.div
                    key={effect.id}
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0, y: -30 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute pointer-events-none text-2xl"
                    style={{
                      left: effect.x - 15,
                      top: effect.y - 15,
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Caterpillars */}
              <AnimatePresence>
                {caterpillars.map((cat) => (
                  <motion.div
                    key={cat.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    className="absolute"
                    style={{
                      left: cat.x - 15,
                      top: cat.y - 15,
                      width: 30,
                      height: 30,
                    }}
                  >
                    <motion.span
                      className="text-2xl"
                      animate={{
                        rotate: cat.path ? [0, 10, -10, 0] : 0,
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.3,
                      }}
                    >
                      🐛
                    </motion.span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Drawing cursor indicator */}
              {isDrawing && currentPath.length > 0 && (
                <motion.div
                  className="absolute w-4 h-4 rounded-full bg-ranch-cyan pointer-events-none"
                  style={{
                    left: currentPath[currentPath.length - 1].x - 8,
                    top: currentPath[currentPath.length - 1].y - 8,
                  }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 0.4 }}
                />
              )}
            </div>

            {/* Instructions during play */}
            <div className="text-center text-sm text-ranch-lavender/60">
              Draw paths from caterpillars 🐛 to leaves 🍃
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
