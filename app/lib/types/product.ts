/**
 * Product Type Definitions
 *
 * Types for Caterpillar Ranch e-commerce products
 */

export type ProductSize = 'S' | 'M' | 'L' | 'XL' | 'XXL';

export interface ProductVariant {
  id: string;
  printfulVariantId: number; // Numeric Printful variant ID for order creation
  size: ProductSize;
  color: string;
  mockupUrl?: string; // Preview image URL from Printful (optional for backward compat)
  inStock: boolean;
}

/**
 * Color variant grouping - variants grouped by color
 * Used for color swatch UI on product pages
 */
export interface ColorVariant {
  color: string; // Color name (e.g., "Black", "Navy")
  mockupUrl: string; // Preview image for this color
  hexCode: string; // Hex color code for swatch rendering
  sizes: ProductVariant[]; // All size variants for this color
  inStock: boolean; // True if any size is in stock
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // Base price in dollars
  imageUrl: string; // Path to product image (Printful thumbnail)
  designImageUrl?: string; // Admin-uploaded design image (R2 URL) - used as hero/thumbnail
  colorVariants?: ColorVariant[]; // Grouped variants by color (optional for backward compat)
  variants: ProductVariant[]; // All variants (flat list for backward compat)
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
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}
