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
    isRapidFire: true, // ⚡ Rapid-fire item - countdown timer applies
    variants: [
      { id: 'punk-s', size: 'S', color: 'Dark Gray', inStock: true },
      { id: 'punk-m', size: 'M', color: 'Dark Gray', inStock: true },
      { id: 'punk-l', size: 'L', color: 'Dark Gray', inStock: true },
      { id: 'punk-xl', size: 'XL', color: 'Dark Gray', inStock: true },
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
    isRapidFire: false,
    variants: [
      { id: 'rock-s', size: 'S', color: 'Stone Gray', inStock: true },
      { id: 'rock-m', size: 'M', color: 'Stone Gray', inStock: true },
      { id: 'rock-l', size: 'L', color: 'Stone Gray', inStock: true },
      { id: 'rock-xl', size: 'XL', color: 'Stone Gray', inStock: true },
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
    isRapidFire: true, // ⚡ Rapid-fire item - countdown timer applies
    variants: [
      { id: 'weird-s', size: 'S', color: 'Lavender', inStock: true },
      { id: 'weird-m', size: 'M', color: 'Lavender', inStock: true },
      { id: 'weird-l', size: 'L', color: 'Lavender', inStock: true },
      { id: 'weird-xl', size: 'XL', color: 'Lavender', inStock: false }, // Out of stock
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
    isRapidFire: false,
    variants: [
      { id: 'anime-s', size: 'S', color: 'White', inStock: true },
      { id: 'anime-m', size: 'M', color: 'White', inStock: true },
      { id: 'anime-l', size: 'L', color: 'White', inStock: true },
      { id: 'anime-xl', size: 'XL', color: 'White', inStock: true },
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
 * Helper function to get rapid-fire products
 */
export function getRapidFireProducts(): Product[] {
  return mockProducts.filter((p) => p.isRapidFire);
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
