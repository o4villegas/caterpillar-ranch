/**
 * Larva Launch — Survival Defense
 *
 * Theme: "Protect the Motherboard" — Defend against parasite invasion
 *
 * Horror-themed tower defense slingshot game. Parasites descend from above
 * and you must eliminate them before they reach the motherboard (launcher zone).
 *
 * SURVIVAL MODE: Stay alive for 30 seconds to earn maximum discount!
 *
 * Mechanics:
 * - 30 second survival duration
 * - 3 lives (launchers) - lose one each time a parasite reaches the motherboard
 * - Difficulty ramps up: starts slow, gets intense
 * - Drag caterpillar back to aim, release to launch
 *
 * Scoring (Time-based tiers):
 * - Survive 30s = 15% discount
 * - Survive 25s = 12% discount
 * - Survive 20s = 9% discount
 * - Survive 15s = 6% discount
 * - Survive 10s = 3% discount
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { GameTimer } from '../lib/components/Games/GameTimer';
import { useCart } from '../lib/contexts/CartContext';
import type { Route } from './+types/games.larva-launch';

// === SURVIVAL MODE SETTINGS ===
const GAME_DURATION = 30; // seconds - survive to win!
const MAX_LIVES = 3; // Parasites that can reach motherboard before game over
const MAX_PROJECTILES = 8; // Cap to prevent performance issues
const MOTHERBOARD_Y = 250; // Y position of the "motherboard" defense line

// Difficulty ramping (spawn interval in ms)
const SPAWN_INTERVAL_START = 2000; // Easy start - 2 seconds between spawns
const SPAWN_INTERVAL_END = 600; // Intense end - 0.6 seconds between spawns

// Parasite speed ramping
const PARASITE_SPEED_START = 0.4; // Slow at first
const PARASITE_SPEED_END = 1.2; // Fast at the end

// Golden parasites (worth more, but also faster)
const GOLDEN_PARASITE_CHANCE = 0.12;

// Pre-allocated array for lives HUD (avoid creating new array on every render)
const LIVES_INDICES = [0, 1, 2] as const;

// Physics
const LAUNCH_POWER_MULTIPLIER = 0.15;
const GRAVITY = 0.3;
const MAX_PULL_DISTANCE = 120;

interface Parasite {
  id: number;
  x: number;
  y: number;
  speed: number; // Individual speed (moves downward)
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

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Larva Launch — Defense | Caterpillar Ranch' },
    {
      name: 'description',
      content: 'Launch defenders to protect the sacred leaves. Prove your care.',
    },
  ];
}

// Calculate discount based on survival time
function calculateDiscount(survivalTime: number): number {
  if (survivalTime >= 30) return 15;
  if (survivalTime >= 25) return 12;
  if (survivalTime >= 20) return 9;
  if (survivalTime >= 15) return 6;
  if (survivalTime >= 10) return 3;
  return 0;
}

// Calculate difficulty multiplier (0 to 1) based on elapsed time
function getDifficultyMultiplier(elapsedSeconds: number): number {
  return Math.min(elapsedSeconds / GAME_DURATION, 1);
}

export default function LarvaLaunchRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get('product');

  const { addDiscount, removeDiscount, cart } = useCart();

  // Game state
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'completed' | 'gameover'>('idle');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [lives, setLives] = useState(MAX_LIVES);
  const [survivalTime, setSurvivalTime] = useState(0);
  const [killCount, setKillCount] = useState(0);

  const [parasites, setParasites] = useState<Parasite[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [splats, setSplats] = useState<SplatEffect[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [bestSurvival, setBestSurvival] = useState(0);

  // Slingshot state
  const [isDragging, setIsDragging] = useState(false);
  const [pullCurrent, setPullCurrent] = useState({ x: 0, y: 0 });
  const [activeLauncher, setActiveLauncher] = useState<number | null>(null);

  // Refs for physics loop (avoid stale closures)
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const parasitesRef = useRef<Parasite[]>([]);
  const livesRef = useRef(MAX_LIVES);
  const gameStatusRef = useRef<'idle' | 'playing' | 'completed' | 'gameover'>('idle');
  const gameStartTimeRef = useRef<number>(0);
  const nextParasiteId = useRef(0);
  const nextProjectileId = useRef(0);
  const nextSplatId = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const splatTimeoutsRef = useRef<Set<number>>(new Set()); // Use Set for O(1) add/delete
  const lastFrameTimeRef = useRef<number>(0);
  const activePointerIdRef = useRef<number | null>(null); // Track pointer for cleanup on unmount
  const lastSpawnTimeRef = useRef<number>(0);
  const gameAreaWidthRef = useRef(360); // Track game area width for responsive bounds

  // Keep refs in sync with state
  useEffect(() => {
    parasitesRef.current = parasites;
  }, [parasites]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);

  // Calculate responsive launcher positions based on container width
  // Position launchers at bottom as the "motherboard" defense line
  // NOTE: Empty deps is intentional - this is a pure function that only reads from refs
  const getResponsiveLauncherPositions = useCallback(() => {
    const width = gameAreaRef.current?.offsetWidth || 360;
    const spacing = width / 4;
    return [
      { x: spacing, y: 340 },
      { x: spacing * 2, y: 340 },
      { x: spacing * 3, y: 340 },
    ];
  }, []); // Intentionally empty - pure function using only refs

  const [launcherPositions, setLauncherPositions] = useState([
    { x: 90, y: 340 },
    { x: 180, y: 340 },
    { x: 270, y: 340 },
  ]);

  // Update launcher positions on mount and resize
  useEffect(() => {
    const updatePositions = () => {
      const width = gameAreaRef.current?.offsetWidth || 360;
      gameAreaWidthRef.current = width;
      setLauncherPositions(getResponsiveLauncherPositions());
    };
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [getResponsiveLauncherPositions]);

  // Load best survival time from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('game:larva-launch:best-survival');
    if (saved) setBestSurvival(parseInt(saved, 10));
  }, []);

  // Save best survival time
  useEffect(() => {
    if (survivalTime > bestSurvival && (gameStatus === 'completed' || gameStatus === 'gameover')) {
      setBestSurvival(survivalTime);
      localStorage.setItem('game:larva-launch:best-survival', survivalTime.toString());
    }
  }, [survivalTime, bestSurvival, gameStatus]);

  // Cleanup splat timeouts on unmount or game end
  useEffect(() => {
    return () => {
      splatTimeoutsRef.current.forEach((id) => clearTimeout(id));
      splatTimeoutsRef.current.clear();
    };
  }, []);

  // Reset drag state when game ends (fix pointer capture stuck)
  useEffect(() => {
    if (gameStatus !== 'playing') {
      setIsDragging(false);
      setActiveLauncher(null);
    }
  }, [gameStatus]);

  // Release pointer capture on unmount to prevent browser issues
  useEffect(() => {
    return () => {
      if (activePointerIdRef.current !== null && gameAreaRef.current) {
        try {
          gameAreaRef.current.releasePointerCapture(activePointerIdRef.current);
        } catch {
          // Pointer capture may already be released or element unmounted
        }
      }
    };
  }, []);

  // Spawn parasite at top, moving downward with difficulty-based speed
  const spawnParasite = useCallback((difficultyMult: number) => {
    const id = nextParasiteId.current++;
    const isGolden = Math.random() < GOLDEN_PARASITE_CHANCE;

    // Speed increases with difficulty
    const baseSpeed = PARASITE_SPEED_START + (PARASITE_SPEED_END - PARASITE_SPEED_START) * difficultyMult;
    const speed = baseSpeed * (0.8 + Math.random() * 0.4); // ±20% variation

    // Use responsive width for spawn position
    const spawnWidth = gameAreaWidthRef.current - 60; // 30px padding on each side
    const newParasite: Parasite = {
      id,
      x: 30 + Math.random() * spawnWidth, // Spawn across top (responsive)
      y: -20, // Start above visible area
      speed: isGolden ? speed * 1.3 : speed, // Golden are faster
      isGolden,
      size: isGolden ? 50 : 40,
    };
    setParasites((prev) => [...prev, newParasite]);
  }, []);

  // Game timer and spawn controller
  useEffect(() => {
    if (gameStatus !== 'playing') {
      return;
    }

    // Timer tick every 100ms for smooth countdown
    const timerInterval = setInterval(() => {
      // Don't update timer if game is no longer playing
      if (gameStatusRef.current !== 'playing') {
        clearInterval(timerInterval);
        return;
      }

      // Safety check: ensure game start time is set before calculating elapsed
      if (gameStartTimeRef.current <= 0) return;

      const elapsed = (performance.now() - gameStartTimeRef.current) / 1000;
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setTimeLeft(Math.ceil(remaining));
      setSurvivalTime(Math.floor(elapsed));

      // Check for win condition
      if (remaining <= 0) {
        gameStatusRef.current = 'completed';
        setGameStatus('completed');
        clearInterval(timerInterval);
      }
    }, 100);

    // Spawn controller - checks if it's time to spawn based on difficulty
    const spawnController = setInterval(() => {
      // Don't spawn if game is no longer playing
      if (gameStatusRef.current !== 'playing') return;

      const elapsed = (performance.now() - gameStartTimeRef.current) / 1000;
      const difficultyMult = getDifficultyMultiplier(elapsed);

      // Calculate current spawn interval
      const currentInterval = SPAWN_INTERVAL_START -
        (SPAWN_INTERVAL_START - SPAWN_INTERVAL_END) * difficultyMult;

      const timeSinceLastSpawn = performance.now() - lastSpawnTimeRef.current;

      if (timeSinceLastSpawn >= currentInterval) {
        spawnParasite(difficultyMult);
        lastSpawnTimeRef.current = performance.now();

        // Occasionally spawn extra parasite in late game
        if (difficultyMult > 0.7 && Math.random() < 0.3) {
          setTimeout(() => {
            if (gameStatusRef.current === 'playing') {
              // Recalculate difficulty at spawn time (not when setTimeout was created)
              const currentElapsed = (performance.now() - gameStartTimeRef.current) / 1000;
              spawnParasite(getDifficultyMultiplier(currentElapsed));
            }
          }, 200);
        }
      }
    }, 100);

    // Initial spawn after brief delay
    const initialSpawnTimeout = setTimeout(() => {
      if (gameStatusRef.current === 'playing') {
        spawnParasite(0);
        lastSpawnTimeRef.current = performance.now();
      }
    }, 500);

    return () => {
      clearInterval(timerInterval);
      clearInterval(spawnController);
      clearTimeout(initialSpawnTimeout);
    };
  }, [gameStatus, spawnParasite]);

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
      // Remove from tracking Set
      splatTimeoutsRef.current.delete(timeoutId);
    }, 500);

    splatTimeoutsRef.current.add(timeoutId);
  }, []);

  // Physics update loop - handles projectiles and parasites moving toward motherboard
  useEffect(() => {
    if (gameStatus !== 'playing') {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    lastFrameTimeRef.current = performance.now();

    const updatePhysics = () => {
      // Exit early if game is no longer playing
      if (gameStatusRef.current !== 'playing') {
        return;
      }

      const now = performance.now();
      // Normalize to 60 FPS reference frame (works correctly on 120Hz+ displays)
      const rawDelta = (now - lastFrameTimeRef.current) / 1000;
      const deltaTime = Math.min(rawDelta * 60, 3); // Cap at 3 frames to prevent physics jumps
      lastFrameTimeRef.current = now;

      // Get current parasites from ref for direct mutation tracking
      const currentParasites = [...parasitesRef.current];
      const surviving: Parasite[] = [];
      const invadingParasites: Parasite[] = [];

      // Process parasite movement and detect invasions
      for (const p of currentParasites) {
        const newY = p.y + p.speed * deltaTime;

        if (newY >= MOTHERBOARD_Y) {
          invadingParasites.push(p);
        } else {
          surviving.push({ ...p, y: newY });
        }
      }

      // Handle invasions immediately (before React batches state updates)
      if (invadingParasites.length > 0) {
        // Create all invasion splats at once (batched to reduce setState calls)
        const newSplats = invadingParasites.map((p) => ({
          id: nextSplatId.current++,
          x: p.x,
          y: MOTHERBOARD_Y,
          color: '#FF3333', // Red for invasion damage
        }));

        setSplats((s) => [...s, ...newSplats]);

        // Set up cleanup timeouts for each splat
        newSplats.forEach((splat) => {
          const timeoutId = window.setTimeout(() => {
            setSplats((s) => s.filter((sp) => sp.id !== splat.id));
            splatTimeoutsRef.current.delete(timeoutId);
          }, 500);
          splatTimeoutsRef.current.add(timeoutId);
        });

        // Update lives ref immediately for accurate loop control
        const newLives = Math.max(0, livesRef.current - invadingParasites.length);
        livesRef.current = newLives;
        setLives(newLives);

        if (newLives === 0) {
          // Game over - update ref and state
          gameStatusRef.current = 'gameover';
          setGameStatus('gameover');
          setParasites(surviving);
          return; // Exit physics loop
        }
      }

      // Update ref BEFORE setState to avoid race conditions in physics loop
      parasitesRef.current = surviving;
      setParasites(surviving);

      // Process projectiles and collisions
      const areaWidth = gameAreaWidthRef.current;
      setProjectiles((prev) => {
        const updated: Projectile[] = [];
        const hits: { parasiteId: number; x: number; y: number; isGolden: boolean }[] = [];

        for (const proj of prev) {
          // Apply gravity with delta time
          const newVy = proj.vy + GRAVITY * deltaTime;
          const newX = proj.x + proj.vx * deltaTime;
          const newY = proj.y + newVy * deltaTime;

          // Check if out of bounds (responsive width)
          if (newX < -20 || newX > areaWidth + 20 || newY < -20 || newY > 420) {
            continue;
          }

          // Check collision with surviving parasites using squared distance (avoid Math.sqrt in hot loop)
          // Note: Each projectile can only hit ONE parasite (break after first hit prevents double-counting)
          let hit = false;
          for (const parasite of surviving) {
            const dx = newX - parasite.x;
            const dy = newY - parasite.y;
            const distSquared = dx * dx + dy * dy;
            const radiusSum = parasite.size / 2 + 15;

            if (distSquared < radiusSum * radiusSum) {
              hit = true;
              hits.push({
                parasiteId: parasite.id,
                x: parasite.x,
                y: parasite.y,
                isGolden: parasite.isGolden,
              });
              break; // Exit loop - projectile consumed by this parasite
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

        // Process hits AFTER the projectile loop (use Set for O(1) lookup instead of Array.includes)
        if (hits.length > 0) {
          const hitIdSet = new Set(hits.map((h) => h.parasiteId));
          const afterHits = surviving.filter((parasite) => !hitIdSet.has(parasite.id));
          // Update ref BEFORE setState to avoid race conditions
          parasitesRef.current = afterHits;
          setParasites(afterHits);
          setKillCount((c) => c + hits.length);

          for (const hit of hits) {
            createSplat(hit.x, hit.y, hit.isGolden);
          }
        }

        return updated;
      });

      // Continue loop if still playing, otherwise clear ref to prevent memory leak
      if (gameStatusRef.current === 'playing' && livesRef.current > 0) {
        animationFrameRef.current = requestAnimationFrame(updatePhysics);
      } else {
        animationFrameRef.current = undefined;
      }
    };

    animationFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameStatus, createSplat]);

  // Show results when game completes or game over
  useEffect(() => {
    if (gameStatus === 'completed' || gameStatus === 'gameover') {
      setShowResults(true);
      // Clear any remaining splat timeouts
      splatTimeoutsRef.current.forEach((id) => clearTimeout(id));
      splatTimeoutsRef.current.clear();
    }
  }, [gameStatus]);

  // Handle touch/mouse start
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, launcherIndex: number) => {
      if (gameStatus !== 'playing') return;
      // Check if this launcher is still alive
      if (launcherIndex >= lives) return;

      const rect = gameAreaRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsDragging(true);
      setActiveLauncher(launcherIndex);
      setPullCurrent({ x, y });

      // Store pointer ID for cleanup on unmount
      activePointerIdRef.current = e.pointerId;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [gameStatus, lives]
  );

  // Handle touch/mouse move
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || activeLauncher === null) return;

      const rect = gameAreaRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Limit pull distance (optimized: use squared distance check, avoid trig functions)
      const launcher = launcherPositions[activeLauncher];
      if (!launcher) return;

      const dx = x - launcher.x;
      const dy = y - launcher.y;
      const distSquared = dx * dx + dy * dy;
      const maxDistSquared = MAX_PULL_DISTANCE * MAX_PULL_DISTANCE;

      if (distSquared > maxDistSquared) {
        // Only compute sqrt when needed, use normalized vector instead of atan2/cos/sin
        const distance = Math.sqrt(distSquared);
        const scale = MAX_PULL_DISTANCE / distance;
        setPullCurrent({
          x: launcher.x + dx * scale,
          y: launcher.y + dy * scale,
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
      activePointerIdRef.current = null;

      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture may already be released
      }
    },
    [isDragging, activeLauncher, pullCurrent, launcherPositions, projectiles.length]
  );

  // Keyboard controls for accessibility (Tab to select, Arrow keys to aim, Space/Enter to fire)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      // Tab to cycle through alive launchers
      if (e.key === 'Tab') {
        e.preventDefault();
        // Find next alive launcher
        const currentIdx = activeLauncher ?? -1;
        let nextIdx = (currentIdx + 1) % MAX_LIVES;
        // Skip dead launchers
        while (nextIdx !== currentIdx && nextIdx >= lives) {
          nextIdx = (nextIdx + 1) % MAX_LIVES;
          if (currentIdx === -1 && nextIdx === 0) break; // Prevent infinite loop when starting
        }
        if (nextIdx < lives) {
          setActiveLauncher(nextIdx);
          if (!isDragging) {
            // Start aiming when selecting via keyboard
            const launcher = launcherPositions[nextIdx];
            if (launcher) {
              setIsDragging(true);
              setPullCurrent({ x: launcher.x, y: launcher.y + 60 }); // Default aim down
            }
          }
        }
        return;
      }

      // Arrow keys to adjust aim when launcher selected and dragging
      if (activeLauncher !== null && isDragging) {
        const aimSpeed = 8;
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setPullCurrent((p) => ({ ...p, y: Math.max(0, p.y - aimSpeed) }));
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setPullCurrent((p) => ({ ...p, y: Math.min(400, p.y + aimSpeed) }));
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setPullCurrent((p) => ({ ...p, x: Math.max(0, p.x - aimSpeed) }));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          const maxX = gameAreaWidthRef.current;
          setPullCurrent((p) => ({ ...p, x: Math.min(maxX, p.x + aimSpeed) }));
        }
      }

      // Space or Enter to fire (when aiming)
      if ((e.key === ' ' || e.key === 'Enter') && isDragging && activeLauncher !== null) {
        e.preventDefault();
        const launcher = launcherPositions[activeLauncher];
        if (!launcher) return;

        const dx = launcher.x - pullCurrent.x;
        const dy = launcher.y - pullCurrent.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 20 && projectiles.length < MAX_PROJECTILES) {
          const id = nextProjectileId.current++;
          const vx = dx * LAUNCH_POWER_MULTIPLIER;
          const vy = dy * LAUNCH_POWER_MULTIPLIER;

          setProjectiles((prev) => [
            ...prev,
            { id, x: launcher.x, y: launcher.y, vx, vy },
          ]);
        }

        setIsDragging(false);
        setActiveLauncher(null);
      }
    },
    [gameStatus, activeLauncher, isDragging, lives, launcherPositions, pullCurrent, projectiles.length]
  );

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleStartGame = useCallback(() => {
    setShowResults(false);
    setParasites([]);
    setProjectiles([]);
    setSplats([]);
    setIsDragging(false);
    setActiveLauncher(null);
    setLives(MAX_LIVES);
    setTimeLeft(GAME_DURATION);
    setSurvivalTime(0);
    setKillCount(0);
    // Reset refs
    nextParasiteId.current = 0;
    nextProjectileId.current = 0;
    lastSpawnTimeRef.current = 0;
    gameStartTimeRef.current = performance.now();
    livesRef.current = MAX_LIVES;
    parasitesRef.current = [];
    gameStatusRef.current = 'playing';
    // Clear any remaining splat timeouts
    splatTimeoutsRef.current.forEach((id) => clearTimeout(id));
    splatTimeoutsRef.current.clear();
    // Start the game
    setGameStatus('playing');
  }, []);

  const handleApplyDiscount = useCallback(() => {
    const discount = calculateDiscount(survivalTime);

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
  }, [survivalTime, productSlug, cart.discounts, addDiscount, removeDiscount, navigate]);

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
          <p className="text-sm text-red-500/70 uppercase tracking-widest mb-1 font-display-600">
            🛡️ SURVIVAL MODE
          </p>
          <h1 className="text-3xl text-ranch-lime mb-2 font-display-800">
            Larva Launch
          </h1>
          <p className="text-ranch-lavender text-lg font-display-600">
            Protect the motherboard from invasion!
          </p>
          {bestSurvival > 0 && (
            <p className="text-ranch-cyan text-lg mt-1 font-display-600">
              Best: {bestSurvival}s survived
            </p>
          )}
        </div>

        {/* Game UI - Before start */}
        {gameStatus === 'idle' && (
          <div className="text-center space-y-6">
            <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6">
              <p className="text-lg text-ranch-cream leading-relaxed text-center font-display-600 mb-4">
                Parasites are descending toward your motherboard!
              </p>

              {/* Visual instruction examples */}
              <div className="grid grid-cols-2 gap-3 my-4">
                {/* Your launchers */}
                <div className="bg-ranch-dark/50 rounded-lg p-3 border-2 border-ranch-lime/50">
                  <div className="flex justify-center mb-2">
                    <div className="relative">
                      <span className="text-4xl">🐛</span>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-lg">↖️</div>
                    </div>
                  </div>
                  <p className="text-ranch-lime font-display-700 text-sm">DRAG & RELEASE</p>
                  <p className="text-ranch-cream/70 text-xs mt-1">Pull back to aim</p>
                  <p className="text-ranch-cyan text-xs mt-1">3 launchers = 3 lives</p>
                </div>

                {/* Enemies to eliminate */}
                <div className="bg-ranch-dark/50 rounded-lg p-3 border-2 border-ranch-pink/50">
                  <div className="flex justify-center mb-2 gap-1">
                    <div className="relative">
                      <span className="text-3xl">🦟</span>
                    </div>
                    <div className="relative">
                      <span className="text-3xl drop-shadow-[0_0_4px_gold]">🪲</span>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">★</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-ranch-pink font-display-700 text-sm">ELIMINATE</p>
                  <p className="text-ranch-cream/70 text-xs mt-1">Stop them descending</p>
                  <p className="text-yellow-400 text-xs mt-1">🪲 Golden = faster!</p>
                </div>
              </div>

              <div className="p-3 bg-ranch-dark/50 rounded-lg">
                <p className="text-sm text-red-400 font-display-600">
                  ⚠️ 3 parasites reach the defense line = Game Over
                </p>
                <p className="text-sm text-ranch-lime mt-1 font-display-500">
                  Survive 30 seconds for maximum discount!
                </p>
              </div>
            </div>

            {/* Discount Tiers */}
            <div className="bg-ranch-dark/50 border border-ranch-purple/30 rounded-lg p-4">
              <p className="text-xs text-ranch-lavender/60 uppercase tracking-wider mb-3">
                Discount Tiers
              </p>
              <div className="grid grid-cols-5 gap-2 text-center text-sm">
                <div><span className="text-ranch-lime">30s</span><br/>15%</div>
                <div><span className="text-ranch-cyan">25s</span><br/>12%</div>
                <div><span className="text-yellow-400">20s</span><br/>9%</div>
                <div><span className="text-orange-400">15s</span><br/>6%</div>
                <div><span className="text-red-400">10s</span><br/>3%</div>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full px-6 py-4 bg-ranch-lime text-ranch-dark rounded-lg text-lg hover:bg-ranch-cyan transition-colors font-display-700"
            >
              🛡️ Defend the Motherboard
            </button>
          </div>
        )}

        {/* Game UI - Playing */}
        {gameStatus === 'playing' && (
          <div className="space-y-4">
            {/* HUD - Timer, Lives, Kills */}
            <div className="flex gap-3">
              <GameTimer timeLeft={timeLeft} className="flex-1" />
              <div className="flex-1 bg-ranch-dark/80 border border-ranch-purple rounded-lg p-3 text-center">
                <div className="text-xs text-ranch-lavender/60 uppercase">Lives</div>
                <div className="text-2xl">
                  {/* Use pre-allocated LIVES_INDICES to avoid array allocation on every render */}
                  {LIVES_INDICES.map((i) => (
                    <span key={i} className={i < lives ? 'text-ranch-lime' : 'text-ranch-dark/30'}>
                      🐛
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1 bg-ranch-dark/80 border border-ranch-purple rounded-lg p-3 text-center">
                <div className="text-xs text-ranch-lavender/60 uppercase">Kills</div>
                <div className="text-2xl text-ranch-cyan font-display-700">{killCount}</div>
              </div>
            </div>

            {/* Game Area */}
            <div
              ref={gameAreaRef}
              className="relative bg-gradient-to-b from-ranch-purple/30 to-ranch-dark border-2 border-ranch-purple rounded-lg overflow-hidden touch-none"
              style={{ width: '100%', height: '420px' }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* Motherboard Defense Line */}
              <div
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500/60 to-transparent"
                style={{ top: MOTHERBOARD_Y }}
              />
              <div
                className="absolute left-0 right-0 text-center text-xs text-red-400/50 uppercase tracking-widest"
                style={{ top: MOTHERBOARD_Y + 4 }}
              >
                ⚡ DEFENSE LINE ⚡
              </div>

              {/* Spawn zone indicator */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-red-900/30 to-transparent pointer-events-none" />

              {/* Parasites - Descending toward motherboard (optimized: no Framer Motion) */}
              {parasites.map((parasite) => (
                <div
                  key={parasite.id}
                  className="absolute flex items-center justify-center"
                  style={{
                    transform: `translate(${parasite.x - parasite.size / 2}px, ${parasite.y - parasite.size / 2}px)`,
                    width: parasite.size,
                    height: parasite.size,
                  }}
                >
                  <span
                    className={parasite.isGolden ? 'drop-shadow-[0_0_8px_gold]' : ''}
                    style={{ fontSize: parasite.isGolden ? '2.5rem' : '2rem' }}
                  >
                    {parasite.isGolden ? '🪲' : '🦟'}
                  </span>
                </div>
              ))}

              {/* Splat Effects (optimized: CSS animation only) */}
              {splats.map((splat) => (
                <div
                  key={splat.id}
                  className="absolute pointer-events-none animate-[splat_0.4s_ease-out_forwards]"
                  style={{
                    transform: `translate(${splat.x - 25}px, ${splat.y - 25}px)`,
                    width: 50,
                    height: 50,
                  }}
                >
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      backgroundColor: splat.color,
                      boxShadow: `0 0 12px 6px ${splat.color}`,
                    }}
                  />
                </div>
              ))}

              {/* Projectiles (optimized: no Framer Motion, no rotation) */}
              {projectiles.map((proj) => (
                <div
                  key={proj.id}
                  className="absolute pointer-events-none"
                  style={{
                    transform: `translate(${proj.x - 24}px, ${proj.y - 24}px)`,
                    width: 48,
                    height: 48,
                  }}
                >
                  {/* Simple glow ring using box-shadow (GPU accelerated) */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      boxShadow: '0 0 16px 6px rgba(50,205,50,0.4), 0 0 32px 12px rgba(0,206,209,0.2)',
                    }}
                  />
                  {/* Main caterpillar emoji */}
                  <span className="absolute inset-0 flex items-center justify-center text-4xl">
                    🐛
                  </span>
                </div>
              ))}

              {/* Enhanced Slingshot Visualization */}
              {isDragging && activeLauncher !== null && pullVector && (() => {
                // Bounds check for safety (pullVector check implies launcher exists, but be defensive)
                if (activeLauncher < 0 || activeLauncher >= launcherPositions.length) return null;
                const launcher = launcherPositions[activeLauncher];
                const pullDistance = Math.sqrt(pullVector.x * pullVector.x + pullVector.y * pullVector.y);
                const powerPercent = Math.min(pullDistance / MAX_PULL_DISTANCE, 1);
                const powerColor = powerPercent > 0.7 ? '#32CD32' : powerPercent > 0.4 ? '#FFD700' : '#FF6B6B';

                return (
                  <>
                    {/* Elastic Band Effect - curved lines from launcher to pull point */}
                    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                      {/* Left elastic band */}
                      <path
                        d={`M ${launcher.x - 25} ${launcher.y}
                            Q ${(launcher.x - 25 + pullCurrent.x) / 2} ${pullCurrent.y + 10}
                            ${pullCurrent.x} ${pullCurrent.y}`}
                        stroke={powerColor}
                        strokeWidth={4 + powerPercent * 4}
                        fill="none"
                        opacity={0.8}
                        strokeLinecap="round"
                      />
                      {/* Right elastic band */}
                      <path
                        d={`M ${launcher.x + 25} ${launcher.y}
                            Q ${(launcher.x + 25 + pullCurrent.x) / 2} ${pullCurrent.y + 10}
                            ${pullCurrent.x} ${pullCurrent.y}`}
                        stroke={powerColor}
                        strokeWidth={4 + powerPercent * 4}
                        fill="none"
                        opacity={0.8}
                        strokeLinecap="round"
                      />

                      {/* Trajectory preview dots - using actual physics simulation */}
                      {(() => {
                        // Simulate actual projectile physics
                        const trajectoryPoints = [];
                        let simX = launcher.x;
                        let simY = launcher.y;
                        let simVx = pullVector.x * LAUNCH_POWER_MULTIPLIER;
                        let simVy = pullVector.y * LAUNCH_POWER_MULTIPLIER;

                        // Simulate 5 frames ahead (each step = ~1.5 physics frames)
                        for (let i = 0; i < 5; i++) {
                          simVy += GRAVITY * 1.5;
                          simX += simVx * 1.5;
                          simY += simVy * 1.5;
                          trajectoryPoints.push({
                            x: simX,
                            y: simY,
                            opacity: 0.6 - i * 0.1,
                            radius: 6 - i,
                          });
                        }

                        return trajectoryPoints.map((pt, i) => (
                          <circle
                            key={i}
                            cx={pt.x}
                            cy={pt.y}
                            r={pt.radius}
                            fill={powerColor}
                            opacity={pt.opacity}
                          />
                        ));
                      })()}
                    </svg>

                    {/* Power Meter Bar (simple CSS transition) */}
                    <div
                      className="absolute left-4 bottom-16 w-3 bg-ranch-dark/80 rounded-full border border-ranch-purple/50 overflow-hidden"
                      style={{ height: '100px' }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-100"
                        style={{
                          height: `${powerPercent * 100}%`,
                          backgroundColor: powerColor,
                          boxShadow: `0 0 8px ${powerColor}`,
                        }}
                      />
                    </div>

                    {/* Power percentage label */}
                    <div
                      className="absolute left-8 bottom-28 text-sm font-bold"
                      style={{ color: powerColor }}
                    >
                      {Math.round(powerPercent * 100)}%
                    </div>
                  </>
                );
              })()}

              {/* Launchers - show alive/dead state based on lives (optimized: no Framer Motion) */}
              {launcherPositions.map((pos, index) => {
                const isAlive = index < lives;
                const isActive = activeLauncher === index;

                return (
                  <div
                    key={index}
                    className={`absolute ${isAlive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-not-allowed'} transition-transform`}
                    style={{
                      transform: `translate(${pos.x - 30}px, ${pos.y - 30}px)`,
                      width: 60,
                      height: 60,
                      opacity: isAlive ? 1 : 0.3,
                    }}
                    onPointerDown={isAlive ? (e) => handlePointerDown(e, index) : undefined}
                  >
                    <div
                      className={`w-full h-full rounded-full flex items-center justify-center border-4 transition-colors ${
                        !isAlive
                          ? 'border-red-900/50 bg-red-900/20'
                          : isActive
                          ? 'border-ranch-lime bg-ranch-lime/30'
                          : 'border-ranch-purple bg-ranch-purple/30'
                      }`}
                    >
                      <span className={`text-3xl ${!isAlive ? 'grayscale' : ''}`}>
                        {isAlive ? '🐛' : '💀'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Pull point caterpillar - shows the ammo being pulled back (optimized) */}
              {isDragging && activeLauncher !== null && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    transform: `translate(${pullCurrent.x - 28}px, ${pullCurrent.y - 28}px)`,
                    width: 56,
                    height: 56,
                  }}
                >
                  {/* Glow ring using box-shadow (GPU accelerated) */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      boxShadow: '0 0 20px 10px rgba(50,205,50,0.5), 0 0 40px 20px rgba(0,206,209,0.3)',
                    }}
                  />
                  {/* Caterpillar ready to launch */}
                  <span className="absolute inset-0 flex items-center justify-center text-5xl">
                    🐛
                  </span>
                </div>
              )}
            </div>

            {/* Instructions during play */}
            <div className="text-center text-sm text-ranch-lavender/60">
              Eliminate parasites before they reach the defense line!
            </div>
          </div>
        )}

        {/* Game Results - Survival Mode */}
        {showResults && (
          <div className="text-center space-y-6">
            {/* Result Header */}
            <div className={`p-6 rounded-lg border-2 ${
              gameStatus === 'completed'
                ? 'bg-ranch-lime/10 border-ranch-lime'
                : 'bg-red-900/20 border-red-500'
            }`}>
              <h2 className={`text-3xl font-display-800 ${
                gameStatus === 'completed' ? 'text-ranch-lime' : 'text-red-400'
              }`}>
                {gameStatus === 'completed' ? '🛡️ VICTORY!' : '💀 DEFEATED'}
              </h2>
              <p className="text-ranch-lavender mt-2">
                {gameStatus === 'completed'
                  ? 'You protected the motherboard!'
                  : 'The parasites breached your defenses.'}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-ranch-dark/50 border border-ranch-purple/30 rounded-lg p-4">
                <div className="text-xs text-ranch-lavender/60 uppercase">Survived</div>
                <div className="text-3xl text-ranch-cyan font-display-700">{survivalTime}s</div>
              </div>
              <div className="bg-ranch-dark/50 border border-ranch-purple/30 rounded-lg p-4">
                <div className="text-xs text-ranch-lavender/60 uppercase">Kills</div>
                <div className="text-3xl text-ranch-lime font-display-700">{killCount}</div>
              </div>
            </div>

            {/* Discount Earned */}
            {calculateDiscount(survivalTime) > 0 ? (
              <div className="bg-ranch-lime/20 border-2 border-ranch-lime rounded-lg p-6">
                <div className="text-sm text-ranch-lime uppercase tracking-wider">Discount Earned</div>
                <div className="text-5xl text-ranch-lime font-display-800 mt-2">
                  {calculateDiscount(survivalTime)}% OFF
                </div>
              </div>
            ) : (
              <div className="bg-ranch-dark/50 border border-ranch-purple/30 rounded-lg p-6">
                <div className="text-sm text-ranch-lavender/60">Survive at least 10 seconds to earn a discount</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleStartGame}
                className="flex-1 px-6 py-4 bg-ranch-purple border-2 border-ranch-purple text-ranch-cream rounded-lg text-lg hover:bg-ranch-purple/80 transition-colors font-display-600"
              >
                Try Again
              </button>
              <button
                onClick={handleApplyDiscount}
                className="flex-1 px-6 py-4 bg-ranch-lime text-ranch-dark rounded-lg text-lg hover:bg-ranch-cyan transition-colors font-display-700"
              >
                {calculateDiscount(survivalTime) > 0 ? 'Claim Discount' : 'Continue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
