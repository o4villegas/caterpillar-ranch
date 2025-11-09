/**
 * Bug Telegram - Speed Typing Game
 *
 * Horror-themed typing game where players intercept coded bug messages
 * - 30 second duration
 * - Type words before they escape off the bottom of the screen
 * - Bug-themed vocabulary with horror aesthetic
 * - Speed and accuracy bonuses
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { GameTimer } from '../lib/components/Games/GameTimer';
import { GameScore } from '../lib/components/Games/GameScore';
import { GameResults } from '../lib/components/Games/GameResults';
import { useGameState } from '../lib/components/Games/hooks/useGameState';
import { useCart } from '../lib/contexts/CartContext';
import type { Route } from './+types/games.bug-telegram';

// Bug-themed words (4-6 letters)
const BUG_WORDS = [
  'MOLT', 'SWARM', 'PUPATE', 'HATCH', 'INFEST',
  'LARVA', 'COLONY', 'THORAX', 'ANTENN', 'CHITIN',
  'COCOON', 'EMERGE', 'BURROW', 'CRAWL', 'GNAW',
  'PLAGUE', 'DEVOUR', 'HORDE', 'SCUTTLE', 'BREED'
];

interface Word {
  id: number;
  text: string;
  position: number; // 0 to 100 (percentage from top)
  speed: number; // pixels per second
  intercepted: boolean;
  escaped: boolean;
  spawnTime: number; // timestamp when word spawned
}

const GAME_DURATION = 30; // seconds
const WORD_SPAWN_INTERVAL = 1800; // ms between word spawns (10% faster - more words)
const WORD_SCROLL_DURATION = 5000; // ms for word to scroll from top to bottom (17% faster)
const SPEED_BONUS_WINDOW = 2500; // ms - 2.5 seconds for speed bonus (17% harder)
const ESCAPE_THRESHOLD = 95; // percentage - word escapes at this position

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Bug Telegram - Caterpillar Ranch' },
    { name: 'description', content: 'Intercept coded bug messages!' }
  ];
}

export default function BugTelegramRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get('product');

  const { addDiscount } = useCart();
  const game = useGameState(GAME_DURATION);

  const [words, setWords] = useState<Word[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [typoMade, setTypoMade] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  const nextWordId = useRef(0);
  const wordQueueIndex = useRef(0);
  const spawnTimerRef = useRef<number | undefined>(undefined);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number>(0);

  // Load best score
  useEffect(() => {
    const saved = localStorage.getItem('game:bug-telegram:best-score');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Save best score
  useEffect(() => {
    if (game.score > bestScore) {
      setBestScore(game.score);
      localStorage.setItem('game:bug-telegram:best-score', game.score.toString());
    }
  }, [game.score, bestScore]);

  // Show results when game completes
  useEffect(() => {
    if (game.status === 'completed') {
      setShowResults(true);
    }
  }, [game.status]);

  // Spawn word function
  const spawnWord = useCallback(() => {
    if (wordQueueIndex.current >= BUG_WORDS.length) {
      wordQueueIndex.current = 0; // Loop back to start if we run out
    }

    const text = BUG_WORDS[wordQueueIndex.current];
    wordQueueIndex.current++;

    const id = nextWordId.current++;
    const newWord: Word = {
      id,
      text,
      position: 0,
      speed: 100 / (WORD_SCROLL_DURATION / 1000), // percentage per second
      intercepted: false,
      escaped: false,
      spawnTime: Date.now()
    };

    setWords(prev => [...prev, newWord]);
  }, []);

  // Spawn words at intervals during gameplay
  useEffect(() => {
    if (game.status !== 'playing') {
      // Clear timers when not playing
      if (spawnTimerRef.current) window.clearInterval(spawnTimerRef.current);
      if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current);
      setWords([]);
      setCurrentInput('');
      setTypoMade(false);
      wordQueueIndex.current = 0;
      return;
    }

    // Spawn first word immediately
    spawnWord();

    // Spawn words at intervals
    spawnTimerRef.current = window.setInterval(() => {
      spawnWord();
    }, WORD_SPAWN_INTERVAL);

    return () => {
      if (spawnTimerRef.current) window.clearInterval(spawnTimerRef.current);
    };
  }, [game.status, spawnWord]);

  // Animate words scrolling down
  useEffect(() => {
    if (game.status !== 'playing') return;

    const animate = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000; // seconds
      lastFrameTimeRef.current = timestamp;

      setWords(prev => {
        const updated = prev.map(word => {
          if (word.intercepted || word.escaped) return word;

          const newPosition = word.position + word.speed * deltaTime;

          // Check if word has escaped
          if (newPosition >= ESCAPE_THRESHOLD) {
            return { ...word, position: ESCAPE_THRESHOLD, escaped: true };
          }

          return { ...word, position: newPosition };
        });

        // Remove words that have been off-screen for a while
        return updated.filter(word => {
          if (word.escaped && word.position >= ESCAPE_THRESHOLD) {
            return Date.now() - word.spawnTime < WORD_SCROLL_DURATION + 2000;
          }
          return true;
        });
      });

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      lastFrameTimeRef.current = 0;
    };
  }, [game.status]);

  // Handle typing input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (game.status !== 'playing') return;

    const value = e.target.value.toUpperCase();
    setCurrentInput(value);

    // Check if input matches any active word
    const activeWords = words.filter(w => !w.intercepted && !w.escaped);
    const matchingWord = activeWords.find(w => w.text === value);

    if (matchingWord) {
      // INTERCEPTED!
      const interceptTime = Date.now() - matchingWord.spawnTime;
      const speedBonus = interceptTime <= SPEED_BONUS_WINDOW ? 2 : 0;
      const accuracyBonus = typoMade ? 0 : 2; // +2 if no typos (total +5 vs +3)

      game.addPoints(3 + accuracyBonus + speedBonus);

      // Mark word as intercepted
      setWords(prev => prev.map(w =>
        w.id === matchingWord.id ? { ...w, intercepted: true } : w
      ));

      // Clear input and reset typo tracker
      setCurrentInput('');
      setTypoMade(false);
    } else {
      // Check if we're on the right track for any word
      const isValidPrefix = activeWords.some(w => w.text.startsWith(value));
      if (!isValidPrefix && value.length > 0) {
        setTypoMade(true);
      }
    }
  }, [game, words, typoMade]);

  const handleStartGame = useCallback(() => {
    setWords([]);
    setCurrentInput('');
    setTypoMade(false);
    wordQueueIndex.current = 0;
    game.startGame();
  }, [game]);

  const handleRetry = useCallback(() => {
    setShowResults(false);
    setWords([]);
    setCurrentInput('');
    setTypoMade(false);
    wordQueueIndex.current = 0;
    game.resetGame();
    setTimeout(() => game.startGame(), 100);
  }, [game]);

  const handleApplyDiscount = useCallback((discount: number) => {
    if (discount > 0 && productSlug) {
      addDiscount({
        id: `game-telegram-${Date.now()}`,
        productId: productSlug,
        discountPercent: discount,
        gameType: 'telegram',
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
            Bug Telegram
          </h1>
          <p className="text-ranch-lavender text-sm">
            Type words to intercept coded bug messages before they escape
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
                Type bug messages before they escape
              </p>
              <p className="text-sm text-ranch-lavender mt-1 text-center">
                Speed and accuracy earn bonus points
              </p>
            </div>
            <button
              onClick={handleStartGame}
              className="w-full px-6 py-4 bg-ranch-lime text-ranch-dark rounded-lg font-bold text-lg hover:bg-ranch-cyan transition-colors"
            >
              Start Intercepting
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

            {/* Game Area - Scrolling words */}
            <div className="relative h-96 bg-ranch-purple/10 rounded-lg border-2 border-ranch-purple overflow-hidden">
              {words.map((word) => (
                <div
                  key={word.id}
                  className={`absolute left-1/2 -translate-x-1/2 transition-opacity duration-300 ${
                    word.intercepted
                      ? 'opacity-0'
                      : word.escaped
                      ? 'opacity-30'
                      : game.score >= 20
                      ? 'word-vibrate'
                      : ''
                  }`}
                  style={{
                    top: `${word.position}%`,
                  }}
                >
                  <div
                    className={`text-2xl font-bold px-4 py-2 rounded ${
                      word.intercepted
                        ? 'text-ranch-lime'
                        : word.escaped
                        ? 'text-ranch-pink line-through'
                        : 'text-ranch-cyan'
                    }`}
                  >
                    {word.text}
                    {word.intercepted && (
                      <span className="ml-2 text-sm">✓ INTERCEPTED</span>
                    )}
                    {word.escaped && (
                      <span className="ml-2 text-sm">✗ ESCAPED</span>
                    )}
                  </div>
                  {/* Drip trail effect for escaped words */}
                  {word.escaped && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-1 h-8 bg-gradient-to-b from-ranch-pink to-transparent opacity-50" />
                  )}
                </div>
              ))}
            </div>

            {/* Typing Input */}
            <div className="space-y-2">
              <input
                type="text"
                value={currentInput}
                onChange={handleInputChange}
                placeholder="TYPE HERE..."
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className={`w-full px-4 py-3 bg-ranch-dark border-2 rounded-lg text-ranch-lime text-2xl font-bold text-center uppercase focus:outline-none focus:ring-2 ${
                  typoMade
                    ? 'border-ranch-pink focus:ring-ranch-pink'
                    : 'border-ranch-cyan focus:ring-ranch-cyan'
                }`}
                style={{
                  textShadow: typoMade ? '0 2px 8px rgba(255, 20, 147, 0.5)' : '0 2px 8px rgba(50, 205, 50, 0.3)',
                }}
              />
              {typoMade && (
                <p className="text-ranch-pink text-xs text-center">
                  Typo detected! Accuracy bonus lost for this word.
                </p>
              )}
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
        @keyframes vibrate {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          25% { transform: translateX(-50%) translateY(-1px) rotate(-0.5deg); }
          75% { transform: translateX(-50%) translateY(1px) rotate(0.5deg); }
        }

        .word-vibrate {
          animation: vibrate 0.15s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
