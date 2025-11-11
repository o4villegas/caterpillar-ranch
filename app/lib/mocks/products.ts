/**
 * Mock Product Data
 *
 * Static product data for Phase 1 (frontend-first development)
 * Will be replaced with Printful API data in Phase 4
 */

import type { Product } from '../types/product';

export const mockProducts: Product[] = [
  {
    id: 'cr-punk',
    name: 'Caterpillar Ranch - Punk Edition',
    slug: 'punk-edition',
    description: 'Aggressive horror punk style. For those who like their caterpillars with attitude and sharp teeth. Dripping metal text on dark gray.',
    price: 30,
    imageUrl: '/products/CR-PUNK.png',
    variants: [
      { id: 'punk-s', printfulVariantId: 1001, size: 'S', color: 'Dark Gray', inStock: true },
      { id: 'punk-m', printfulVariantId: 1002, size: 'M', color: 'Dark Gray', inStock: true },
      { id: 'punk-l', printfulVariantId: 1003, size: 'L', color: 'Dark Gray', inStock: true },
      { id: 'punk-xl', printfulVariantId: 1004, size: 'XL', color: 'Dark Gray', inStock: true },
    ],
    tags: ['horror', 'punk', 'aggressive', 'metal'],
    createdAt: '2025-10-14T00:00:00Z',
  },
  {
    id: 'cr-rock',
    name: 'Caterpillar Ranch - Rock Edition',
    slug: 'rock-edition',
    description: 'Vintage rock vibes with multi-eyed horror. Stone-washed for that authentic worn look. Classic dripping ranch text.',
    price: 30,
    imageUrl: '/products/CR-ROCK.png',
    variants: [
      { id: 'rock-s', printfulVariantId: 2001, size: 'S', color: 'Stone Gray', inStock: true },
      { id: 'rock-m', printfulVariantId: 2002, size: 'M', color: 'Stone Gray', inStock: true },
      { id: 'rock-l', printfulVariantId: 2003, size: 'L', color: 'Stone Gray', inStock: true },
      { id: 'rock-xl', printfulVariantId: 2004, size: 'XL', color: 'Stone Gray', inStock: true },
    ],
    tags: ['horror', 'rock', 'vintage', 'retro'],
    createdAt: '2025-10-14T00:00:00Z',
  },
  {
    id: 'cr-weird',
    name: 'Caterpillar Ranch - Weird Edition',
    slug: 'weird-edition',
    description: 'Cute meets creepy. Big eyes, bigger smile, visible teeth. The perfect balance of adorable and unsettling on lavender.',
    price: 30,
    imageUrl: '/products/CR-WEIRD.png',
    variants: [
      { id: 'weird-s', printfulVariantId: 3001, size: 'S', color: 'Lavender', inStock: true },
      { id: 'weird-m', printfulVariantId: 3002, size: 'M', color: 'Lavender', inStock: true },
      { id: 'weird-l', printfulVariantId: 3003, size: 'L', color: 'Lavender', inStock: true },
      { id: 'weird-xl', printfulVariantId: 3004, size: 'XL', color: 'Lavender', inStock: false }, // Out of stock
    ],
    tags: ['cute', 'horror', 'weird', 'kawaii'],
    createdAt: '2025-10-14T00:00:00Z',
  },
  {
    id: 'cr-anime',
    name: 'Caterpillar Ranch - Anime Edition',
    slug: 'anime-edition',
    description: 'The original mascot design. Kawaii horror at its finest with dripping pink "RANCCH" text. Cute caterpillar on a plate.',
    price: 30,
    imageUrl: '/products/CR-ANIME.png',
    variants: [
      { id: 'anime-s', printfulVariantId: 4001, size: 'S', color: 'White', inStock: true },
      { id: 'anime-m', printfulVariantId: 4002, size: 'M', color: 'White', inStock: true },
      { id: 'anime-l', printfulVariantId: 4003, size: 'L', color: 'White', inStock: true },
      { id: 'anime-xl', printfulVariantId: 4004, size: 'XL', color: 'White', inStock: true },
    ],
    tags: ['cute', 'anime', 'mascot', 'kawaii'],
    createdAt: '2025-10-14T00:00:00Z',
  },
];

/**
 * Helper function to get a single product by ID
 */
export function getProductById(id: string): Product | undefined {
  return mockProducts.find((p) => p.id === id);
}

/**
 * Helper function to get a single product by slug
 */
export function getProductBySlug(slug: string): Product | undefined {
  return mockProducts.find((p) => p.slug === slug);
}

/**
 * Helper function to filter products by tags
 */
export function getProductsByTags(tags: string[]): Product[] {
  return mockProducts.filter((p) =>
    tags.some((tag) => p.tags.includes(tag))
  );
}

/**
 * Helper function to get in-stock variants for a product
 */
export function getInStockVariants(productId: string) {
  const product = getProductById(productId);
  return product?.variants.filter((v) => v.inStock) || [];
}
