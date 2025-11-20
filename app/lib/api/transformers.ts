/**
 * API Data Transformers
 *
 * Converts Printful API responses to our internal Product types
 */

import type { Product, ProductVariant, ColorVariant } from '../types/product';
import type { PrintfulProduct, PrintfulVariant, PrintfulStoreProduct, PrintfulStoreProductListItem } from './catalog';

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
 * Extract tags from store product name
 */
function extractTagsFromStoreProduct(name: string): string[] {
  const text = name.toLowerCase();
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
    printfulVariantId: printfulVariant.id, // Preserve numeric ID for order creation
    size: printfulVariant.size as any, // Printful sizes should match our ProductSize type
    color: printfulVariant.color,
    inStock: printfulVariant.in_stock,
  };
}

/**
 * Map color names to hex codes for swatch rendering
 */
function colorNameToHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    'Black': '#000000',
    'White': '#FFFFFF',
    'Navy': '#000080',
    'Grey': '#808080',
    'Gray': '#808080',
    'Dark Heather Grey': '#464646',
    'Heather Grey': '#A9A9A9',
    'Natural': '#F5F5DC',
    'Red': '#FF0000',
    'Blue': '#0000FF',
    'Green': '#008000',
    'Yellow': '#FFFF00',
    'Pink': '#FFC0CB',
    'Purple': '#800080',
    'Orange': '#FFA500',
    'Default': '#CCCCCC',
  };
  return colorMap[colorName] || '#CCCCCC';
}

/**
 * Group variants by color for color swatch UI
 */
function groupVariantsByColor(variants: ProductVariant[]): ColorVariant[] {
  const colorMap = new Map<string, ProductVariant[]>();

  // Group variants by color
  variants.forEach(v => {
    if (!colorMap.has(v.color)) {
      colorMap.set(v.color, []);
    }
    colorMap.get(v.color)!.push(v);
  });

  // Size order for sorting
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];

  // Convert to ColorVariant array
  return Array.from(colorMap.entries()).map(([color, sizes]) => ({
    color,
    mockupUrl: sizes[0].mockupUrl || '',  // Use first variant's mockup
    hexCode: colorNameToHex(color),
    sizes: sizes.sort((a, b) => {
      const aIndex = sizeOrder.indexOf(a.size);
      const bIndex = sizeOrder.indexOf(b.size);
      return aIndex - bIndex;
    }),
    inStock: sizes.some(s => s.inStock),
  }));
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

/**
 * Transform Printful store product variant to our ProductVariant type
 */
function transformStoreVariant(syncVariant: PrintfulStoreProduct['sync_variants'][0]): ProductVariant {
  // Extract size and color from variant name
  // Format: "Product Name / Color / Size" (e.g., "Protest Tee / Black / S")
  const parts = syncVariant.name.split(' / ');

  let size = 'M';  // Default fallback
  let color = 'Default';  // Default fallback

  if (parts.length >= 3) {
    // Standard format: [Product Name, Color, Size]
    color = parts[parts.length - 2].trim();  // Second-to-last is color
    size = parts[parts.length - 1].trim();   // Last is size
  } else if (parts.length === 2) {
    // Fallback: [Product Name, Size] (no color specified)
    size = parts[1].trim();
  }

  // Extract mockup URL from files array
  // Priority: preview > default > product.image
  const mockupUrl = syncVariant.files?.find(f => f.type === 'preview')?.preview_url
    || syncVariant.files?.find(f => f.type === 'default')?.preview_url
    || syncVariant.product?.image
    || '';

  return {
    id: syncVariant.id.toString(),
    printfulVariantId: syncVariant.variant_id, // Use variant_id for order creation
    size: size as any,
    color: color,
    mockupUrl,  // NEW: Include mockup URL
    inStock: syncVariant.synced && !syncVariant.is_ignored,
  };
}

/**
 * Transform Printful store product to our Product type
 */
export function transformStoreProduct(storeProduct: PrintfulStoreProduct): Product {
  const { sync_product, sync_variants } = storeProduct;

  // Use first variant's price as base price (convert string to number)
  const basePrice = sync_variants.length > 0
    ? parseFloat(sync_variants[0].retail_price)
    : 0;

  // Transform all synced variants
  const transformedVariants = sync_variants
    .filter((v) => v.synced && !v.is_ignored)
    .map(transformStoreVariant);

  return {
    id: sync_product.id.toString(),
    name: sync_product.name,
    slug: generateSlug(sync_product.name),
    description: `A unique design from Caterpillar Ranch. ${sync_product.name}`,
    price: basePrice,
    imageUrl: sync_product.thumbnail_url,
    designImageUrl: undefined,  // Will be populated from D1 in loaders
    variants: transformedVariants,
    colorVariants: groupVariantsByColor(transformedVariants),  // NEW: Grouped by color
    tags: extractTagsFromStoreProduct(sync_product.name),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Transform array of Printful store products
 */
export function transformStoreProducts(storeProducts: PrintfulStoreProduct[]): Product[] {
  return storeProducts.map(transformStoreProduct);
}

/**
 * Transform simplified store product list item to our Product type
 * Used for homepage product grid (without full variant details)
 */
export function transformStoreProductListItem(listItem: PrintfulStoreProductListItem): Product {
  return {
    id: listItem.id.toString(),
    name: listItem.name,
    slug: generateSlug(listItem.name),
    description: `A unique design from Caterpillar Ranch. ${listItem.name}`,
    price: 0, // Price will be fetched when viewing product details
    imageUrl: listItem.thumbnail_url,
    variants: [], // Variants will be loaded on product detail page
    tags: extractTagsFromStoreProduct(listItem.name),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Transform array of simplified store product list items
 */
export function transformStoreProductListItems(listItems: PrintfulStoreProductListItem[]): Product[] {
  return listItems.map(transformStoreProductListItem);
}
