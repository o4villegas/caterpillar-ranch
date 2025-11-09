import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { Product, ProductVariant } from '../types/product';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from './ui/drawer';
import { HORROR_COPY, getRandomLoadingMessage } from '../constants/horror-copy';
import { ParticleBurst } from './ParticleBurst';
import { GameModal } from './GameModal';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: string, variantId: string, quantity: number, earnedDiscount?: number) => void;
}

export function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(getRandomLoadingMessage());
  const [showParticleBurst, setShowParticleBurst] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [earnedDiscount, setEarnedDiscount] = useState(0);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set first in-stock variant as default
  useEffect(() => {
    if (isOpen && !selectedVariant) {
      const firstInStock = product.variants.find(v => v.inStock);
      if (firstInStock) {
        setSelectedVariant(firstInStock);
      }
    }
  }, [isOpen, product.variants, selectedVariant]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedVariant(null);
      setQuantity(1);
      setIsAdding(false);
    }
  }, [isOpen]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    setIsAdding(true);
    setLoadingMessage(getRandomLoadingMessage());

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 600));

    onAddToCart(product.id, selectedVariant.id, quantity, earnedDiscount);
    setIsAdding(false);

    // Trigger particle burst effect
    setShowParticleBurst(true);
    setTimeout(() => setShowParticleBurst(false), 1000);

    // Show toast notification with horror theme
    toast.success(HORROR_COPY.success.added, {
      description: `${quantity}x ${product.name} (${selectedVariant.size}) - The Ranch accepts your selection 🐛`,
      duration: 3000,
    });

    // Close modal after brief delay
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleGameComplete = (discount: number) => {
    setEarnedDiscount(discount);
  };

  const inStockVariants = product.variants.filter(v => v.inStock);
  const discountedPrice = product.price * (1 - earnedDiscount / 100);
  const totalPrice = discountedPrice * quantity;

  // Shared content component
  const ModalContent = () => (
    <div className="space-y-6">
      {/* Product image with Framer Motion */}
      <motion.div
        className="relative bg-ranch-purple/20 p-8 rounded-xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {product.isRapidFire && (
          <div className="absolute top-4 left-4 z-10">
            <Badge variant="destructive" className="text-xs font-bold">
              ⚡ RAPID-FIRE
            </Badge>
          </div>
        )}
        <motion.picture
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
          <source
            srcSet={product.imageUrl.replace('.png', '.webp')}
            type="image/webp"
          />
          <motion.img
            src={product.imageUrl}
            alt={product.name}
            className="w-full"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </motion.picture>
      </motion.div>

      {/* Product details */}
      <div className="space-y-6 px-1">
        {/* Title and price */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h3 className="text-2xl font-bold text-ranch-cream mb-2">
            {product.name}
          </h3>
          <p className="text-ranch-lavender text-sm mb-3">
            {product.description}
          </p>
          <div className="text-3xl font-bold text-ranch-lime">
            ${totalPrice.toFixed(2)}
            {earnedDiscount > 0 && (
              <span className="ml-2 text-lg line-through text-ranch-lavender opacity-50">
                ${(product.price * quantity).toFixed(2)}
              </span>
            )}
          </div>
          {earnedDiscount > 0 && (
            <div className="text-sm text-ranch-lime font-bold mt-1">
              🎉 {earnedDiscount}% Ranch Blessing Applied!
            </div>
          )}
          {quantity > 1 && (
            <div className="text-sm text-ranch-lavender mt-1">
              ${discountedPrice.toFixed(2)} each
            </div>
          )}
        </motion.div>

        {/* Size selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <label className="block text-ranch-cream font-semibold mb-3">
            Choose Your Offering Size
          </label>
          <div className="grid grid-cols-4 gap-2">
            {product.variants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              const isAvailable = variant.inStock;

              return (
                <motion.button
                  key={variant.id}
                  onClick={() => isAvailable && setSelectedVariant(variant)}
                  disabled={!isAvailable}
                  className={`
                    py-3 px-2 rounded-lg font-bold text-sm transition-all
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
                  {variant.size}
                  {!isAvailable && (
                    <div className="text-xs mt-1 text-ranch-pink">Claimed</div>
                  )}
                </motion.button>
              );
            })}
          </div>
          {selectedVariant && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm text-ranch-lavender"
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
          <label className="block text-ranch-cream font-semibold mb-3">
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
                className="w-full bg-ranch-purple/20 border-2 border-ranch-purple text-ranch-cream text-center text-lg font-bold py-2 rounded-lg focus:border-ranch-lime focus:outline-none transition-colors"
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
          {/* Play Game button (if no discount earned yet) */}
          {earnedDiscount === 0 && (
            <Button
              onClick={() => setIsGameModalOpen(true)}
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
              <span className="relative z-10">
                🎮 Play Game - Earn up to 40% Off
              </span>
            </Button>
          )}

          {/* Add to cart button */}
          <Button
            onClick={handleAddToCart}
            disabled={!selectedVariant || isAdding || inStockVariants.length === 0}
            className="w-full h-14 text-lg"
            size="lg"
          >
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

  // Desktop: Use Dialog
  if (!isMobile) {
    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sr-only">
              <DialogTitle>{product.name}</DialogTitle>
              <DialogDescription>{product.description}</DialogDescription>
            </DialogHeader>
            <ModalContent />
          </DialogContent>
        </Dialog>
        <ParticleBurst trigger={showParticleBurst} />
        <GameModal
          isOpen={isGameModalOpen}
          onClose={() => setIsGameModalOpen(false)}
          productId={product.id}
          productSlug={product.slug}
          onGameComplete={handleGameComplete}
        />
      </>
    );
  }

  // Mobile: Use Drawer
  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh] overflow-y-auto pb-8">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{product.name}</DrawerTitle>
            <DrawerDescription>{product.description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <ModalContent />
          </div>
        </DrawerContent>
      </Drawer>
      <ParticleBurst trigger={showParticleBurst} />
      <GameModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
        productId={product.id}
        productSlug={product.slug}
        onGameComplete={handleGameComplete}
      />
    </>
  );
}
