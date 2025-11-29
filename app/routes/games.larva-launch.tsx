/**
 * Larva Launch — Defense Stage
 *
 * Theme: "The Chrysalis" — Protect the sacred leaves from parasites
 *
 * Horror-themed slingshot game where players launch friendly caterpillars
 * at parasites infesting leaves. Drag back to aim, release to launch.
 *
 * Mobile-optimized: Touch-friendly drag mechanics, forgiving gameplay
 *
 * Mechanics:
 * - 20 second duration (shorter for mobile attention spans)
 * - 3 launch zones at bottom
 * - Parasites spawn on leaves at top/middle
 * - Drag caterpillar back to aim, release to launch
 * - No miss penalty (forgiving)
 *
 * Scoring:
 * - Hit parasite: +5 points
 * - Hit golden parasite: +10 points
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
import type { Route } from './+types/games.larva-launch';

// === DIFFICULTY SETTINGS ===
const GAME_DURATION = 20; // seconds (shorter for mobile)
const PARASITE_SPAWN_INTERVAL = 1200; // ms between spawns
const GOLDEN_PARASITE_CHANCE = 0.15; // 15% chance of golden
const MAX_PROJECTILES = 8; // Cap to prevent performance issues

// Points
const HIT_PARASITE_POINTS = 5;
const HIT_GOLDEN_POINTS = 10;

// Physics
const LAUNCH_POWER_MULTIPLIER = 0.15;
const GRAVITY = 0.3;
const MAX_PULL_DISTANCE = 120;

interface Parasite {
  id: number;
  x: number;
  y: number;
  isGolden: boolean;
  size: number;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface SplatEffect {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface Hit {
  parasiteId: number;
  points: number;
  x: number;
  y: number;
  isGolden: boolean;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Larva Launch — Defense | Caterpillar Ranch' },
    {
      name: 'description',
      content: 'Launch defenders to protect the sacred leaves. Prove your care.',
    },
  ];
}

export default function LarvaLaunchRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get('product');
  const shouldReduceMotion = useReducedMotion();

  const { addDiscount, removeDiscount, cart } = useCart();
  const game = useGameState(GAME_DURATION);

  const [parasites, setParasites] = useState<Parasite[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [splats, setSplats] = useState<SplatEffect[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  // Slingshot state
  const [isDragging, setIsDragging] = useState(false);
  const [pullCurrent, setPullCurrent] = useState({ x: 0, y: 0 });
  const [activeLauncher, setActiveLauncher] = useState<number | null>(null);

  // Refs for physics loop (avoid stale closures)
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const parasitesRef = useRef<Parasite[]>([]);
  const gameRef = useRef(game);
  const nextParasiteId = useRef(0);
  const nextProjectileId = useRef(0);
  const nextSplatId = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const spawnTimerRef = useRef<number | undefined>(undefined);
  const splatTimeoutsRef = useRef<number[]>([]); // Track splat timeouts for cleanup
  const lastFrameTimeRef = useRef<number>(0); // For delta time physics

  // Keep refs in sync with state
  useEffect(() => {
    parasitesRef.current = parasites;
  }, [parasites]);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Calculate responsive launcher positions based on container width
  const getResponsiveLauncherPositions = useCallback(() => {
    const width = gameAreaRef.current?.offsetWidth || 360;
    const spacing = width / 4;
    return [
      { x: spacing, y: 380 },
      { x: spacing * 2, y: 380 },
      { x: spacing * 3, y: 380 },
    ];
  }, []);

  const [launcherPositions, setLauncherPositions] = useState([
    { x: 90, y: 380 },
    { x: 180, y: 380 },
    { x: 270, y: 380 },
  ]);

  // Update launcher positions on mount and resize
  useEffect(() => {
    const updatePositions = () => {
      setLauncherPositions(getResponsiveLauncherPositions());
    };
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [getResponsiveLauncherPositions]);

  // Load best score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('game:larva-launch:best-score');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Save best score
  useEffect(() => {
    if (game.score > bestScore) {
      setBestScore(game.score);
      localStorage.setItem('game:larva-launch:best-score', game.score.toString());
    }
  }, [game.score, bestScore]);

  // Cleanup splat timeouts on unmount or game end
  useEffect(() => {
    return () => {
      splatTimeoutsRef.current.forEach((id) => clearTimeout(id));
      splatTimeoutsRef.current = [];
    };
  }, []);

  // Reset drag state when game ends (fix pointer capture stuck)
  useEffect(() => {
    if (game.status !== 'playing') {
      setIsDragging(false);
      setActiveLauncher(null);
    }
  }, [game.status]);

  // Spawn parasites
  const spawnParasite = useCallback(() => {
    const id = nextParasiteId.current++;
    const isGolden = Math.random() < GOLDEN_PARASITE_CHANCE;
    const newParasite: Parasite = {
      id,
      x: 40 + Math.random() * 280,
      y: 40 + Math.random() * 150,
      isGolden,
      size: isGolden ? 50 : 40,
    };
    setParasites((prev) => [...prev, newParasite]);
  }, []);

  // Spawn timer
  useEffect(() => {
    if (game.status !== 'playing') {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      return;
    }

    // Initial spawn
    spawnParasite();
    spawnParasite();

    spawnTimerRef.current = window.setInterval(() => {
      spawnParasite();
    }, PARASITE_SPAWN_INTERVAL);

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [game.status, spawnParasite]);

  // Create splat effect (with proper timeout tracking)
  const createSplat = useCallback((x: number, y: number, isGolden: boolean) => {
    const splatId = nextSplatId.current++;
    setSplats((s) => [
      ...s,
      {
        id: splatId,
        x,
        y,
        color: isGolden ? '#FFD700' : '#4a3258',
      },
    ]);

    const timeoutId = window.setTimeout(() => {
      setSplats((s) => s.filter((sp) => sp.id !== splatId));
      // Remove from tracking array
      splatTimeoutsRef.current = splatTimeoutsRef.current.filter((id) => id !== timeoutId);
    }, 500);

    splatTimeoutsRef.current.push(timeoutId);
  }, []);

  // Physics update loop - refactored to avoid nested state updates
  useEffect(() => {
    if (game.status !== 'playing') {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    lastFrameTimeRef.current = performance.now();

    const updatePhysics = () => {
      const now = performance.now();
      const deltaTime = Math.min((now - lastFrameTimeRef.current) / 16.67, 3); // Cap at 3x normal
      lastFrameTimeRef.current = now;

      // Get current parasites from ref (avoid stale closure)
      const currentParasites = parasitesRef.current;

      setProjectiles((prev) => {
        const updated: Projectile[] = [];
        const hits: Hit[] = [];

        for (const proj of prev) {
          // Apply gravity with delta time
          const newVy = proj.vy + GRAVITY * deltaTime;
          const newX = proj.x + proj.vx * deltaTime;
          const newY = proj.y + newVy * deltaTime;

          // Check if out of bounds
          if (newX < -20 || newX > 380 || newY < -20 || newY > 420) {
            continue;
          }

          // Check collision with parasites
          let hit = false;
          for (const parasite of currentParasites) {
            const dx = newX - parasite.x;
            const dy = newY - parasite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < parasite.size / 2 + 15) {
              hit = true;
              hits.push({
                parasiteId: parasite.id,
                points: parasite.isGolden ? HIT_GOLDEN_POINTS : HIT_PARASITE_POINTS,
                x: parasite.x,
                y: parasite.y,
                isGolden: parasite.isGolden,
              });
              break;
            }
          }

          if (!hit) {
            updated.push({
              ...proj,
              x: newX,
              y: newY,
              vy: newVy,
            });
          }
        }

        // Process hits AFTER the projectile loop (avoid nested state updates)
        if (hits.length > 0) {
          // Remove hit parasites
          const hitIds = hits.map((h) => h.parasiteId);
          setParasites((p) => p.filter((parasite) => !hitIds.includes(parasite.id)));

          // Add points and create splats for each hit
          for (const hit of hits) {
            gameRef.current.addPoints(hit.points);
            createSplat(hit.x, hit.y, hit.isGolden);
          }
        }

        return updated;
      });

      animationFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animationFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [game.status, createSplat]);

  // Show results when game completes
  useEffect(() => {
    if (game.status === 'completed') {
      setShowResults(true);
      // Clear any remaining splat timeouts
      splatTimeoutsRef.current.forEach((id) => clearTimeout(id));
      splatTimeoutsRef.current = [];
    }
  }, [game.status]);

  // Handle touch/mouse start
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, launcherIndex: number) => {
      if (game.status !== 'playing') return;

      const rect = gameAreaRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsDragging(true);
      setActiveLauncher(launcherIndex);
      setPullCurrent({ x, y });

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [game.status]
  );

  // Handle touch/mouse move
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || activeLauncher === null) return;

      const rect = gameAreaRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Limit pull distance
      const launcher = launcherPositions[activeLauncher];
      if (!launcher) return;

      const dx = x - launcher.x;
      const dy = y - launcher.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > MAX_PULL_DISTANCE) {
        const angle = Math.atan2(dy, dx);
        setPullCurrent({
          x: launcher.x + Math.cos(angle) * MAX_PULL_DISTANCE,
          y: launcher.y + Math.sin(angle) * MAX_PULL_DISTANCE,
        });
      } else {
        setPullCurrent({ x, y });
      }
    },
    [isDragging, activeLauncher, launcherPositions]
  );

  // Handle touch/mouse end (launch!)
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || activeLauncher === null) return;

      const launcher = launcherPositions[activeLauncher];
      if (!launcher) {
        setIsDragging(false);
        setActiveLauncher(null);
        return;
      }

      const dx = launcher.x - pullCurrent.x;
      const dy = launcher.y - pullCurrent.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only launch if pulled enough and under projectile cap
      if (distance > 20 && projectiles.length < MAX_PROJECTILES) {
        const id = nextProjectileId.current++;
        const vx = dx * LAUNCH_POWER_MULTIPLIER;
        const vy = dy * LAUNCH_POWER_MULTIPLIER;

        setProjectiles((prev) => [
          ...prev,
          {
            id,
            x: launcher.x,
            y: launcher.y,
            vx,
            vy,
          },
        ]);
      }

      setIsDragging(false);
      setActiveLauncher(null);

      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture may already be released
      }
    },
    [isDragging, activeLauncher, pullCurrent, launcherPositions, projectiles.length]
  );

  const handleStartGame = useCallback(() => {
    setShowResults(false);
    setParasites([]);
    setProjectiles([]);
    setSplats([]);
    setIsDragging(false);
    setActiveLauncher(null);
    // Clear any remaining splat timeouts
    splatTimeoutsRef.current.forEach((id) => clearTimeout(id));
    splatTimeoutsRef.current = [];
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
          id: `game-larva-launch-${Date.now()}`,
          productId: productSlug,
          discountPercent: discount,
          gameType: 'larva-launch',
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

  // Calculate pull vector for trajectory line
  const pullVector =
    isDragging && activeLauncher !== null && launcherPositions[activeLauncher]
      ? {
          x: launcherPositions[activeLauncher].x - pullCurrent.x,
          y: launcherPositions[activeLauncher].y - pullCurrent.y,
        }
      : null;

  return (
    <div className="min-h-screen bg-ranch-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-sm text-amber-500/70 uppercase tracking-widest mb-1 font-display-600">
            {HORROR_COPY.games.larvaLaunch.careStage}
          </p>
          <h1 className="text-3xl text-ranch-lime mb-2 font-display-800">
            {HORROR_COPY.games.larvaLaunch.title}
          </h1>
          <p className="text-ranch-lavender text-lg font-display-600">
            {HORROR_COPY.games.larvaLaunch.description}
          </p>
          {bestScore > 0 && (
            <p className="text-ranch-cyan text-lg mt-1 font-display-600">Best: {bestScore}</p>
          )}
        </div>

        {/* Game UI - Before start */}
        {game.status === 'idle' && (
          <div className="text-center space-y-6">
            <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-8">
              <p className="text-lg text-ranch-cream leading-relaxed text-center font-display-600">
                {HORROR_COPY.games.larvaLaunch.instructions[0]}
              </p>
              <p className="text-lg text-ranch-lavender mt-2 text-center font-display-600">
                {HORROR_COPY.games.larvaLaunch.instructions[1]}
              </p>
              <p className="text-sm text-ranch-lime/70 mt-4 text-center font-display-500">
                No penalty for misses. Launch freely!
              </p>
            </div>

            {/* Visual Demo */}
            <div className="bg-ranch-dark/50 border border-ranch-purple/30 rounded-lg p-4">
              <p className="text-xs text-ranch-lavender/60 uppercase tracking-wider mb-3">
                How to Play
              </p>
              <div className="flex items-center justify-center gap-4 text-2xl">
                <span>👆</span>
                <span className="text-ranch-lavender">→</span>
                <span>↖️</span>
                <span className="text-ranch-lavender">→</span>
                <span>🎯</span>
              </div>
              <p className="text-sm text-ranch-cream/60 mt-2">
                Drag back • Aim • Release to launch!
              </p>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full px-6 py-4 bg-ranch-lime text-ranch-dark rounded-lg text-lg hover:bg-ranch-cyan transition-colors font-display-700"
            >
              {HORROR_COPY.games.larvaLaunch.startButton}
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
              className="relative bg-gradient-to-b from-ranch-purple/20 to-ranch-dark border-2 border-ranch-purple rounded-lg overflow-hidden touch-none"
              style={{ width: '100%', height: '420px' }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* Leaves (background decoration) */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute text-4xl opacity-30"
                    style={{
                      left: `${20 + i * 18}%`,
                      top: `${10 + (i % 2) * 15}%`,
                    }}
                  >
                    🍃
                  </div>
                ))}
              </div>

              {/* Parasites */}
              <AnimatePresence>
                {parasites.map((parasite) => (
                  <motion.div
                    key={parasite.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      x: [0, 3, -3, 0],
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      x: { repeat: Infinity, duration: 0.5 },
                    }}
                    className="absolute flex items-center justify-center"
                    style={{
                      left: parasite.x - parasite.size / 2,
                      top: parasite.y - parasite.size / 2,
                      width: parasite.size,
                      height: parasite.size,
                    }}
                  >
                    <span
                      className={`text-3xl ${parasite.isGolden ? 'drop-shadow-[0_0_8px_gold]' : ''}`}
                      style={{ fontSize: parasite.isGolden ? '2.5rem' : '2rem' }}
                    >
                      {parasite.isGolden ? '🪲' : '🦟'}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Splat Effects */}
              <AnimatePresence>
                {splats.map((splat) => (
                  <motion.div
                    key={splat.id}
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute pointer-events-none"
                    style={{
                      left: splat.x - 25,
                      top: splat.y - 25,
                      width: 50,
                      height: 50,
                    }}
                  >
                    <div
                      className="w-full h-full rounded-full"
                      style={{ backgroundColor: splat.color, filter: 'blur(4px)' }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Projectiles */}
              <AnimatePresence>
                {projectiles.map((proj) => (
                  <motion.div
                    key={proj.id}
                    className="absolute"
                    style={{
                      left: proj.x - 15,
                      top: proj.y - 15,
                      width: 30,
                      height: 30,
                    }}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      rotate: [0, 360],
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      rotate: { repeat: Infinity, duration: 0.3 },
                      scale: { duration: 0.1 },
                    }}
                  >
                    <span className="text-2xl">🐛</span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Trajectory Line */}
              {isDragging && activeLauncher !== null && pullVector && (
                <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                  <line
                    x1={pullCurrent.x}
                    y1={pullCurrent.y}
                    x2={launcherPositions[activeLauncher].x}
                    y2={launcherPositions[activeLauncher].y}
                    stroke="#32CD32"
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    opacity={0.7}
                  />
                  {/* Direction arrow */}
                  <circle
                    cx={launcherPositions[activeLauncher].x + pullVector.x * 0.3}
                    cy={launcherPositions[activeLauncher].y + pullVector.y * 0.3}
                    r="6"
                    fill="#32CD32"
                    opacity={0.5}
                  />
                </svg>
              )}

              {/* Launchers */}
              {launcherPositions.map((pos, index) => (
                <motion.div
                  key={index}
                  className="absolute cursor-pointer"
                  style={{
                    left: pos.x - 30,
                    top: pos.y - 30,
                    width: 60,
                    height: 60,
                  }}
                  onPointerDown={(e) => handlePointerDown(e, index)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className={`w-full h-full rounded-full flex items-center justify-center border-4 ${
                      activeLauncher === index
                        ? 'border-ranch-lime bg-ranch-lime/30'
                        : 'border-ranch-purple bg-ranch-purple/30'
                    } transition-colors`}
                  >
                    <span className="text-3xl">🐛</span>
                  </div>
                </motion.div>
              ))}

              {/* Pull indicator when dragging */}
              {isDragging && activeLauncher !== null && (
                <motion.div
                  className="absolute w-8 h-8 rounded-full bg-ranch-lime/50 border-2 border-ranch-lime pointer-events-none"
                  style={{
                    left: pullCurrent.x - 16,
                    top: pullCurrent.y - 16,
                  }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                />
              )}
            </div>

            {/* Instructions during play */}
            <div className="text-center text-sm text-ranch-lavender/60">
              Drag caterpillars back and release to launch at parasites!
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
