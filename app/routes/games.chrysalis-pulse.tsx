/**
 * Chrysalis Pulse — Communication Stage
 *
 * Theme: "The Chrysalis" — Sync with their heartbeat
 *
 * Mobile-friendly rhythm/timing game where players tap in sync with
 * expanding pulses from transforming caterpillars.
 *
 * Mechanics:
 * - 25 second duration
 * - Circles expand from center toward target ring
 * - Tap when circle aligns with target for max points
 * - Multiple pulses can be active at once
 * - Progressive difficulty (faster pulses, more overlap)
 *
 * Scoring:
 * - Perfect (within 50ms): +5 points
 * - Good (within 100ms): +3 points
 * - OK (within 200ms): +1 point
 * - Miss: -3 points
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
import type { Route } from './+types/games.chrysalis-pulse';

interface Pulse {
  id: number;
  spawnTime: number;
  hitTime: number; // When it should be tapped (reaches target)
  scale: number; // Current scale (0 to 1.2)
  status: 'active' | 'perfect' | 'good' | 'ok' | 'missed';
  color: string;
}

// === DIFFICULTY SETTINGS ===
const GAME_DURATION = 25; // seconds
const TARGET_SCALE = 0.88; // Scale at which pulse should be tapped (matches inset-4 target ring)
const PULSE_DURATION = 1350; // ms for pulse to reach target
const INITIAL_SPAWN_INTERVAL = 1350; // ms between spawns at start
const MIN_SPAWN_INTERVAL = 700; // ms between spawns at end
const MAX_ACTIVE_PULSES = 2;

// Timing windows (ms from perfect)
const PERFECT_WINDOW = 50;
const GOOD_WINDOW = 100;
const OK_WINDOW = 200;

// Points
const PERFECT_POINTS = 5;
const GOOD_POINTS = 3;
const OK_POINTS = 1;
const MISS_PENALTY = 1;

// Colors for pulses
const PULSE_COLORS = [
  'rgba(50, 205, 50, 0.6)',   // Lime
  'rgba(0, 206, 209, 0.6)',   // Cyan
  'rgba(155, 143, 181, 0.6)', // Lavender
  'rgba(255, 20, 147, 0.6)',  // Pink
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Chrysalis Pulse — Communication | Caterpillar Ranch' },
    { name: 'description', content: 'Sync with their heartbeat. Prove your care.' },
  ];
}

export default function ChrysalisPulseRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get('product');
  const shouldReduceMotion = useReducedMotion();

  const { addDiscount, removeDiscount, cart } = useCart();
  const game = useGameState(GAME_DURATION);

  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [lastHitFeedback, setLastHitFeedback] = useState<{ type: string; id: number } | null>(null);
  const [combo, setCombo] = useState(0);

  const nextPulseId = useRef(0);
  const spawnTimerRef = useRef<number | undefined>(undefined);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const gameStartTimeRef = useRef<number>(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Load best score
  useEffect(() => {
    const saved = localStorage.getItem('game:chrysalis-pulse:best-score');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Save best score
  useEffect(() => {
    if (game.score > bestScore) {
      setBestScore(game.score);
      localStorage.setItem('game:chrysalis-pulse:best-score', game.score.toString());
    }
  }, [game.score, bestScore]);

  // Show results when game completes
  useEffect(() => {
    if (game.status === 'completed') {
      setShowResults(true);
    }
  }, [game.status]);

  // Spawn pulse function
  const spawnPulse = useCallback(() => {
    const now = performance.now();
    const id = nextPulseId.current++;

    const newPulse: Pulse = {
      id,
      spawnTime: now,
      hitTime: now + PULSE_DURATION,
      scale: 0,
      status: 'active',
      color: PULSE_COLORS[id % PULSE_COLORS.length],
    };

    setPulses(prev => {
      // Limit active pulses
      const activePulses = prev.filter(p => p.status === 'active');
      if (activePulses.length >= MAX_ACTIVE_PULSES) {
        return prev;
      }
      return [...prev, newPulse];
    });
  }, []);

  // Game loop - spawn pulses and animate
  useEffect(() => {
    if (game.status !== 'playing') {
      if (spawnTimerRef.current) window.clearInterval(spawnTimerRef.current);
      if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current);
      setPulses([]);
      setCombo(0);
      return;
    }

    gameStartTimeRef.current = performance.now();

    // Spawn first pulse after a short delay
    const initialDelay = setTimeout(() => {
      if (game.status === 'playing') spawnPulse();
    }, 500);

    // Dynamic spawn interval based on game progress
    const spawnController = () => {
      const elapsed = (performance.now() - gameStartTimeRef.current) / 1000;
      const progress = Math.min(elapsed / GAME_DURATION, 1);
      const currentInterval = INITIAL_SPAWN_INTERVAL - (INITIAL_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL) * progress;

      spawnTimerRef.current = window.setTimeout(() => {
        if (game.status === 'playing') {
          spawnPulse();
          spawnController(); // Schedule next spawn
        }
      }, currentInterval);
    };

    // Start spawn controller after initial pulse
    setTimeout(spawnController, 600);

    // Animation loop
    const animate = () => {
      const now = performance.now();

      setPulses(prev => {
        return prev.map(pulse => {
          if (pulse.status !== 'active') return pulse;

          // Calculate scale based on time
          // Scale reaches TARGET_SCALE exactly at hitTime (elapsed = PULSE_DURATION)
          const elapsed = now - pulse.spawnTime;
          const progress = elapsed / PULSE_DURATION;
          const newScale = Math.min(progress, 1.5) * TARGET_SCALE; // Cap at 1.5x target for cleanup

          // Check if pulse was missed (went past target without being tapped)
          // Miss threshold: 20% past target scale
          if (newScale > TARGET_SCALE * 1.20 && pulse.status === 'active') {
            // Missed!
            game.subtractPoints(MISS_PENALTY);
            setMistakeCount(m => m + 1);
            setCombo(0);
            return { ...pulse, scale: newScale, status: 'missed' as const };
          }

          return { ...pulse, scale: newScale };
        }).filter(pulse => {
          // Remove old finished pulses
          if (pulse.status !== 'active') {
            return performance.now() - pulse.spawnTime < PULSE_DURATION + 1000;
          }
          return true;
        });
      });

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      clearTimeout(initialDelay);
      if (spawnTimerRef.current) window.clearTimeout(spawnTimerRef.current);
      if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, [game.status, spawnPulse, game]);

  // Handle tap
  const handleTap = useCallback(() => {
    if (game.status !== 'playing') return;

    const now = performance.now();

    // Find active pulses and sort by distance to target scale
    const activePulses = pulses.filter(p => p.status === 'active');
    if (activePulses.length === 0) return;

    // Find the pulse closest to target scale
    const targetPulse = activePulses.reduce((closest, pulse) => {
      const closestDist = Math.abs(closest.scale - TARGET_SCALE);
      const pulseDist = Math.abs(pulse.scale - TARGET_SCALE);
      return pulseDist < closestDist ? pulse : closest;
    });

    // Calculate timing accuracy
    const timingDiff = Math.abs(now - targetPulse.hitTime);

    let points = 0;
    let status: 'perfect' | 'good' | 'ok' | 'missed' = 'missed';
    let feedbackType = '';

    if (timingDiff <= PERFECT_WINDOW) {
      points = PERFECT_POINTS;
      status = 'perfect';
      feedbackType = 'PERFECT!';
      setCombo(c => c + 1);
    } else if (timingDiff <= GOOD_WINDOW) {
      points = GOOD_POINTS;
      status = 'good';
      feedbackType = 'Good!';
      setCombo(c => c + 1);
    } else if (timingDiff <= OK_WINDOW) {
      points = OK_POINTS;
      status = 'ok';
      feedbackType = 'OK';
      setCombo(c => c + 1);
    } else {
      // Too early or late
      setCombo(0);
      return;
    }

    // Apply combo bonus (every 5 combo = +1 bonus point)
    const comboBonus = Math.floor(combo / 5);
    game.addPoints(points + comboBonus);

    // Update pulse status
    setPulses(prev => prev.map(p =>
      p.id === targetPulse.id ? { ...p, status } : p
    ));

    // Show feedback
    setLastHitFeedback({ type: feedbackType, id: Date.now() });
    setTimeout(() => setLastHitFeedback(null), 500);

  }, [game, pulses, combo]);

  const handleStartGame = useCallback(() => {
    setPulses([]);
    setMistakeCount(0);
    setShowResults(false);
    setCombo(0);
    setLastHitFeedback(null);
    nextPulseId.current = 0;
    game.startGame();
  }, [game]);

  const handleApplyDiscount = useCallback((discount: number) => {
    if (discount > 0 && productSlug) {
      const existingDiscount = cart.discounts.find(d => d.productId === productSlug);

      if (existingDiscount) {
        removeDiscount(existingDiscount.id);
      }

      addDiscount({
        id: `game-pulse-${Date.now()}`,
        productId: productSlug,
        discountPercent: discount,
        gameType: 'pulse',
        earnedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        applied: false
      });
    }

    setTimeout(() => {
      if (productSlug) {
        navigate(`/products/${productSlug}`);
      } else {
        navigate('/');
      }
    }, 50);
  }, [productSlug, cart.discounts, addDiscount, removeDiscount, navigate]);

  // Progressive dread
  const dreadLevel = Math.min(mistakeCount * 0.07, 0.35);
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
          <p className="text-sm text-amber-500/70 uppercase tracking-widest mb-1 font-display-600">
            {HORROR_COPY.games.chrysalisPulse.careStage}
          </p>
          <h1 className="text-3xl text-ranch-lime mb-2 font-display-800">
            Chrysalis Pulse
          </h1>
          <p className="text-ranch-lavender text-lg font-display-600">
            Sync with their heartbeat
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
            <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6">
              <p className="text-lg text-ranch-cream leading-relaxed text-center font-display-600 mb-4">
                The chrysalis pulses with life. Sync with the rhythm.
              </p>

              {/* Visual instruction */}
              <div className="grid grid-cols-2 gap-3 my-4">
                {/* How it works */}
                <div className="bg-ranch-dark/50 rounded-lg p-3 border-2 border-ranch-cyan/50">
                  <div className="flex justify-center mb-2">
                    <div className="relative w-16 h-16">
                      {/* Target ring */}
                      <div className="absolute inset-0 border-4 border-ranch-cyan/50 rounded-full" />
                      {/* Expanding pulse */}
                      <div className="absolute inset-2 border-4 border-ranch-lime rounded-full animate-ping" />
                    </div>
                  </div>
                  <p className="text-ranch-cyan font-display-700 text-sm">WATCH</p>
                  <p className="text-ranch-cream/70 text-xs mt-1">Pulses expand outward</p>
                </div>

                {/* When to tap */}
                <div className="bg-ranch-dark/50 rounded-lg p-3 border-2 border-ranch-lime/50">
                  <div className="flex justify-center mb-2">
                    <div className="relative w-16 h-16">
                      {/* Target ring */}
                      <div className="absolute inset-0 border-4 border-ranch-lime rounded-full shadow-[0_0_15px_rgba(50,205,50,0.5)]" />
                      {/* Aligned pulse */}
                      <div className="absolute inset-0 border-4 border-ranch-lime rounded-full" />
                      <div className="absolute inset-0 flex items-center justify-center text-2xl">👆</div>
                    </div>
                  </div>
                  <p className="text-ranch-lime font-display-700 text-sm">TAP!</p>
                  <p className="text-ranch-cream/70 text-xs mt-1">When pulse hits the ring</p>
                </div>
              </div>

              {/* Timing guide */}
              <div className="bg-ranch-dark/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-ranch-lavender/60 uppercase tracking-wider mb-2">Timing Rewards</p>
                <div className="flex justify-center gap-4 text-sm">
                  <div><span className="text-ranch-lime">Perfect</span> +{PERFECT_POINTS}</div>
                  <div><span className="text-ranch-cyan">Good</span> +{GOOD_POINTS}</div>
                  <div><span className="text-ranch-lavender">OK</span> +{OK_POINTS}</div>
                </div>
              </div>

              <p className="text-sm text-ranch-pink/70 text-center font-display-500">
                ⚠️ Miss a pulse: -{MISS_PENALTY} points
              </p>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full px-6 py-4 bg-ranch-lime text-ranch-dark rounded-lg text-lg hover:bg-ranch-cyan transition-colors font-display-700"
            >
              Feel the Pulse
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

            {/* Combo indicator */}
            {combo >= 3 && (
              <div className="text-center">
                <span className="text-ranch-lime font-display-700 text-lg animate-pulse">
                  🔥 {combo} COMBO!
                </span>
              </div>
            )}

            {/* Progressive Dread Message */}
            <AnimatePresence>
              {dreadMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-ranch-pink/20 border border-ranch-pink/40 rounded-lg p-2 text-center"
                >
                  <p className="text-ranch-pink text-sm font-display-600">
                    {dreadMessage}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Area - Tap zone */}
            <div
              ref={gameAreaRef}
              className="relative aspect-square bg-ranch-purple/10 rounded-full border-2 border-ranch-purple overflow-hidden cursor-pointer select-none"
              onClick={handleTap}
              onTouchStart={(e) => {
                e.preventDefault();
                handleTap();
              }}
            >
              {/* Target ring */}
              <div
                className="absolute inset-4 border-4 border-ranch-cyan/40 rounded-full"
                style={{ boxShadow: '0 0 20px rgba(0, 206, 209, 0.2)' }}
              />

              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-ranch-purple rounded-full" />

              {/* Pulses */}
              {pulses.map((pulse) => {
                const size = pulse.scale * 100;
                const opacity = pulse.status === 'active'
                  ? Math.min(1, pulse.scale * 2)
                  : pulse.status === 'missed' ? 0.2 : 0;

                const borderColor =
                  pulse.status === 'perfect' ? 'rgba(50, 205, 50, 1)' :
                  pulse.status === 'good' ? 'rgba(0, 206, 209, 1)' :
                  pulse.status === 'ok' ? 'rgba(155, 143, 181, 1)' :
                  pulse.status === 'missed' ? 'rgba(255, 20, 147, 0.3)' :
                  pulse.color;

                return (
                  <div
                    key={pulse.id}
                    className="absolute top-1/2 left-1/2 rounded-full border-4 pointer-events-none transition-colors duration-100"
                    style={{
                      width: `${size}%`,
                      height: `${size}%`,
                      transform: 'translate(-50%, -50%)',
                      borderColor,
                      opacity,
                      boxShadow: pulse.status === 'perfect'
                        ? '0 0 30px rgba(50, 205, 50, 0.8)'
                        : pulse.status === 'good'
                        ? '0 0 20px rgba(0, 206, 209, 0.6)'
                        : 'none',
                    }}
                  />
                );
              })}

              {/* Hit feedback */}
              <AnimatePresence>
                {lastHitFeedback && (
                  <motion.div
                    key={lastHitFeedback.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.5 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  >
                    <span className={`text-2xl font-display-800 ${
                      lastHitFeedback.type === 'PERFECT!' ? 'text-ranch-lime' :
                      lastHitFeedback.type === 'Good!' ? 'text-ranch-cyan' :
                      'text-ranch-lavender'
                    }`}>
                      {lastHitFeedback.type}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tap hint */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-ranch-lavender/40 text-sm">
                TAP ANYWHERE
              </div>
            </div>

            {/* Instructions during play */}
            <div className="text-center text-sm text-ranch-lavender/60">
              Tap when the pulse aligns with the ring
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
