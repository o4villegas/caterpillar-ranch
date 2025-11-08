/**
 * Game Canvas Component
 *
 * Reusable canvas wrapper for games requiring canvas rendering:
 * - The Culling (Whack-A-Mole)
 * - Hungry Caterpillar (Snake)
 * - Midnight Garden (Reflex Clicker)
 * - Metamorphosis Queue (Timing)
 *
 * Features:
 * - Responsive sizing (fills container)
 * - High-DPI support (retina displays)
 * - Auto-resize handling
 * - Touch/mouse event normalization
 * - Coordinate conversion utilities
 */

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { cn } from '../../utils';

interface GameCanvasProps {
  width?: number; // Aspect ratio width
  height?: number; // Aspect ratio height
  className?: string;
  onResize?: (width: number, height: number) => void;
}

export interface GameCanvasRef {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  getCanvasCoordinates: (clientX: number, clientY: number) => { x: number; y: number };
  clear: () => void;
}

export const GameCanvas = forwardRef<GameCanvasRef, GameCanvasProps>(
  ({ width = 800, height = 600, className, onResize }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose canvas, context, and utilities to parent
    useImperativeHandle(ref, () => ({
      canvas: canvasRef.current,
      ctx: canvasRef.current?.getContext('2d') ?? null,

      // Convert screen coordinates to canvas coordinates
      getCanvasCoordinates: (clientX: number, clientY: number) => {
        if (!canvasRef.current) return { x: 0, y: 0 };

        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;

        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY,
        };
      },

      // Clear the entire canvas
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
      },
    }));

    // Handle resize with high-DPI support
    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const handleResize = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();

        // Set display size (CSS pixels)
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        // Set actual size in memory (scaled for high-DPI)
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        // Scale context to match high-DPI
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }

        // Notify parent of size change
        onResize?.(rect.width, rect.height);
      };

      handleResize();

      // Use ResizeObserver for accurate resize detection
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      // Also listen to window resize as fallback
      window.addEventListener('resize', handleResize);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', handleResize);
      };
    }, [onResize]);

    return (
      <div
        ref={containerRef}
        className={cn(
          'relative w-full',
          'bg-ranch-purple/20 rounded-lg overflow-hidden',
          'border-2 border-ranch-purple',
          className
        )}
        style={{
          aspectRatio: `${width} / ${height}`,
          maxWidth: '100%',
        }}
      >
        <canvas
          ref={canvasRef}
          className="block touch-none w-full h-full"
        />
      </div>
    );
  }
);

GameCanvas.displayName = 'GameCanvas';
