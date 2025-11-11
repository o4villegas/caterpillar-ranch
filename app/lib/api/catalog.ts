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

export interface CatalogAPIResponse {
  data: PrintfulProduct[];
  meta: {
    cached: boolean;
    source: string;
  };
}

/**
 * Fetch all products from catalog API
 */
export async function fetchCatalogProducts(): Promise<CatalogAPIResponse> {
  const response = await fetch('/api/catalog/products');

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
 */
export async function fetchProductBySlug(slug: string): Promise<PrintfulProduct | null> {
  const response = await fetchCatalogProducts();

  // Import transformer to generate slug
  const { transformProducts } = await import('./transformers');
  const products = transformProducts(response.data);

  // Find product by slug
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return null;
  }

  // Find the original Printful product by ID
  const printfulProduct = response.data.find((p) => p.id.toString() === product.id);

  return printfulProduct || null;
}
