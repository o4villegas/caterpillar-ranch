/**
 * ProductView Component
 *
 * Shared product display component used by both:
 * - ProductModal (homepage modal)
 * - product.tsx (dedicated product page route)
 *
 * Eliminates 90% code duplication by extracting common UI logic.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { Product, ProductVariant, ColorVariant } from '../types/product';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ColorSwatch, ColorSwatchGroup } from './ColorSwatch';
import { HORROR_COPY } from '../constants/horror-copy';

interface ProductViewProps {
  product: Product;
  selectedVariant: ProductVariant | null;
  setSelectedVariant: (variant: ProductVariant | null) => void;
  quantity: number;
  setQuantity: (quantity: number) => void;
  earnedDiscount: number;
  canPlayGame: boolean;
  isAdding: boolean;
  loadingMessage: string;
  inStockVariants: ProductVariant[];
  onPlayGame: () => void;
  onAddToCart: () => void;
  // Optional color selection props (only used on product page, not in modal)
  showColorSelection?: boolean;
  designImageUrl?: string;
}

export function ProductView({
  product,
  selectedVariant,
  setSelectedVariant,
  quantity,
  setQuantity,
  earnedDiscount,
  canPlayGame,
  isAdding,
  loadingMessage,
  inStockVariants,
  onPlayGame,
  onAddToCart,
  showColorSelection = false,
  designImageUrl,
}: ProductViewProps) {
  const discountedPrice = product.price * (1 - earnedDiscount / 100);
  const totalPrice = discountedPrice * quantity;

  // Color selection state (only used when showColorSelection=true)
  const [selectedColor, setSelectedColor] = useState<ColorVariant | null>(
    product.colorVariants?.[0] || null
  );

  // Determine current image to display
  const currentImage = designImageUrl || selectedColor?.mockupUrl || product.imageUrl;

  // Get variants to display based on color selection
  const displayVariants = showColorSelection && selectedColor
    ? selectedColor.sizes
    : product.variants;

  // Handle color change
  const handleColorChange = (color: ColorVariant) => {
    setSelectedColor(color);
    // Auto-select first available size for new color
    const firstAvailable = color.sizes.find((v) => v.inStock);
    if (firstAvailable) {
      setSelectedVariant(firstAvailable);
    } else {
      setSelectedVariant(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Product image with Framer Motion */}
      <motion.div
        className="relative bg-ranch-purple/20 p-8 rounded-xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="block w-full max-w-sm mx-auto"
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImage}
              src={currentImage}
              alt={product.name}
              className="w-full"
              style={{ imageRendering: 'crisp-edges' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Product details */}
      <div className="space-y-6 px-1">
        {/* Title and price */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h3 className="text-2xl text-ranch-cream mb-2" style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}>
            {product.name}
          </h3>
          <p className="text-ranch-lavender text-lg mb-3" style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}>
            {product.description}
          </p>
          <div className="text-4xl text-ranch-lime" style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}>
            ${totalPrice.toFixed(2)}
            {earnedDiscount > 0 && (
              <span className="ml-2 text-xl line-through text-ranch-lavender opacity-50" style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}>
                ${(product.price * quantity).toFixed(2)}
              </span>
            )}
          </div>
          {earnedDiscount > 0 && (
            <div className="text-lg text-ranch-lime mt-1" style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}>
              🎉 {earnedDiscount}% Ranch Blessing Applied!
            </div>
          )}
          {quantity > 1 && (
            <div className="text-lg text-ranch-lavender mt-1" style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}>
              ${discountedPrice.toFixed(2)} each
            </div>
          )}
        </motion.div>

        {/* Color selector (optional, only shown when showColorSelection=true) */}
        {showColorSelection && product.colorVariants && product.colorVariants.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <ColorSwatchGroup label="Choose Your Color">
              {product.colorVariants.map((colorVariant) => (
                <ColorSwatch
                  key={colorVariant.color}
                  color={colorVariant.color}
                  hexCode={colorVariant.hexCode}
                  isSelected={selectedColor?.color === colorVariant.color}
                  isAvailable={colorVariant.inStock}
                  onClick={() => handleColorChange(colorVariant)}
                />
              ))}
            </ColorSwatchGroup>
          </motion.div>
        )}

        {/* Size selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <label className="block text-ranch-cream mb-3 text-lg" style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}>
            Choose Your Offering Size
          </label>
          <div className="grid grid-cols-4 gap-2">
            {displayVariants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              const isAvailable = variant.inStock;

              return (
                <motion.button
                  key={variant.id}
                  onClick={() => isAvailable && setSelectedVariant(variant)}
                  disabled={!isAvailable}
                  className={`
                    py-3 px-2 rounded-lg font-bold text-lg transition-all
                    ${isSelected
                      ? 'bg-ranch-lime text-ranch-dark border-2 border-ranch-lime shadow-lg'
                      : isAvailable
                        ? 'bg-ranch-purple/30 text-ranch-cream border-2 border-ranch-purple hover:bg-ranch-purple/50 hover:border-ranch-lavender'
                        : 'bg-ranch-dark/50 text-ranch-lavender/40 border-2 border-ranch-purple/30 cursor-not-allowed'
                    }
                  `}
                  whileHover={isAvailable ? { scale: 1.05 } : {}}
                  whileTap={isAvailable ? { scale: 0.95 } : {}}
                  aria-pressed={isSelected}
                  aria-disabled={!isAvailable}
                >
                  <span style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}>{variant.size}</span>
                  {!isAvailable && (
                    <div className="text-lg mt-1 text-ranch-pink" style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}>Claimed</div>
                  )}
                </motion.button>
              );
            })}
          </div>
          {/* Only show color text if not using color swatches */}
          {!showColorSelection && selectedVariant && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-lg text-ranch-lavender"
              style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}
            >
              Color: {selectedVariant.color}
            </motion.div>
          )}
        </motion.div>

        {/* Quantity selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <label className="block text-ranch-cream mb-3 text-lg" style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}>
            How Many Shall Join?
          </label>
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </Button>
            <div className="flex-1 text-center">
              <input
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(Math.max(1, Math.min(99, val)));
                }}
                className="w-full bg-ranch-purple/20 border-2 border-ranch-purple text-ranch-cream text-center text-xl py-2 rounded-lg focus:border-ranch-lime focus:outline-none transition-colors"
                style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
                aria-label="Quantity"
              />
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setQuantity(Math.min(99, quantity + 1))}
              disabled={quantity >= 99}
              aria-label="Increase quantity"
            >
              +
            </Button>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="space-y-3"
        >
          {/* Play Game button (if not played in current session) */}
          {canPlayGame && (
            <Button
              onClick={onPlayGame}
              variant="outline"
              disabled={!selectedVariant || inStockVariants.length === 0}
              className="w-full h-14 text-lg relative overflow-hidden border-2 border-ranch-lime text-ranch-lime hover:bg-ranch-lime/10"
              size="lg"
            >
              <motion.div
                animate={{ x: ['0%', '100%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-ranch-lime/20 to-transparent"
              />
              <span className="relative z-10" style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}>
                🎮 Play Game - Earn a Discount
              </span>
            </Button>
          )}

          {/* Add to cart button */}
          <Button
            onClick={onAddToCart}
            disabled={!selectedVariant || isAdding || inStockVariants.length === 0}
            className="w-full h-14 text-lg"
            size="lg"
          >
            <span style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}>
              {isAdding ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    className="inline-block w-5 h-5 border-3 border-ranch-dark/30 border-t-ranch-dark rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                  {loadingMessage}
                </span>
              ) : inStockVariants.length === 0 ? (
                HORROR_COPY.products.outOfStock
              ) : !selectedVariant ? (
                'Choose Your Size'
              ) : (
                `Claim Your Harvest${earnedDiscount > 0 ? ` - Save ${earnedDiscount}%` : ''}`
              )}
            </span>
          </Button>
        </motion.div>

        {/* Product tags */}
        <motion.div
          className="flex flex-wrap gap-2 pt-4 border-t border-ranch-purple/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {product.tags.map((tag) => (
            <Badge key={tag} variant="ghost" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
