/**
 * Cart Drawer Component
 *
 * Responsive cart drawer that shows cart items, totals, and checkout button
 * - Desktop: Drawer from right side
 * - Mobile: Drawer from bottom (Vaul)
 * - Horror-themed UI with HORROR_COPY text
 * - Shows individual item discounts and total savings
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from './ui/drawer';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useCart } from '../contexts/CartContext';
import { HORROR_COPY } from '../constants/horror-copy';
import { cn } from '../utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, totals, removeFromCart, updateQuantity } = useCart();

  // Calculate individual item prices with discounts
  const itemsWithPrices = cart.items.map((item) => {
    const originalPrice = item.product.price * item.quantity;
    const discountAmount = (originalPrice * item.earnedDiscount) / 100;
    const finalPrice = originalPrice - discountAmount;

    return {
      ...item,
      originalPrice,
      discountAmount,
      finalPrice,
    };
  });

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="text-2xl font-bold text-ranch-lime drip-text">
            {HORROR_COPY.cart.title}
          </DrawerTitle>
          <DrawerDescription className="text-ranch-lavender">
            {cart.items.length === 0
              ? HORROR_COPY.cart.empty
              : HORROR_COPY.cart.itemCount(totals.itemCount)}
          </DrawerDescription>
        </DrawerHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {cart.items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="text-6xl mb-4">🐛</div>
              <p className="text-ranch-lavender text-lg mb-2">{HORROR_COPY.cart.empty}</p>
              <p className="text-ranch-lavender/60 text-sm">
                The caterpillars are waiting for you to add items...
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {itemsWithPrices.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{
                      layout: { type: 'spring', stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                      x: { duration: 0.2 },
                    }}
                    className={cn(
                      'bg-ranch-purple/10 rounded-lg p-4 border-2 border-ranch-purple',
                      'hover:border-ranch-lavender transition-colors duration-300'
                    )}
                  >
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-ranch-purple/20 flex-shrink-0">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                        {item.earnedDiscount > 0 && (
                          <Badge
                            variant="destructive"
                            className="absolute top-1 right-1 text-[10px] px-1 py-0 heartbeat-pulse"
                          >
                            -{item.earnedDiscount}%
                          </Badge>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-ranch-cream font-bold text-sm mb-1 truncate">
                          {item.product.name}
                        </h3>
                        <p className="text-ranch-lavender text-xs mb-2">
                          Size: {item.variant.size} • {item.variant.color}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mb-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              if (item.quantity === 1) {
                                removeFromCart(item.id);
                              } else {
                                updateQuantity(item.id, item.quantity - 1);
                              }
                            }}
                          >
                            {item.quantity === 1 ? '×' : '−'}
                          </Button>
                          <span className="text-ranch-cream font-mono text-sm w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= 99}
                          >
                            +
                          </Button>
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-2">
                          {item.earnedDiscount > 0 ? (
                            <>
                              <span className="text-ranch-lavender/50 text-xs line-through">
                                ${item.originalPrice.toFixed(2)}
                              </span>
                              <span className="text-ranch-lime font-bold text-sm">
                                ${item.finalPrice.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-ranch-lime font-bold text-sm">
                              ${item.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className={cn(
                          'self-start p-2 rounded-full',
                          'text-ranch-lavender hover:text-ranch-pink',
                          'hover:bg-ranch-purple/20',
                          'transition-all duration-200'
                        )}
                        aria-label="Remove item"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Cart Totals & Checkout */}
        {cart.items.length > 0 && (
          <DrawerFooter className="border-t-2 border-ranch-purple">
            <div className="space-y-3 mb-4">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-ranch-lavender">{HORROR_COPY.checkout.subtotal}</span>
                <span className="text-ranch-cream font-mono">${totals.subtotal.toFixed(2)}</span>
              </div>

              {/* Discount */}
              {totals.totalDiscount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex justify-between text-sm"
                >
                  <span className="text-ranch-lime font-bold">
                    {HORROR_COPY.checkout.discount} ({totals.effectiveDiscountPercent.toFixed(1)}%)
                  </span>
                  <span className="text-ranch-lime font-mono font-bold">
                    -${totals.totalDiscount.toFixed(2)}
                  </span>
                </motion.div>
              )}

              {/* Total */}
              <div className="flex justify-between text-lg font-bold border-t-2 border-ranch-purple pt-3">
                <span className="text-ranch-cream">{HORROR_COPY.checkout.total}</span>
                <span className="text-ranch-lime">${totals.total.toFixed(2)}</span>
              </div>

              {/* Discount Cap Warning */}
              {totals.effectiveDiscountPercent >= 40 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-2 bg-ranch-lime/10 rounded-lg border border-ranch-lime"
                >
                  <span className="text-ranch-lime text-xs font-bold">
                    🎉 {HORROR_COPY.games.maxDiscount}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Checkout Button */}
            <Button
              size="lg"
              className="w-full text-lg font-bold shadow-lg"
              onClick={() => {
                // TODO: Phase 3 - Navigate to checkout
                console.log('Navigate to checkout');
                onClose();
              }}
            >
              {HORROR_COPY.checkout.placeOrder}
            </Button>

            {/* Continue Shopping */}
            <Button variant="ghost" size="sm" onClick={onClose} className="w-full">
              Continue Shopping
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
