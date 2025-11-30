/**
 * Organ Harvest — The Offering Stage
 *
 * Theme: "The Chrysalis" — Stack the offerings before time runs out
 *
 * Horror-themed Tetris game where players stack falling body parts.
 * Survive for 60 seconds while clearing lines to earn points.
 *
 * Mechanics:
 * - 60 second duration
 * - 10x20 grid (standard Tetris)
 * - Body part themed pieces
 * - Tap left/right to move, tap center to rotate, swipe down to drop
 * - Lines cleared = points
 * - Survive full time = bonus
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { GameTimer } from '../lib/components/Games/GameTimer';
import { GameScore } from '../lib/components/Games/GameScore';
import { GameResults } from '../lib/components/Games/GameResults';
import { useGameState } from '../lib/components/Games/hooks/useGameState';
import { useCart } from '../lib/contexts/CartContext';
import { HORROR_COPY } from '../lib/constants/horror-copy';
import type { Route } from './+types/games.hungry-caterpillar';

// === GAME SETTINGS ===
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const CELL_SIZE = 18; // pixels
const GAME_DURATION = 45; // seconds
const INITIAL_DROP_INTERVAL = 350; // ms (comfortable start)
const MIN_DROP_INTERVAL = 120; // ms at max speed
const SPEED_INCREASE_INTERVAL = 6000; // Speed up every 6 seconds

// Points
const POINTS_PER_LINE = 10;
const POINTS_DOUBLE = 25; // 2 lines at once
const POINTS_TRIPLE = 40; // 3 lines at once
const POINTS_TETRIS = 60; // 4 lines at once
const SURVIVAL_BONUS = 20; // Bonus for surviving full time

// Body part emojis for pieces
const ORGANS = ['🫀', '🫁', '🧠', '👁️', '🦴', '🦷', '💀'];

// Tetris piece shapes (standard 7 pieces)
const PIECES = [
  // I piece
  { shape: [[1, 1, 1, 1]], color: '🫀' },
  // O piece
  { shape: [[1, 1], [1, 1]], color: '🧠' },
  // T piece
  { shape: [[0, 1, 0], [1, 1, 1]], color: '🫁' },
  // L piece
  { shape: [[1, 0], [1, 0], [1, 1]], color: '👁️' },
  // J piece
  { shape: [[0, 1], [0, 1], [1, 1]], color: '🦴' },
  // S piece
  { shape: [[0, 1, 1], [1, 1, 0]], color: '🦷' },
  // Z piece
  { shape: [[1, 1, 0], [0, 1, 1]], color: '💀' },
];

type Grid = (string | null)[][];

interface Piece {
  shape: number[][];
  color: string;
  x: number;
  y: number;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Organ Harvest — The Offering | Caterpillar Ranch' },
    { name: 'description', content: 'Stack the offerings. Survive the harvest.' },
  ];
}

export default function OrganHarvestRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get('product');

  const { addDiscount, removeDiscount, cart } = useCart();
  const game = useGameState(GAME_DURATION);

  const [grid, setGrid] = useState<Grid>(() =>
    Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [linesCleared, setLinesCleared] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [dropInterval, setDropInterval] = useState(INITIAL_DROP_INTERVAL);

  const dropTimerRef = useRef<number | undefined>(undefined);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const movePieceRef = useRef<(direction: 'left' | 'right' | 'down') => void>(() => {});

  // Load best score
  useEffect(() => {
    const saved = localStorage.getItem('game:organ-harvest:best-score');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Save best score
  useEffect(() => {
    if (game.score > bestScore) {
      setBestScore(game.score);
      localStorage.setItem('game:organ-harvest:best-score', game.score.toString());
    }
  }, [game.score, bestScore]);

  // Generate random piece
  const generatePiece = useCallback((): Piece => {
    const template = PIECES[Math.floor(Math.random() * PIECES.length)];
    return {
      shape: template.shape.map(row => [...row]),
      color: template.color,
      x: Math.floor((GRID_WIDTH - template.shape[0].length) / 2),
      y: 0,
    };
  }, []);

  // Check if piece can be placed at position
  const canPlace = useCallback((piece: Piece, grid: Grid, offsetX = 0, offsetY = 0): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + offsetX;
          const newY = piece.y + y + offsetY;

          if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT) {
            return false;
          }
          if (newY >= 0 && grid[newY][newX]) {
            return false;
          }
        }
      }
    }
    return true;
  }, []);

  // Place piece on grid
  const placePiece = useCallback((piece: Piece, grid: Grid): Grid => {
    const newGrid = grid.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const gridY = piece.y + y;
          const gridX = piece.x + x;
          if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
            newGrid[gridY][gridX] = piece.color;
          }
        }
      }
    }
    return newGrid;
  }, []);

  // Clear completed lines
  const clearLines = useCallback((grid: Grid): { newGrid: Grid; cleared: number } => {
    const newGrid = grid.filter(row => row.some(cell => cell === null));
    const cleared = GRID_HEIGHT - newGrid.length;

    // Add empty rows at top
    while (newGrid.length < GRID_HEIGHT) {
      newGrid.unshift(Array(GRID_WIDTH).fill(null));
    }

    return { newGrid, cleared };
  }, []);

  // Rotate piece
  const rotatePiece = useCallback((piece: Piece): number[][] => {
    const rows = piece.shape.length;
    const cols = piece.shape[0].length;
    const rotated: number[][] = [];

    for (let x = 0; x < cols; x++) {
      rotated.push([]);
      for (let y = rows - 1; y >= 0; y--) {
        rotated[x].push(piece.shape[y][x]);
      }
    }

    return rotated;
  }, []);

  // Move piece
  const movePiece = useCallback((direction: 'left' | 'right' | 'down') => {
    if (!currentPiece || gameOver || game.status !== 'playing') return;

    const offset = {
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
      down: { x: 0, y: 1 },
    }[direction];

    if (canPlace(currentPiece, grid, offset.x, offset.y)) {
      setCurrentPiece(prev => prev ? {
        ...prev,
        x: prev.x + offset.x,
        y: prev.y + offset.y,
      } : null);
    } else if (direction === 'down') {
      // Piece has landed
      const newGrid = placePiece(currentPiece, grid);
      const { newGrid: clearedGrid, cleared } = clearLines(newGrid);

      setGrid(clearedGrid);
      setLinesCleared(prev => prev + cleared);

      // Award points
      if (cleared > 0) {
        const points = cleared === 1 ? POINTS_PER_LINE :
                       cleared === 2 ? POINTS_DOUBLE :
                       cleared === 3 ? POINTS_TRIPLE :
                       POINTS_TETRIS;
        game.addPoints(points);
      }

      // Spawn next piece
      if (nextPiece) {
        if (!canPlace(nextPiece, clearedGrid)) {
          // Game over - can't place new piece
          setGameOver(true);
          game.endGame();
        } else {
          setCurrentPiece(nextPiece);
          setNextPiece(generatePiece());
        }
      }
    }
  }, [currentPiece, gameOver, game, grid, canPlace, placePiece, clearLines, nextPiece, generatePiece]);

  // Keep movePieceRef in sync with movePiece
  useEffect(() => {
    movePieceRef.current = movePiece;
  }, [movePiece]);

  // Handle rotation
  const handleRotate = useCallback(() => {
    if (!currentPiece || gameOver || game.status !== 'playing') return;

    const rotated = rotatePiece(currentPiece);
    const rotatedPiece = { ...currentPiece, shape: rotated };

    // Try to place rotated piece, with wall kicks
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (canPlace({ ...rotatedPiece, x: rotatedPiece.x + kick }, grid)) {
        setCurrentPiece({ ...rotatedPiece, x: rotatedPiece.x + kick });
        return;
      }
    }
  }, [currentPiece, gameOver, game.status, rotatePiece, canPlace, grid]);

  // Hard drop
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || game.status !== 'playing') return;

    let dropY = 0;
    while (canPlace(currentPiece, grid, 0, dropY + 1)) {
      dropY++;
    }

    setCurrentPiece(prev => prev ? { ...prev, y: prev.y + dropY } : null);

    // Force landing on next tick
    setTimeout(() => movePiece('down'), 10);
  }, [currentPiece, gameOver, game.status, canPlace, grid, movePiece]);

  // Game loop - auto drop (uses ref to avoid interval recreation)
  useEffect(() => {
    if (game.status !== 'playing' || gameOver) {
      if (dropTimerRef.current) clearInterval(dropTimerRef.current);
      return;
    }

    dropTimerRef.current = window.setInterval(() => {
      movePieceRef.current('down');
    }, dropInterval);

    return () => {
      if (dropTimerRef.current) clearInterval(dropTimerRef.current);
    };
  }, [game.status, gameOver, dropInterval]);

  // Speed increase over time
  useEffect(() => {
    if (game.status !== 'playing') return;

    const speedTimer = setInterval(() => {
      setDropInterval(prev => Math.max(MIN_DROP_INTERVAL, prev - 100));
    }, SPEED_INCREASE_INTERVAL);

    return () => clearInterval(speedTimer);
  }, [game.status]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (game.status !== 'playing' || gameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
          movePiece('left');
          e.preventDefault();
          break;
        case 'ArrowRight':
          movePiece('right');
          e.preventDefault();
          break;
        case 'ArrowDown':
          movePiece('down');
          e.preventDefault();
          break;
        case 'ArrowUp':
        case ' ':
          handleRotate();
          e.preventDefault();
          break;
        case 'Enter':
          hardDrop();
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game.status, gameOver, movePiece, handleRotate, hardDrop]);

  // Touch controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || game.status !== 'playing' || gameOver || !currentPiece) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Swipe down for hard drop
    if (deltaY > 50 && Math.abs(deltaX) < 30) {
      hardDrop();
      touchStartRef.current = null;
      return;
    }

    // Quick tap - relative to piece position
    if (deltaTime < 300 && Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) {
      const rect = gameAreaRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate piece bounds in screen coordinates
        const pieceLeft = rect.left + 2 + (currentPiece.x * CELL_SIZE);
        const pieceRight = pieceLeft + (currentPiece.shape[0].length * CELL_SIZE);
        const pieceTop = rect.top + 2 + (currentPiece.y * CELL_SIZE);
        const pieceBottom = pieceTop + (currentPiece.shape.length * CELL_SIZE);

        const tapX = touch.clientX;
        const tapY = touch.clientY;

        // Check if tap is on the piece (with some padding for easier tapping)
        const padding = CELL_SIZE;
        const onPieceX = tapX >= pieceLeft - padding && tapX <= pieceRight + padding;
        const onPieceY = tapY >= pieceTop - padding && tapY <= pieceBottom + padding;

        if (onPieceX && onPieceY) {
          // Tap on piece → rotate
          handleRotate();
        } else if (tapY > pieceBottom + padding) {
          // Tap below piece → hard drop
          hardDrop();
        } else if (tapX < pieceLeft) {
          // Tap left of piece → move left
          movePiece('left');
        } else if (tapX > pieceRight) {
          // Tap right of piece → move right
          movePiece('right');
        }
      }
    }

    touchStartRef.current = null;
  }, [game.status, gameOver, hardDrop, movePiece, handleRotate, currentPiece]);

  // Handle game completion
  useEffect(() => {
    if (game.status === 'completed' && !gameOver) {
      // Survived full time!
      game.addPoints(SURVIVAL_BONUS);
      setShowResults(true);
    } else if (gameOver) {
      setShowResults(true);
    }
  }, [game.status, gameOver]);

  // Start game
  const handleStartGame = useCallback(() => {
    setGrid(Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null)));
    setCurrentPiece(generatePiece());
    setNextPiece(generatePiece());
    setGameOver(false);
    setLinesCleared(0);
    setShowResults(false);
    setDropInterval(INITIAL_DROP_INTERVAL);
    game.startGame();
  }, [game, generatePiece]);

  const handleApplyDiscount = useCallback((discount: number) => {
    if (discount > 0 && productSlug) {
      const existingDiscount = cart.discounts.find(d => d.productId === productSlug);
      if (existingDiscount) {
        removeDiscount(existingDiscount.id);
      }

      addDiscount({
        id: `game-harvest-${Date.now()}`,
        productId: productSlug,
        discountPercent: discount,
        gameType: 'snake', // Keep snake for DB compatibility
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

  // Render grid with current piece
  const renderGrid = () => {
    const displayGrid = grid.map(row => [...row]);

    // Add current piece to display
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const gridY = currentPiece.y + y;
            const gridX = currentPiece.x + x;
            if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
              displayGrid[gridY][gridX] = currentPiece.color;
            }
          }
        }
      }
    }

    return displayGrid;
  };

  return (
    <div className="min-h-screen bg-ranch-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-4">
          <p className="text-sm text-amber-500/70 uppercase tracking-widest mb-1 font-display-600">
            The Offering
          </p>
          <h1 className="text-3xl text-ranch-pink mb-2 font-display-800">
            Organ Harvest
          </h1>
          <p className="text-ranch-lavender text-lg font-display-600">
            Stack the offerings. Survive the harvest.
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
            <div className="bg-ranch-purple/20 border-2 border-ranch-pink rounded-lg p-6">
              <p className="text-lg text-ranch-cream leading-relaxed text-center font-display-600 mb-4">
                The ritual demands an offering. Stack the organs before time runs out.
              </p>

              {/* Visual Instructions */}
              <div className="grid grid-cols-3 gap-2 my-4">
                {/* Tap piece */}
                <div className="bg-ranch-dark/50 rounded-lg p-3 border-2 border-ranch-cyan/50">
                  <div className="flex justify-center mb-2 text-2xl">
                    <span>🔄</span>
                  </div>
                  <p className="text-ranch-cyan font-display-700 text-xs">TAP PIECE</p>
                  <p className="text-ranch-cream/70 text-xs mt-1">Rotate</p>
                </div>

                {/* Tap sides */}
                <div className="bg-ranch-dark/50 rounded-lg p-3 border-2 border-ranch-lavender/50">
                  <div className="flex justify-center gap-1 mb-2 text-2xl">
                    <span>👈</span>
                    <span>👉</span>
                  </div>
                  <p className="text-ranch-lavender font-display-700 text-xs">TAP SIDES</p>
                  <p className="text-ranch-cream/70 text-xs mt-1">Move L/R</p>
                </div>

                {/* Tap below */}
                <div className="bg-ranch-dark/50 rounded-lg p-3 border-2 border-ranch-lime/50">
                  <div className="flex justify-center mb-2 text-2xl">
                    <span>👇</span>
                  </div>
                  <p className="text-ranch-lime font-display-700 text-xs">TAP BELOW</p>
                  <p className="text-ranch-cream/70 text-xs mt-1">Drop</p>
                </div>
              </div>

              {/* Scoring */}
              <div className="bg-ranch-dark/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-ranch-lavender/60 uppercase tracking-wider mb-2">Scoring</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-ranch-lime">1 line</span> +{POINTS_PER_LINE}</div>
                  <div><span className="text-ranch-cyan">2 lines</span> +{POINTS_DOUBLE}</div>
                  <div><span className="text-ranch-lavender">3 lines</span> +{POINTS_TRIPLE}</div>
                  <div><span className="text-amber-400">4 lines</span> +{POINTS_TETRIS}</div>
                </div>
              </div>

              {/* Pieces preview */}
              <div className="flex justify-center gap-2 mb-4">
                {ORGANS.map((organ, i) => (
                  <span key={i} className="text-2xl">{organ}</span>
                ))}
              </div>

              <p className="text-sm text-ranch-pink/70 text-center font-display-500">
                ⚠️ Game over if pieces reach the top!
              </p>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full px-6 py-4 bg-ranch-pink text-ranch-dark rounded-lg text-lg hover:bg-ranch-lime transition-colors font-display-700"
            >
              Begin the Harvest
            </button>
          </div>
        )}

        {/* Game UI - Playing */}
        {game.status === 'playing' && !showResults && (
          <div className="space-y-3">
            {/* HUD */}
            <div className="flex gap-4">
              <GameTimer timeLeft={game.timeLeft} className="flex-1" />
              <GameScore score={game.score} showProgress={true} className="flex-1" />
            </div>

            {/* Stats */}
            <div className="flex justify-between text-ranch-lavender text-sm px-2">
              <span>Lines: {linesCleared}</span>
              <span>Next: {nextPiece?.color}</span>
            </div>

            {/* Game Board */}
            <div
              ref={gameAreaRef}
              className="relative bg-ranch-purple/10 rounded-lg border-2 border-ranch-pink overflow-hidden mx-auto"
              style={{
                width: GRID_WIDTH * CELL_SIZE + 4,
                height: GRID_HEIGHT * CELL_SIZE + 4,
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Grid cells */}
              {renderGrid().map((row, y) => (
                row.map((cell, x) => (
                  <div
                    key={`${x}-${y}`}
                    className={`absolute flex items-center justify-center text-xs ${
                      cell ? 'bg-ranch-purple/30' : 'bg-ranch-dark/50'
                    } border border-ranch-purple/20`}
                    style={{
                      left: x * CELL_SIZE + 2,
                      top: y * CELL_SIZE + 2,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                    }}
                  >
                    {cell}
                  </div>
                ))
              ))}

              {/* Game Over Overlay */}
              {gameOver && (
                <div className="absolute inset-0 bg-ranch-dark/90 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-2">💀</div>
                    <p className="text-ranch-pink text-xl font-display-700">
                      THE OFFERING FAILED
                    </p>
                    <p className="text-ranch-lavender text-lg mt-1 font-display-500">
                      Lines cleared: {linesCleared}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Controls Hint */}
            <p className="text-ranch-lavender/60 text-sm text-center">
              Tap piece: Rotate • Tap sides: Move • Tap below: Drop
            </p>
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
