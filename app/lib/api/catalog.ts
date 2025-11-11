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
  data: PrintfulStoreProduct[];
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
  const response = await fetchCatalogProducts(request);

  // Import transformer to generate slug
  const { transformStoreProducts } = await import('./transformers');
  const products = transformStoreProducts(response.data);

  // Find product by slug
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return null;
  }

  // Find the original Printful store product by ID
  const storeProduct = response.data.find((p) => p.sync_product.id.toString() === product.id);

  return storeProduct || null;
}
