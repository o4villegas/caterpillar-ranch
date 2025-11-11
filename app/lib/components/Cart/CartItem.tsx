import { motion } from 'framer-motion';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { CartItem as CartItemType } from '../../types/cart';
import { useState } from 'react';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();
  const [isRemoving, setIsRemoving] = useState(false);

  const { product, variant, quantity, earnedDiscount } = item;

  // Calculate prices
  const basePrice = product.price;
  const discountAmount = earnedDiscount > 0 ? (basePrice * earnedDiscount) / 100 : 0;
  const finalPrice = basePrice - discountAmount;
  const itemTotal = finalPrice * quantity;

  const handleQuantityChange = (newQuantity: number) => {
    const clampedQuantity = Math.max(1, Math.min(99, newQuantity));
    updateQuantity(item.id, clampedQuantity);
  };

  const handleRemove = () => {
    setIsRemoving(true);
    // Brief animation delay before removing
    setTimeout(() => {
      removeFromCart(item.id);
    }, 200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isRemoving ? 0 : 1, y: isRemoving ? -20 : 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex gap-4 bg-ranch-purple/10 p-4 rounded-lg border-2 border-ranch-purple/30 hover:border-ranch-purple/60 transition-all"
    >
      {/* Product Image */}
      <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-ranch-purple/20 border-2 border-ranch-purple">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {earnedDiscount > 0 && (
          <div className="absolute top-1 right-1">
            <Badge variant="success" className="text-lg px-1 py-0.5 animate-heartbeat-pulse">
              -{earnedDiscount}%
            </Badge>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between">
        {/* Name and variant */}
        <div>
          <h3 className="text-ranch-cream text-lg leading-tight" style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}>
            {product.name}
          </h3>
          <p className="text-lg text-ranch-lavender mt-1" style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}>
            Size: {variant.size} • {variant.color || 'Default'}
          </p>
        </div>

        {/* Price and controls */}
        <div className="flex items-end justify-between gap-2">
          {/* Quantity controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-ranch-lavender hover:text-ranch-cream hover:bg-ranch-purple/30"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-lg font-medium text-ranch-cream">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-ranch-lavender hover:text-ranch-cream hover:bg-ranch-purple/30"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= 99}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Price display */}
          <div className="text-right" style={{ fontFamily: 'Handjet, monospace' }}>
            {earnedDiscount > 0 ? (
              <>
                <div className="text-lg text-ranch-lavender line-through" style={{ fontWeight: 600 }}>
                  ${(basePrice * quantity).toFixed(2)}
                </div>
                <div className="text-lg text-ranch-lime" style={{ fontWeight: 700 }}>
                  ${itemTotal.toFixed(2)}
                </div>
              </>
            ) : (
              <div className="text-lg text-ranch-cream" style={{ fontWeight: 700 }}>
                ${itemTotal.toFixed(2)}
              </div>
            )}
          </div>

          {/* Remove button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-ranch-lavender hover:text-ranch-pink hover:bg-ranch-pink/10"
            onClick={handleRemove}
            aria-label="Remove item"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
