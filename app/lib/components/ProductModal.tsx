import { useEffect, useState } from 'react';
import type { Product, ProductVariant } from '../types/product';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: string, variantId: string, quantity: number) => void;
}

export function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
      setShowSuccess(false);
      setIsAdding(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    setIsAdding(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 600));

    onAddToCart(product.id, selectedVariant.id, quantity);
    setIsAdding(false);
    setShowSuccess(true);

    // Show success message then close
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  const inStockVariants = product.variants.filter(v => v.inStock);
  const totalPrice = product.price * quantity;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-40 modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-content bg-ranch-dark border-2 border-ranch-purple rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-ranch-purple/50 hover:bg-ranch-purple/70 text-ranch-cream rounded-full transition-colors z-10"
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Rapid-fire badge */}
          {product.isRapidFire && (
            <div className="absolute top-4 left-4 z-10">
              <div className="heartbeat-pulse inline-block bg-ranch-pink text-ranch-dark px-3 py-1 rounded-full text-xs font-bold">
                ⚡ RAPID-FIRE
              </div>
            </div>
          )}

          {/* Product image */}
          <div className="relative bg-ranch-purple/20 p-8">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full max-w-sm mx-auto breathing"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>

          {/* Product details */}
          <div className="p-6 space-y-6">
            {/* Title and price */}
            <div>
              <h2 id="modal-title" className="text-2xl font-bold text-ranch-cream mb-2">
                {product.name}
              </h2>
              <p className="text-ranch-lavender text-sm mb-3">
                {product.description}
              </p>
              <div className="text-3xl font-bold text-ranch-lime">
                ${totalPrice.toFixed(2)}
              </div>
              {quantity > 1 && (
                <div className="text-sm text-ranch-lavender mt-1">
                  ${product.price} each
                </div>
              )}
            </div>

            {/* Size selector */}
            <div>
              <label className="block text-ranch-cream font-semibold mb-3">
                Select Size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const isAvailable = variant.inStock;

                  return (
                    <button
                      key={variant.id}
                      onClick={() => isAvailable && setSelectedVariant(variant)}
                      disabled={!isAvailable}
                      className={`
                        py-3 px-2 rounded-lg font-bold text-sm transition-all
                        ${isSelected
                          ? 'bg-ranch-lime text-ranch-dark border-2 border-ranch-lime'
                          : isAvailable
                            ? 'bg-ranch-purple/30 text-ranch-cream border-2 border-ranch-purple hover:bg-ranch-purple/50 hover:border-ranch-lavender'
                            : 'bg-ranch-dark/50 text-ranch-lavender/40 border-2 border-ranch-purple/30 cursor-not-allowed'
                        }
                      `}
                      aria-pressed={isSelected}
                      aria-disabled={!isAvailable}
                    >
                      {variant.size}
                      {!isAvailable && (
                        <div className="text-xs mt-1 text-ranch-pink">Out</div>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedVariant && (
                <div className="mt-2 text-sm text-ranch-lavender">
                  Color: {selectedVariant.color}
                </div>
              )}
            </div>

            {/* Quantity selector */}
            <div>
              <label className="block text-ranch-cream font-semibold mb-3">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-lg bg-ranch-purple/30 hover:bg-ranch-purple/50 text-ranch-cream font-bold text-xl border-2 border-ranch-purple transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
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
                <button
                  onClick={() => setQuantity(Math.min(99, quantity + 1))}
                  disabled={quantity >= 99}
                  className="w-10 h-10 rounded-lg bg-ranch-purple/30 hover:bg-ranch-purple/50 text-ranch-cream font-bold text-xl border-2 border-ranch-purple transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to cart button */}
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || isAdding || inStockVariants.length === 0}
              className={`
                w-full py-4 rounded-lg font-bold text-lg transition-all
                ${showSuccess
                  ? 'bg-ranch-lime text-ranch-dark'
                  : 'bg-ranch-cyan hover:bg-ranch-lime text-ranch-dark'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isAdding ? 'breathing' : ''}
              `}
            >
              {showSuccess ? (
                <span className="flex items-center justify-center gap-2">
                  ✓ Added to Cart!
                </span>
              ) : isAdding ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-5 h-5 border-3 border-ranch-dark/30 border-t-ranch-dark rounded-full animate-spin" />
                  Adding...
                </span>
              ) : inStockVariants.length === 0 ? (
                'Out of Stock'
              ) : !selectedVariant ? (
                'Select a Size'
              ) : (
                'Add to Cart'
              )}
            </button>

            {/* Product tags */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-ranch-purple/50">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-ranch-purple/30 text-ranch-lavender text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
