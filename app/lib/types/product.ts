/**
 * Product Type Definitions
 *
 * Types for Caterpillar Ranch e-commerce products
 */

export type ProductSize = 'S' | 'M' | 'L' | 'XL' | 'XXL';

export interface ProductVariant {
  id: string;
  size: ProductSize;
  color: string;
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // Base price in dollars
  imageUrl: string; // Path to product image
  isRapidFire: boolean; // True if countdown timer applies
  variants: ProductVariant[];
  tags: string[]; // e.g., ['horror', 'punk', 'rock']
  createdAt?: string; // ISO date string
}

/**
 * Cart item with selected variant and quantity
 */
export interface CartItem {
  product: Product;
  variantId: string;
  quantity: number;
  discountPercent?: number; // Earned discount for this item
}

/**
 * Product filter options
 */
export interface ProductFilters {
  tags?: string[];
  isRapidFire?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}
