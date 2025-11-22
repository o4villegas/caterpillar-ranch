/**
 * ImageLightbox Component
 *
 * Fullscreen image viewer with pinch-to-zoom and pan gestures.
 * Supports keyboard navigation (ESC to close, arrow keys to navigate).
 */

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export interface LightboxImage {
  src: string;
  alt: string;
  label?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    } else {
      onNavigate(images.length - 1); // Loop to end
    }
  }, [currentIndex, images.length, onNavigate]);

  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
    } else {
      onNavigate(0); // Loop to start
    }
  }, [currentIndex, images.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasMultipleImages) goToPrevious();
          break;
        case 'ArrowRight':
          if (hasMultipleImages) goToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasMultipleImages, goToPrevious, goToNext, onClose]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && currentImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-3 rounded-full bg-ranch-purple/50 hover:bg-ranch-purple text-ranch-cream transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image label */}
          {currentImage.label && (
            <div
              className="absolute top-4 left-4 z-10 px-4 py-2 rounded-lg bg-ranch-purple/50 text-ranch-cream"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}
            >
              {currentImage.label}
            </div>
          )}

          {/* Navigation arrows */}
          {hasMultipleImages && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-ranch-purple/50 hover:bg-ranch-purple text-ranch-cream transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-ranch-purple/50 hover:bg-ranch-purple text-ranch-cream transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Image counter */}
          {hasMultipleImages && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-lg bg-ranch-purple/50 text-ranch-cream"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}
            >
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Zoomable image container */}
          <div
            className="relative w-full h-full flex items-center justify-center p-4 md:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <TransformWrapper
              key={currentImage.src} // Reset zoom when image changes
              initialScale={1}
              minScale={0.5}
              maxScale={4}
              centerOnInit={true}
              wheel={{ step: 0.1 }}
              pinch={{ step: 5 }}
              doubleClick={{ mode: 'toggle', step: 2 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  {/* Zoom controls */}
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                    <button
                      onClick={() => zoomIn()}
                      className="p-2 rounded-lg bg-ranch-purple/50 hover:bg-ranch-purple text-ranch-cream transition-colors"
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => zoomOut()}
                      className="p-2 rounded-lg bg-ranch-purple/50 hover:bg-ranch-purple text-ranch-cream transition-colors"
                      aria-label="Zoom out"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => resetTransform()}
                      className="p-2 rounded-lg bg-ranch-purple/50 hover:bg-ranch-purple text-ranch-cream transition-colors"
                      aria-label="Reset zoom"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Image */}
                  <TransformComponent
                    wrapperStyle={{
                      width: '100%',
                      height: '100%',
                    }}
                    contentStyle={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <motion.img
                      key={currentImage.src}
                      src={currentImage.src}
                      alt={currentImage.alt}
                      className="max-w-full max-h-full object-contain select-none"
                      style={{ imageRendering: 'crisp-edges' }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      draggable={false}
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>

          {/* Touch hint for mobile */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 text-ranch-lavender/60 text-sm text-center md:hidden">
            Pinch to zoom • Double-tap to toggle
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
