/**
 * Path of the Pupa — Survival Stage
 *
 * Theme: "The Chrysalis" — Survive the pursuit
 *
 * Horror-themed survival chase game where players control a snake
 * fleeing from pursuing enemies. Collect gems for bonus points, but
 * each gem makes you grow larger and easier to catch.
 *
 * Mobile-optimized: Touch-friendly, smooth follow controls
 *
 * Mechanics:
 * - 25 second duration
 * - Direct control: snake follows cursor/finger
 * - Enemies chase you, getting faster over time
 * - 3 lives with brief invincibility after hit
 * - Gems spawn randomly for bonus points
 * - Each gem adds a segment (snake-like growth)
 * - Bigger = easier to catch (risk/reward)
 *
 * Scoring:
 * - +1 point per second survived
 * - +5 points per gem collected
 * - Survive all 25 seconds for max discount potential
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { GameTimer } from '../lib/components/Games/GameTimer';
import { GameScore } from '../lib/components/Games/GameScore';
import { GameResults } from '../lib/components/Games/GameResults';
import { useCart } from '../lib/contexts/CartContext';
import { useReducedMotion } from '../lib/hooks/useReducedMotion';
import { HORROR_COPY } from '../lib/constants/horror-copy';
import type { Route } from './+types/games.path-of-the-pupa';

// === DIFFICULTY SETTINGS ===
const GAME_DURATION = 25; // seconds
const INITIAL_ENEMY_SPEED = 1.5; // pixels per frame at 60fps
const ENEMY_SPEED_INCREASE = 0.08; // speed increase per second
const PLAYER_SPEED = 4; // pixels per frame at 60fps
const SEGMENT_SIZE = 20; // size of each body segment
const HEAD_SIZE = 28; // size of snake head
const ENEMY_SIZE = 24; // collision radius for enemies
const GEM_SIZE = 20; // collision radius for gems
const INITIAL_LIVES = 3;
const INVINCIBILITY_DURATION = 1500; // ms of invincibility after hit
const GEM_SPAWN_INTERVAL = 3000; // ms between gem spawns
const ENEMY_SPAWN_INTERVAL = 4000; // ms between new enemy spawns
const MAX_ENEMIES = 6;
const MAX_GEMS = 2;
const POINTS_PER_SECOND = 1;
const POINTS_PER_GEM = 5;

// Game area dimensions
const GAME_WIDTH = 360;
const GAME_HEIGHT = 420;

interface Point {
  x: number;
  y: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  speed: number;
}

interface Gem {
  id: number;
  x: number;
  y: number;
}

interface HitEffect {
  id: number;
  x: number;
  y: number;
  createdAt: number;
}

// Game state type for ref-based state management (everything except lifecycle)
interface GameStateData {
  playerPos: Point;
  targetPos: Point;
  segments: Point[];
  enemies: Enemy[];
  gems: Gem[];
  hitEffects: HitEffect[];
  lives: number;
  isInvincible: boolean;
  invincibleUntil: number;
  score: number;
  timeLeft: number;
  lastScoreTick: number;
  lastEnemySpawn: number;
  lastGemSpawn: number;
  nextEnemyId: number;
  nextGemId: number;
  nextEffectId: number;
  gameStartTime: number;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Path of the Pupa — Survival | Caterpillar Ranch' },
    {
      name: 'description',
      content: 'Flee from your pursuers. Collect gems if you dare. Survive.',
    },
  ];
}

function createInitialGameState(): GameStateData {
  return {
    playerPos: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
    targetPos: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
    segments: [],
    enemies: [],
    gems: [],
    hitEffects: [],
    lives: INITIAL_LIVES,
    isInvincible: false,
    invincibleUntil: 0,
    score: 0,
    timeLeft: GAME_DURATION,
    lastScoreTick: 0,
    lastEnemySpawn: 0,
    lastGemSpawn: 0,
    nextEnemyId: 0,
    nextGemId: 0,
    nextEffectId: 0,
    gameStartTime: 0,
  };
}

export default function PathOfThePupaRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get('product');
  const shouldReduceMotion = useReducedMotion();

  const { addDiscount, removeDiscount, cart } = useCart();

  // React state for game lifecycle - this controls when the game loop runs
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'completed'>('idle');

  // Ref for all other game state (no re-renders during gameplay)
  const gameStateRef = useRef<GameStateData>(createInitialGameState());

  // Render state - incremented to trigger React renders at 30fps
  const [renderTick, setRenderTick] = useState(0);

  // UI-only state
  const [showResults, setShowResults] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  // Refs for animation loop
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number>(0);
  const renderIntervalRef = useRef<number | undefined>(undefined);

  // Get current game state for rendering
  const gs = gameStateRef.current;

  // Load best score
  useEffect(() => {
    const saved = localStorage.getItem('game:path-of-the-pupa:best-score');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Save best score when game ends
  useEffect(() => {
    if (gameStatus === 'completed' && gs.score > bestScore) {
      setBestScore(gs.score);
      localStorage.setItem('game:path-of-the-pupa:best-score', gs.score.toString());
    }
  }, [gameStatus, gs.score, bestScore]);

  // Helper to clean up game loop resources
  const cleanupGameLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    if (renderIntervalRef.current) {
      clearInterval(renderIntervalRef.current);
      renderIntervalRef.current = undefined;
    }
  }, []);

  // Helper to end the game (called from within game loop)
  const endGame = useCallback(() => {
    // Immediate cleanup - don't wait for React
    cleanupGameLoop();

    // Update React state to trigger re-render and show results
    setGameStatus('completed');
    setShowResults(true);
  }, [cleanupGameLoop]);

  // Main game loop - controlled by React state
  useEffect(() => {
    // Only run when playing
    if (gameStatus !== 'playing') {
      cleanupGameLoop();
      return;
    }

    // Start render interval - triggers React re-render at 30fps for smooth visuals
    renderIntervalRef.current = window.setInterval(() => {
      setRenderTick((t) => t + 1);
    }, 33); // ~30fps for rendering

    lastFrameTimeRef.current = performance.now();

    const gameLoop = (timestamp: number) => {
      const state = gameStateRef.current;

      // Safety check - if game was ended, don't continue
      if (gameStatus !== 'playing') return;

      // Delta time calculation (normalized to 60fps)
      const rawDelta = timestamp - lastFrameTimeRef.current;
      const deltaTime = Math.min(rawDelta / 16.667, 3); // Cap at 3 frames to prevent physics jumps
      lastFrameTimeRef.current = timestamp;

      const now = performance.now();
      const elapsed = (now - state.gameStartTime) / 1000;

      // Update time left
      state.timeLeft = Math.max(0, GAME_DURATION - elapsed);

      // Check game completion (time ran out)
      if (state.timeLeft <= 0) {
        endGame();
        return;
      }

      // Score tick (1 point per second)
      if (now - state.lastScoreTick >= 1000) {
        state.score += POINTS_PER_SECOND;
        state.lastScoreTick = now;
      }

      // Check invincibility expiry
      if (state.isInvincible && now >= state.invincibleUntil) {
        state.isInvincible = false;
      }

      // Spawn enemies
      if (now - state.lastEnemySpawn >= ENEMY_SPAWN_INTERVAL && state.enemies.length < MAX_ENEMIES) {
        const edge = Math.floor(Math.random() * 4);
        let x: number, y: number;
        switch (edge) {
          case 0: x = Math.random() * GAME_WIDTH; y = -20; break;
          case 1: x = GAME_WIDTH + 20; y = Math.random() * GAME_HEIGHT; break;
          case 2: x = Math.random() * GAME_WIDTH; y = GAME_HEIGHT + 20; break;
          default: x = -20; y = Math.random() * GAME_HEIGHT; break;
        }
        const speed = INITIAL_ENEMY_SPEED + (elapsed * ENEMY_SPEED_INCREASE);
        state.enemies.push({ id: state.nextEnemyId++, x, y, speed });
        state.lastEnemySpawn = now;
      }

      // Spawn gems
      if (now - state.lastGemSpawn >= GEM_SPAWN_INTERVAL && state.gems.length < MAX_GEMS) {
        state.gems.push({
          id: state.nextGemId++,
          x: 50 + Math.random() * (GAME_WIDTH - 100),
          y: 50 + Math.random() * (GAME_HEIGHT - 100),
        });
        state.lastGemSpawn = now;
      }

      // Move player toward target
      const target = state.targetPos;
      const dx = target.x - state.playerPos.x;
      const dy = target.y - state.playerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > PLAYER_SPEED * deltaTime) {
        const moveX = (dx / dist) * PLAYER_SPEED * deltaTime;
        const moveY = (dy / dist) * PLAYER_SPEED * deltaTime;

        // Store old position for segment following
        const oldX = state.playerPos.x;
        const oldY = state.playerPos.y;

        state.playerPos.x += moveX;
        state.playerPos.y += moveY;

        // Update segments (snake-like follow)
        if (state.segments.length > 0) {
          // First segment follows head's old position
          const seg0 = state.segments[0];
          const headDx = oldX - seg0.x;
          const headDy = oldY - seg0.y;
          const headDist = Math.sqrt(headDx * headDx + headDy * headDy);

          if (headDist > SEGMENT_SIZE * 0.6) {
            seg0.x += (headDx / headDist) * (headDist - SEGMENT_SIZE * 0.5);
            seg0.y += (headDy / headDist) * (headDist - SEGMENT_SIZE * 0.5);
          }

          // Each segment follows the one before it
          for (let i = 1; i < state.segments.length; i++) {
            const prevSeg = state.segments[i - 1];
            const currSeg = state.segments[i];
            const segDx = prevSeg.x - currSeg.x;
            const segDy = prevSeg.y - currSeg.y;
            const segDist = Math.sqrt(segDx * segDx + segDy * segDy);

            if (segDist > SEGMENT_SIZE * 0.6) {
              currSeg.x += (segDx / segDist) * (segDist - SEGMENT_SIZE * 0.5);
              currSeg.y += (segDy / segDist) * (segDist - SEGMENT_SIZE * 0.5);
            }
          }
        }
      }

      // Move enemies toward player
      const speedMult = 1 + (elapsed * ENEMY_SPEED_INCREASE / INITIAL_ENEMY_SPEED);
      for (const enemy of state.enemies) {
        const edx = state.playerPos.x - enemy.x;
        const edy = state.playerPos.y - enemy.y;
        const edist = Math.sqrt(edx * edx + edy * edy);

        if (edist > 1) {
          const speed = enemy.speed * speedMult * deltaTime;
          enemy.x += (edx / edist) * speed;
          enemy.y += (edy / edist) * speed;
        }
      }

      // Check enemy collisions
      if (!state.isInvincible) {
        let wasHit = false;
        let hitX = 0, hitY = 0;

        for (const enemy of state.enemies) {
          // Check head collision
          const headDx = enemy.x - state.playerPos.x;
          const headDy = enemy.y - state.playerPos.y;
          const headDistSq = headDx * headDx + headDy * headDy;
          const hitRadius = (HEAD_SIZE / 2 + ENEMY_SIZE / 2);

          if (headDistSq < hitRadius * hitRadius) {
            wasHit = true;
            hitX = enemy.x;
            hitY = enemy.y;
            break;
          }

          // Check segment collisions
          for (const segment of state.segments) {
            const segDx = enemy.x - segment.x;
            const segDy = enemy.y - segment.y;
            const segDistSq = segDx * segDx + segDy * segDy;
            const segHitRadius = (SEGMENT_SIZE / 2 + ENEMY_SIZE / 2);

            if (segDistSq < segHitRadius * segHitRadius) {
              wasHit = true;
              hitX = enemy.x;
              hitY = enemy.y;
              break;
            }
          }
          if (wasHit) break;
        }

        if (wasHit) {
          state.lives -= 1;

          // Add hit effect
          state.hitEffects.push({
            id: state.nextEffectId++,
            x: hitX,
            y: hitY,
            createdAt: now,
          });

          if (state.lives <= 0) {
            endGame();
            return;
          } else {
            state.isInvincible = true;
            state.invincibleUntil = now + INVINCIBILITY_DURATION;
          }
        }
      }

      // Check gem collisions
      const gemsToRemove: number[] = [];
      for (const gem of state.gems) {
        const gdx = gem.x - state.playerPos.x;
        const gdy = gem.y - state.playerPos.y;
        const gdistSq = gdx * gdx + gdy * gdy;
        const gemHitRadius = (HEAD_SIZE / 2 + GEM_SIZE / 2);

        if (gdistSq < gemHitRadius * gemHitRadius) {
          // Collect gem
          state.score += POINTS_PER_GEM;
          gemsToRemove.push(gem.id);

          // Add a segment
          const lastPos = state.segments.length > 0
            ? state.segments[state.segments.length - 1]
            : state.playerPos;
          state.segments.push({ x: lastPos.x, y: lastPos.y });

          // Add hit effect
          state.hitEffects.push({
            id: state.nextEffectId++,
            x: gem.x,
            y: gem.y,
            createdAt: now,
          });
        }
      }

      // Remove collected gems
      if (gemsToRemove.length > 0) {
        state.gems = state.gems.filter((g) => !gemsToRemove.includes(g.id));
      }

      // Clean up old hit effects (after 500ms)
      state.hitEffects = state.hitEffects.filter((e) => now - e.createdAt < 500);

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    // Cleanup on unmount or when gameStatus changes
    return cleanupGameLoop;
  }, [gameStatus, endGame, cleanupGameLoop]);

  // Handle pointer/touch input
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (gameStatus !== 'playing') return;

      const rect = gameAreaRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = Math.max(HEAD_SIZE / 2, Math.min(e.clientX - rect.left, GAME_WIDTH - HEAD_SIZE / 2));
      const y = Math.max(HEAD_SIZE / 2, Math.min(e.clientY - rect.top, GAME_HEIGHT - HEAD_SIZE / 2));

      gameStateRef.current.targetPos = { x, y };
    },
    [gameStatus]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (gameStatus !== 'playing') return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handlePointerMove(e);
    },
    [gameStatus, handlePointerMove]
  );

  const handleStartGame = useCallback(() => {
    // Clean up any existing game loop first
    cleanupGameLoop();

    // Reset game state
    const now = performance.now();
    gameStateRef.current = {
      ...createInitialGameState(),
      gameStartTime: now,
      lastScoreTick: now,
      lastEnemySpawn: now - ENEMY_SPAWN_INTERVAL + 500, // First enemy spawns after 500ms
      lastGemSpawn: now,
      enemies: [
        { id: 0, x: 30, y: 30, speed: INITIAL_ENEMY_SPEED },
        { id: 1, x: GAME_WIDTH - 30, y: 30, speed: INITIAL_ENEMY_SPEED },
        { id: 2, x: 30, y: GAME_HEIGHT - 30, speed: INITIAL_ENEMY_SPEED },
      ],
      gems: [{
        id: 0,
        x: 50 + Math.random() * (GAME_WIDTH - 100),
        y: 50 + Math.random() * (GAME_HEIGHT - 100),
      }],
      nextEnemyId: 3,
      nextGemId: 1,
    };

    // Update React state to trigger game loop
    setShowResults(false);
    setGameStatus('playing');
  }, [cleanupGameLoop]);

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

  // Render hearts for lives
  const renderLives = () => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
          <motion.span
            key={i}
            className={`text-xl ${i < gs.lives ? 'opacity-100' : 'opacity-30'}`}
            animate={i < gs.lives && !shouldReduceMotion ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
          >
            {i < gs.lives ? '💚' : '🖤'}
          </motion.span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-ranch-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-sm text-amber-500/70 uppercase tracking-widest mb-1 font-display-600">
            {HORROR_COPY.games.pathOfThePupa?.survivalStage || 'Survival Stage'}
          </p>
          <h1 className="text-3xl text-ranch-lime mb-2 font-display-800">
            {HORROR_COPY.games.pathOfThePupa?.title || 'Path of the Pupa'}
          </h1>
          <p className="text-ranch-lavender text-lg font-display-600">
            {HORROR_COPY.games.pathOfThePupa?.survivalDescription || 'Flee. Survive. Grow at your own risk.'}
          </p>
          {bestScore > 0 && (
            <p className="text-ranch-cyan text-lg mt-1 font-display-600">
              Best: {bestScore}
            </p>
          )}
        </div>

        {/* Game UI - Before start */}
        {gameStatus === 'idle' && (
          <div className="text-center space-y-6">
            <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-8">
              <p className="text-lg text-ranch-cream leading-relaxed text-center font-display-600">
                Move your finger or mouse to flee from the pursuers.
              </p>
              <p className="text-lg text-ranch-lavender mt-2 text-center font-display-600">
                Collect gems for bonus points... but each one makes you bigger.
              </p>
              <p className="text-sm text-ranch-pink/70 mt-4 text-center font-display-500">
                Bigger means easier to catch. Choose wisely.
              </p>
            </div>

            {/* Visual Instructions */}
            <div className="grid grid-cols-2 gap-3">
              {/* Flee from enemies */}
              <div className="bg-ranch-dark/50 rounded-lg p-4 border-2 border-ranch-pink/50">
                <div className="flex justify-center mb-2">
                  <div className="relative">
                    <span className="text-4xl">👹</span>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-ranch-pink rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✕</span>
                    </div>
                  </div>
                </div>
                <p className="text-ranch-pink font-display-700 text-sm">FLEE</p>
                <p className="text-ranch-cream/70 text-xs mt-1">Enemies chase you</p>
                <p className="text-ranch-pink text-xs mt-1">-1 life if caught</p>
              </div>

              {/* Collect gems (risky) */}
              <div className="bg-ranch-dark/50 rounded-lg p-4 border-2 border-ranch-cyan/50">
                <div className="flex justify-center mb-2">
                  <div className="relative">
                    <span className="text-4xl">💎</span>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-ranch-cyan rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">?</span>
                    </div>
                  </div>
                </div>
                <p className="text-ranch-cyan font-display-700 text-sm">COLLECT</p>
                <p className="text-ranch-cream/70 text-xs mt-1">+{POINTS_PER_GEM} points each</p>
                <p className="text-ranch-pink text-xs mt-1">Makes you bigger!</p>
              </div>
            </div>

            {/* Legend row */}
            <div className="bg-ranch-dark/50 border border-ranch-purple/30 rounded-lg p-3">
              <div className="flex items-center justify-center gap-8 text-xl">
                <div className="flex items-center gap-2">
                  <span>🐍</span>
                  <span className="text-xs text-ranch-lime">You</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💚💚💚</span>
                  <span className="text-xs text-ranch-cream">{INITIAL_LIVES} Lives</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full px-6 py-4 bg-ranch-lime text-ranch-dark rounded-lg text-lg hover:bg-ranch-cyan transition-colors font-display-700"
            >
              Begin the Chase
            </button>
          </div>
        )}

        {/* Game UI - Playing */}
        {gameStatus === 'playing' && (
          <div className="space-y-4">
            {/* HUD */}
            <div className="flex gap-4 items-center">
              <GameTimer timeLeft={Math.ceil(gs.timeLeft)} className="flex-1" />
              <div className="flex-shrink-0">{renderLives()}</div>
              <GameScore score={gs.score} showProgress={true} className="flex-1" />
            </div>

            {/* Game Area */}
            <div
              ref={gameAreaRef}
              className="relative bg-gradient-to-b from-ranch-purple/10 to-ranch-dark/90 border-2 border-ranch-purple rounded-lg overflow-hidden touch-none cursor-none select-none"
              style={{ width: '100%', height: `${GAME_HEIGHT}px` }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
            >
              {/* Gems - Using CSS transforms for performance */}
              {gs.gems.map((gem) => (
                <div
                  key={gem.id}
                  className="absolute pointer-events-none"
                  style={{
                    transform: `translate(${gem.x - GEM_SIZE / 2}px, ${gem.y - GEM_SIZE / 2}px)`,
                    width: GEM_SIZE,
                    height: GEM_SIZE,
                  }}
                >
                  <span
                    className="text-2xl drop-shadow-[0_0_8px_rgba(0,206,209,0.8)] animate-pulse"
                  >
                    💎
                  </span>
                </div>
              ))}

              {/* Player segments (body) - Using CSS transforms */}
              {gs.segments.map((segment, i) => (
                <div
                  key={i}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    transform: `translate(${segment.x - SEGMENT_SIZE / 2}px, ${segment.y - SEGMENT_SIZE / 2}px)`,
                    width: SEGMENT_SIZE,
                    height: SEGMENT_SIZE,
                    backgroundColor: gs.isInvincible ? 'rgba(50, 205, 50, 0.4)' : 'rgba(50, 205, 50, 0.7)',
                    boxShadow: gs.isInvincible
                      ? '0 0 10px rgba(50, 205, 50, 0.3)'
                      : '0 0 6px rgba(50, 205, 50, 0.5)',
                    opacity: gs.isInvincible ? 0.6 : 1,
                  }}
                />
              ))}

              {/* Player head (snake) - Using CSS transforms */}
              <div
                className="absolute pointer-events-none"
                style={{
                  transform: `translate(${gs.playerPos.x - HEAD_SIZE / 2}px, ${gs.playerPos.y - HEAD_SIZE / 2}px)`,
                  width: HEAD_SIZE,
                  height: HEAD_SIZE,
                  opacity: gs.isInvincible ? 0.6 : 1,
                }}
              >
                <span
                  className="text-3xl"
                  style={{
                    filter: gs.isInvincible
                      ? 'drop-shadow(0 0 12px rgba(50, 205, 50, 0.8))'
                      : 'drop-shadow(0 0 6px rgba(50, 205, 50, 0.5))',
                  }}
                >
                  🐍
                </span>
              </div>

              {/* Enemies - Using CSS transforms */}
              {gs.enemies.map((enemy) => (
                <div
                  key={enemy.id}
                  className="absolute pointer-events-none"
                  style={{
                    transform: `translate(${enemy.x - ENEMY_SIZE / 2}px, ${enemy.y - ENEMY_SIZE / 2}px)`,
                    width: ENEMY_SIZE,
                    height: ENEMY_SIZE,
                  }}
                >
                  <span className="text-2xl drop-shadow-[0_0_6px_rgba(255,20,147,0.6)]">
                    👹
                  </span>
                </div>
              ))}

              {/* Hit effects - CSS animation only */}
              {gs.hitEffects.map((effect) => (
                <div
                  key={effect.id}
                  className="absolute pointer-events-none text-3xl animate-ping"
                  style={{
                    transform: `translate(${effect.x - 20}px, ${effect.y - 20}px)`,
                  }}
                >
                  💥
                </div>
              ))}

              {/* Target cursor indicator */}
              <div
                className="absolute w-3 h-3 rounded-full bg-ranch-cyan/50 pointer-events-none animate-pulse"
                style={{
                  transform: `translate(${gs.targetPos.x - 6}px, ${gs.targetPos.y - 6}px)`,
                }}
              />
            </div>

            {/* Instructions during play */}
            <div className="text-center text-sm text-ranch-lavender/60">
              {gs.segments.length > 0 && (
                <span className="text-ranch-pink">
                  Size: {gs.segments.length + 1} segments • Easier to catch!
                </span>
              )}
              {gs.segments.length === 0 && 'Move to flee • Collect gems to grow (risky!)'}
            </div>
          </div>
        )}

        {/* Game Results */}
        {showResults && (
          <GameResults
            score={gs.score}
            onApplyDiscount={handleApplyDiscount}
            onRetry={handleStartGame}
          />
        )}
      </div>
    </div>
  );
}
