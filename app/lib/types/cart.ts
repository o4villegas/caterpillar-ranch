/**
 * Cart Type Definitions
 *
 * Types for Caterpillar Ranch shopping cart state management
 * Supports both client-side (localStorage) and server-side (KV + session tokens)
 */

import type { Product, ProductVariant } from './product';

/**
 * Cart item with selected variant, quantity, and earned discount
 */
export interface CartItem {
  id: string; // Unique ID for cart item (generated client-side)
  product: Product;
  variantId: string;
  variant: ProductVariant; // Denormalized for easy access
  quantity: number; // 1-99
  earnedDiscount: number; // Discount percentage earned for THIS item (0-15)
  addedAt: string; // ISO timestamp
}

/**
 * Discount earned from playing a game
 */
export interface Discount {
  id: string; // Unique discount ID
  productId: string; // Product this discount applies to
  gameType: 'culling' | 'harvest' | 'larva-launch' | 'path-of-the-pupa' | 'garden' | 'metamorphosis' | 'last-resort' | 'pulse' | 'snake'; // snake is legacy
  discountPercent: number; // 3-15%
  earnedAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp (30 minutes from earnedAt)
  applied: boolean; // True if discount is currently applied to cart item
}

/**
 * Client-side cart state (localStorage)
 */
export interface Cart {
  items: CartItem[];
  discounts: Discount[]; // All earned discounts (applied + unapplied)
  lastUpdated: string; // ISO timestamp
}

/**
 * Server-side cart session (KV storage)
 * Used when user plays games or earns discounts requiring server validation
 */
export interface CartSession {
  sessionToken: string; // UUID v4
  items: CartItem[];
  discounts: Discount[];
  createdAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp (30 min from createdAt)
  lastActivity: string; // ISO timestamp (updated on each cart change)
}

/**
 * Cart totals calculation
 */
export interface CartTotals {
  subtotal: number; // Sum of (item.price * item.quantity) before discounts
  totalDiscount: number; // Sum of all discounts applied (capped at 15% of subtotal)
  effectiveDiscountPercent: number; // Actual discount percentage applied (0-15)
  total: number; // Subtotal - totalDiscount
  itemCount: number; // Total number of items (sum of quantities)
  savings: number; // Amount saved (same as totalDiscount, for display)
}

/**
 * Cart action types (for context reducer pattern)
 */
export type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; variantId: string; quantity: number; earnedDiscount?: number } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'APPLY_DISCOUNT'; payload: { discountId: string; itemId: string } }
  | { type: 'REMOVE_DISCOUNT'; payload: { discountId: string } }
  | { type: 'ADD_DISCOUNT'; payload: Discount }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: Cart }
  | { type: 'SYNC_FROM_SERVER'; payload: CartSession };

/**
 * Cart context value (provided by CartContext)
 */
export interface CartContextValue {
  // State
  cart: Cart;
  totals: CartTotals;
  isLoading: boolean;
  sessionToken: string | null;

  // Actions
  addToCart: (product: Product, variantId: string, quantity: number, earnedDiscount?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  applyDiscount: (discountId: string, itemId: string) => Promise<void>;
  removeDiscount: (discountId: string) => Promise<void>;
  addDiscount: (discount: Discount) => Promise<void>;
  clearCart: () => Promise<void>;

  // Server sync (for game discounts) - TODO Phase 4: Cross-device cart sync
  // syncToServer: () => Promise<void>;
  // syncFromServer: () => Promise<void>;
}

/**
 * Helper type for cart item with calculated price
 */
export interface CartItemWithPrice extends CartItem {
  originalPrice: number; // product.price * quantity
  discountAmount: number; // (product.price * quantity) * (earnedDiscount / 100)
  finalPrice: number; // originalPrice - discountAmount
}
