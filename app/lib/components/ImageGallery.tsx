/**
 * ImageGallery Component
 *
 * Displays a main product image with a row of clickable thumbnails below.
 * Clicking the main image or thumbnails opens the lightbox for zooming.
 * Used by both ProductView (product page) and ProductModal (homepage modal).
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageLightbox, type LightboxImage } from './ImageLightbox';
import { ZoomIn } from 'lucide-react';

export interface GalleryImage {
  src: string;
  alt: string;
  label: string; // e.g., "Design", "Black", "White"
  type: 'design' | 'mockup';
}

interface ImageGalleryProps {
  images: GalleryImage[];
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const currentImage = images[selectedIndex];

  // Convert to lightbox format
  const lightboxImages: LightboxImage[] = useMemo(
    () =>
      images.map((img) => ({
        src: img.src,
        alt: img.alt,
        label: img.label,
      })),
    [images]
  );

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleMainImageClick = () => {
    setLightboxIndex(selectedIndex);
    setLightboxOpen(true);
  };

  const handleLightboxNavigate = (index: number) => {
    setLightboxIndex(index);
    setSelectedIndex(index); // Sync thumbnail selection
  };

  if (images.length === 0) {
    return (
      <div className="bg-ranch-purple/20 p-8 rounded-xl flex items-center justify-center min-h-[300px]">
        <span className="text-ranch-lavender">No images available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main image container */}
      <motion.div
        className="relative bg-ranch-purple/20 p-4 md:p-8 rounded-xl cursor-zoom-in group"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={handleMainImageClick}
        role="button"
        aria-label={`View ${currentImage?.label || 'image'} in fullscreen`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleMainImageClick();
          }
        }}
      >
        {/* Zoom indicator overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl z-10 pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-ranch-purple/80 p-3 rounded-full">
            <ZoomIn className="w-6 h-6 text-ranch-cream" />
          </div>
        </div>

        {/* Image type badge */}
        {currentImage && (
          <div
            className="absolute top-2 left-2 z-20 px-3 py-1 rounded-lg text-sm"
            style={{
              fontFamily: 'Tourney, cursive',
              fontWeight: 600,
              backgroundColor:
                currentImage.type === 'design'
                  ? 'rgba(50, 205, 50, 0.3)'
                  : 'rgba(0, 206, 209, 0.3)',
              color: currentImage.type === 'design' ? '#32CD32' : '#00CED1',
            }}
          >
            {currentImage.type === 'design' ? 'Design' : 'Mockup'}
          </div>
        )}

        {/* Main image with breathing animation */}
        <motion.div
          className="block w-full max-w-sm mx-auto"
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        >
          <AnimatePresence mode="wait">
            {currentImage && (
              <motion.img
                key={currentImage.src}
                src={currentImage.src}
                alt={currentImage.alt}
                className="w-full"
                style={{ imageRendering: 'crisp-edges' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                draggable={false}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Click to zoom hint */}
        <div
          className="absolute bottom-2 right-2 z-20 px-2 py-1 rounded text-xs text-ranch-lavender/60 bg-ranch-dark/50"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Click to zoom
        </div>
      </motion.div>

      {/* Thumbnails row */}
      {images.length > 1 && (
        <motion.div
          className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-ranch-purple scrollbar-track-transparent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {images.map((image, index) => {
            const isSelected = index === selectedIndex;
            const isDesign = image.type === 'design';

            return (
              <button
                key={`${image.src}-${index}`}
                onClick={() => handleThumbnailClick(index)}
                className={`
                  relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden
                  transition-all duration-200
                  ${
                    isSelected
                      ? 'ring-2 ring-ranch-lime shadow-lg shadow-ranch-lime/30'
                      : 'ring-1 ring-ranch-purple/50 hover:ring-2 hover:ring-ranch-lavender opacity-70 hover:opacity-100'
                  }
                `}
                aria-label={`View ${image.label}`}
                aria-pressed={isSelected}
              >
                <img
                  src={image.src}
                  alt={image.label}
                  className="w-full h-full object-cover"
                  draggable={false}
                />

                {/* Thumbnail label overlay */}
                <div
                  className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[10px] text-center truncate"
                  style={{
                    fontFamily: 'Tourney, cursive',
                    fontWeight: 600,
                    backgroundColor: isDesign
                      ? 'rgba(50, 205, 50, 0.9)'
                      : 'rgba(0, 206, 209, 0.9)',
                    color: '#1a1a1a',
                  }}
                >
                  {image.label}
                </div>
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={handleLightboxNavigate}
      />
    </div>
  );
}
