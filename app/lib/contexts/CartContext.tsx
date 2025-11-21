/**
 * Cart Context Provider
 *
 * Manages shopping cart state with:
 * - Client-side localStorage persistence (guest checkout)
 * - Server-side KV sync when games are played
 * - Discount tracking and 15% max cap enforcement
 */

import { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  Cart,
  CartAction,
  CartContextValue,
  CartItem,
  CartTotals,
  Discount,
} from '../types/cart';
import type { Product } from '../types/product';

// Storage key for localStorage
const CART_STORAGE_KEY = 'caterpillar-ranch-cart';
const SESSION_TOKEN_KEY = 'caterpillar-ranch-session';

/**
 * Generate a UUID with fallback for browsers without crypto.randomUUID
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for browsers without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Initial empty cart state
 */
const initialCart: Cart = {
  items: [],
  discounts: [],
  lastUpdated: new Date().toISOString(),
};

/**
 * Cart reducer - handles all cart state mutations
 */
function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, variantId, quantity, earnedDiscount = 0 } = action.payload;
      const variant = product.variants.find((v) => v.id === variantId);

      if (!variant) {
        console.error('Variant not found:', variantId);
        return state;
      }

      // Check if item already exists in cart (must match product, variant, AND discount)
      // Different discounts create separate cart lines per user requirement
      const existingItemIndex = state.items.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.variantId === variantId &&
          item.earnedDiscount === earnedDiscount
      );

      if (existingItemIndex >= 0) {
        // Update quantity of existing item (discount already matches from findIndex)
        const updatedItems = [...state.items];
        const existingItem = updatedItems[existingItemIndex];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: Math.min(99, existingItem.quantity + quantity),
          // earnedDiscount stays the same (guaranteed equal since we matched on it)
        };

        return {
          ...state,
          items: updatedItems,
          lastUpdated: new Date().toISOString(),
        };
      }

      // Add new item
      const newItem: CartItem = {
        id: `${product.id}-${variantId}-${Date.now()}`,
        product,
        variantId,
        variant,
        quantity: Math.min(99, quantity),
        earnedDiscount,
        addedAt: new Date().toISOString(),
      };

      return {
        ...state,
        items: [...state.items, newItem],
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'REMOVE_ITEM': {
      const { itemId } = action.payload;
      return {
        ...state,
        items: state.items.filter((item) => item.id !== itemId),
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { itemId, quantity } = action.payload;
      const clampedQuantity = Math.max(1, Math.min(99, quantity));

      return {
        ...state,
        items: state.items.map((item) =>
          item.id === itemId ? { ...item, quantity: clampedQuantity } : item
        ),
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'APPLY_DISCOUNT': {
      const { discountId, itemId } = action.payload;

      // Find the discount
      const discount = state.discounts.find((d) => d.id === discountId);
      if (!discount) return state;

      // Check if discount has expired
      if (new Date(discount.expiresAt) < new Date()) {
        console.warn('Discount has expired:', discountId);
        return state;
      }

      // Find the item
      const itemIndex = state.items.findIndex((item) => item.id === itemId);
      if (itemIndex === -1) return state;

      // Check if discount applies to this product
      if (discount.productId !== state.items[itemIndex].product.id) {
        console.warn('Discount does not apply to this product');
        return state;
      }

      // Apply discount to item
      const updatedItems = [...state.items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        earnedDiscount: discount.discountPercent,
      };

      // Mark discount as applied
      const updatedDiscounts = state.discounts.map((d) =>
        d.id === discountId ? { ...d, applied: true } : d
      );

      return {
        ...state,
        items: updatedItems,
        discounts: updatedDiscounts,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'REMOVE_DISCOUNT': {
      const { discountId } = action.payload;

      // Mark discount as unapplied and remove from all items
      const updatedDiscounts = state.discounts.map((d) =>
        d.id === discountId ? { ...d, applied: false } : d
      );

      return {
        ...state,
        discounts: updatedDiscounts,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'ADD_DISCOUNT': {
      const newDiscount = action.payload;

      // Check if discount already exists (by ID)
      if (state.discounts.some((d) => d.id === newDiscount.id)) {
        return state;
      }

      // BEHAVIOR: One discount per product (replaces existing)
      // Remove any existing discount for the same product
      const filteredDiscounts = state.discounts.filter(
        (d) => d.productId !== newDiscount.productId
      );

      return {
        ...state,
        discounts: [...filteredDiscounts, newDiscount],
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'CLEAR_CART': {
      return {
        items: [],
        discounts: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'LOAD_CART': {
      return action.payload;
    }

    case 'SYNC_FROM_SERVER': {
      const session = action.payload;
      return {
        items: session.items,
        discounts: session.discounts,
        lastUpdated: session.lastActivity,
      };
    }

    default:
      return state;
  }
}

/**
 * Calculate cart totals with 15% max discount cap
 */
function calculateTotals(cart: Cart): CartTotals {
  if (cart.items.length === 0) {
    return {
      subtotal: 0,
      totalDiscount: 0,
      effectiveDiscountPercent: 0,
      total: 0,
      itemCount: 0,
      savings: 0,
    };
  }

  // Calculate subtotal
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);

  // Calculate total discount (sum of individual item discounts)
  let totalDiscountBeforeCap = 0;
  cart.items.forEach((item) => {
    const itemSubtotal = item.product.price * item.quantity;
    const itemDiscount = (itemSubtotal * item.earnedDiscount) / 100;
    totalDiscountBeforeCap += itemDiscount;
  });

  // Enforce 15% maximum discount cap
  const maxDiscount = subtotal * 0.15;
  const totalDiscount = Math.min(totalDiscountBeforeCap, maxDiscount);
  const effectiveDiscountPercent = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;

  // Calculate total item count
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    effectiveDiscountPercent: Math.round(effectiveDiscountPercent * 10) / 10,
    total: Math.round((subtotal - totalDiscount) * 100) / 100,
    itemCount,
    savings: Math.round(totalDiscount * 100) / 100,
  };
}

// Create context
const CartContext = createContext<CartContextValue | null>(null);

/**
 * Cart Provider Component
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, initialCart);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    let savedSession = localStorage.getItem(SESSION_TOKEN_KEY);

    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsed });
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    }

    // Generate session token if not exists
    if (!savedSession) {
      savedSession = generateUUID();
      localStorage.setItem(SESSION_TOKEN_KEY, savedSession);
    }
    setSessionToken(savedSession);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cart]);

  // Calculate totals (memoized)
  const totals = useMemo(() => calculateTotals(cart), [cart]);

  // Cart actions
  const addToCart = useCallback(
    async (product: Product, variantId: string, quantity: number, earnedDiscount = 0) => {
      dispatch({
        type: 'ADD_ITEM',
        payload: { product, variantId, quantity, earnedDiscount },
      });
    },
    []
  );

  const removeFromCart = useCallback(async (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId } });
  }, []);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  }, []);

  const applyDiscount = useCallback(async (discountId: string, itemId: string) => {
    dispatch({ type: 'APPLY_DISCOUNT', payload: { discountId, itemId } });
  }, []);

  const removeDiscount = useCallback(async (discountId: string) => {
    dispatch({ type: 'REMOVE_DISCOUNT', payload: { discountId } });
  }, []);

  const addDiscount = useCallback(async (discount: Discount) => {
    dispatch({ type: 'ADD_DISCOUNT', payload: discount });
  }, []);

  const clearCart = useCallback(async () => {
    dispatch({ type: 'CLEAR_CART' });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
    setSessionToken(null);
  }, []);

  // Server sync (placeholder for Phase 4 - KV integration for cross-device cart)
  // const syncToServer = useCallback(async () => {
  //   // TODO: Phase 4 - Implement server sync via /api/cart/sync
  //   console.log('syncToServer: Not yet implemented (Phase 4)');
  // }, []);

  // const syncFromServer = useCallback(async () => {
  //   // TODO: Phase 4 - Implement server sync via /api/cart/sync
  //   console.log('syncFromServer: Not yet implemented (Phase 4)');
  // }, []);

  const value: CartContextValue = {
    cart,
    totals,
    isLoading,
    sessionToken,
    addToCart,
    removeFromCart,
    updateQuantity,
    applyDiscount,
    removeDiscount,
    addDiscount,
    clearCart,
    // syncToServer,    // TODO Phase 4: Cross-device cart sync
    // syncFromServer,  // TODO Phase 4: Cross-device cart sync
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Hook to use cart context
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
