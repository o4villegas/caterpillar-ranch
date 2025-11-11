/**
 * API Data Transformers
 *
 * Converts Printful API responses to our internal Product types
 */

import type { Product, ProductVariant } from '../types/product';
import type { PrintfulProduct, PrintfulVariant } from './catalog';

/**
 * Generate URL-friendly slug from product name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extract tags from product name and description
 */
function extractTags(product: PrintfulProduct): string[] {
  const text = `${product.name} ${product.description}`.toLowerCase();
  const tags: string[] = [];

  // Common keywords to extract as tags
  const keywords = ['vintage', 'retro', 'punk', 'rock', 'horror', 'cute', 'kawaii', 'anime'];

  keywords.forEach((keyword) => {
    if (text.includes(keyword)) {
      tags.push(keyword);
    }
  });

  return tags.length > 0 ? tags : ['apparel'];
}

/**
 * Transform Printful variant to our ProductVariant type
 */
function transformVariant(printfulVariant: PrintfulVariant): ProductVariant {
  return {
    id: printfulVariant.id.toString(),
    size: printfulVariant.size as any, // Printful sizes should match our ProductSize type
    color: printfulVariant.color,
    inStock: printfulVariant.in_stock,
  };
}

/**
 * Transform Printful product to our Product type
 */
export function transformProduct(printfulProduct: PrintfulProduct): Product {
  // Use first variant's price as base price (convert string to number)
  const basePrice = printfulProduct.variants.length > 0
    ? parseFloat(printfulProduct.variants[0].price)
    : 0;

  return {
    id: printfulProduct.id.toString(),
    name: printfulProduct.name,
    slug: generateSlug(printfulProduct.name),
    description: printfulProduct.description || 'A unique print-on-demand product from Caterpillar Ranch.',
    price: basePrice,
    imageUrl: printfulProduct.image,
    variants: printfulProduct.variants.map(transformVariant),
    tags: extractTags(printfulProduct),
    createdAt: new Date().toISOString(), // Printful doesn't provide this
  };
}

/**
 * Transform array of Printful products
 */
export function transformProducts(printfulProducts: PrintfulProduct[]): Product[] {
  return printfulProducts.map(transformProduct);
}
