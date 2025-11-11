/**
 * Catalog API Client
 *
 * Fetches product data from Printful via our API routes
 */

/**
 * Printful API Response Types (from workers/lib/printful.ts)
 */
export interface PrintfulProduct {
  id: number;
  name: string;
  description: string;
  image: string;
  variants: PrintfulVariant[];
}

export interface PrintfulVariant {
  id: number;
  product_id: number;
  name: string;
  size: string;
  color: string;
  price: string;
  in_stock: boolean;
  sku: string;
}

/**
 * Store Product Types (from /store/products endpoint)
 */

/**
 * Simplified product list item (from GET /store/products)
 */
export interface PrintfulStoreProductListItem {
  id: number;
  external_id: string;
  name: string;
  variants: number; // Count of variants
  synced: number; // Count of synced variants
  thumbnail_url: string;
  is_ignored: boolean;
}

/**
 * Full product details (from GET /store/products/:id)
 */
export interface PrintfulStoreProduct {
  sync_product: {
    id: number;
    external_id: string;
    name: string;
    thumbnail_url: string;
  };
  sync_variants: Array<{
    id: number;
    external_id: string;
    sync_product_id: number;
    name: string;
    synced: boolean;
    variant_id: number;
    retail_price: string;
    currency: string;
    is_ignored: boolean;
    product: {
      variant_id: number;
      product_id: number;
      image: string;
      name: string;
    };
  }>;
}

export interface CatalogAPIResponse {
  data: PrintfulStoreProductListItem[];
  meta: {
    cached: boolean;
    source: string;
  };
}

/**
 * Fetch all products from catalog API
 * @param request - Optional Request object for SSR (to construct absolute URLs)
 */
export async function fetchCatalogProducts(request?: Request): Promise<CatalogAPIResponse> {
  // Construct absolute URL for SSR (Cloudflare Workers context)
  const url = request
    ? new URL('/api/catalog/products', request.url).toString()
    : '/api/catalog/products';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch single product by ID
 */
export async function fetchProduct(productId: number): Promise<{
  data: PrintfulProduct;
  meta: { cached: boolean; source: string };
}> {
  const response = await fetch(`/api/catalog/products/${productId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch product ${productId}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch product by slug
 * Note: Since Printful doesn't have slugs, we fetch all products and find by generated slug
 * @param slug - Product slug to search for
 * @param request - Optional Request object for SSR (to construct absolute URLs)
 */
export async function fetchProductBySlug(slug: string, request?: Request): Promise<PrintfulStoreProduct | null> {
  // First, get the product list to find the ID
  const listResponse = await fetchCatalogProducts(request);

  // Import transformer to generate slug
  const { transformStoreProductListItems } = await import('./transformers');
  const products = transformStoreProductListItems(listResponse.data);

  // Find product by slug
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return null;
  }

  // Now fetch the full product details with variants
  const url = request
    ? new URL(`/api/catalog/products/${product.id}`, request.url).toString()
    : `/api/catalog/products/${product.id}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch product ${product.id}: ${response.status} ${response.statusText}`);
  }

  const fullProduct = await response.json() as {
    data: PrintfulStoreProduct;
    meta: { cached: boolean; source: string };
  };
  return fullProduct.data;
}
