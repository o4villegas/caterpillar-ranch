/**
 * Printful API v2 Client
 *
 * Handles all communication with the Printful API
 * Docs: https://developers.printful.com/docs/
 * Schema: DO-NOT-DELETE/printful-schema.json
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
    files: Array<{
      id: number;
      type: string;
      hash: string;
      url: string;
      filename: string;
      mime_type: string;
      size: number;
      width: number;
      height: number;
      dpi: number;
      status: string;
      created: number;
      thumbnail_url: string;
      preview_url: string;
      visible: boolean;
    }>;
    product: {
      variant_id: number;
      product_id: number;
      image: string;
      name: string;
    };
  }>;
}

export interface PrintfulOrder {
  id: number;
  external_id: string;
  status: string;
  shipping: string;
  recipient: PrintfulRecipient;
  items: PrintfulOrderItem[];
  costs: PrintfulCosts;
}

export interface PrintfulRecipient {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
  phone?: string;
  email: string;
}

export interface PrintfulOrderItem {
  variant_id: number;
  quantity: number;
  retail_price: string;
  files?: Array<{
    type: string;
    url: string;
  }>;
}

export interface PrintfulCosts {
  currency: string;
  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
}

export interface PrintfulEstimate {
  costs: PrintfulCosts;
  retail_costs: PrintfulCosts;
  shipping_date: {
    min: string;
    max: string;
  };
}

/**
 * Printful API Client
 */
export class PrintfulClient {
  private baseUrl = 'https://api.printful.com';
  private token: string;
  private storeId: string;

  constructor(token: string, storeId: string) {
    this.token = token;
    this.storeId = storeId;
  }

  /**
   * Make authenticated request to Printful API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Printful API error (${response.status}): ${error}`
      );
    }

    const data = await response.json() as T;
    return data;
  }

  /**
   * Get all catalog products
   * GET /v2/catalog-products
   */
  async getCatalogProducts(): Promise<PrintfulProduct[]> {
    const response = await this.request<{
      data: PrintfulProduct[];
    }>('/v2/catalog-products');

    return response.data;
  }

  /**
   * Get product by ID
   * GET /v2/catalog-products/:id
   */
  async getProduct(productId: number): Promise<PrintfulProduct> {
    const response = await this.request<{
      data: PrintfulProduct;
    }>(`/v2/catalog-products/${productId}`);

    return response.data;
  }

  /**
   * Get catalog variants for a product
   * GET /v2/catalog-products/:id/catalog-variants
   */
  async getCatalogVariants(productId: number): Promise<PrintfulVariant[]> {
    const response = await this.request<{
      data: PrintfulVariant[];
    }>(`/v2/catalog-products/${productId}/catalog-variants`);

    return response.data;
  }

  /**
   * Get all store products (with designs)
   * GET /store/products
   * Requires X-PF-Store-Id header
   */
  async getStoreProducts(): Promise<PrintfulStoreProduct[]> {
    const url = `/store/products`;

    const response = await this.request<{
      code: number;
      result: PrintfulStoreProduct[];
    }>(url, {
      headers: {
        'X-PF-Store-Id': this.storeId,
      },
    });

    return response.result;
  }

  /**
   * Get single store product by ID
   * GET /store/products/:id
   * Requires X-PF-Store-Id header
   */
  async getStoreProduct(productId: number): Promise<PrintfulStoreProduct> {
    const url = `/store/products/${productId}`;

    const response = await this.request<{
      code: number;
      result: PrintfulStoreProduct;
    }>(url, {
      headers: {
        'X-PF-Store-Id': this.storeId,
      },
    });

    return response.result;
  }

  /**
   * Get variant by ID
   * GET /store/variants/:id
   */
  async getVariant(variantId: number): Promise<PrintfulVariant> {
    const response = await this.request<{
      code: number;
      result: PrintfulVariant;
    }>(`/store/variants/${variantId}`);

    return response.result;
  }

  /**
   * Estimate order costs
   * POST /v2/order-estimation-tasks
   */
  async estimateOrder(
    recipient: PrintfulRecipient,
    items: PrintfulOrderItem[]
  ): Promise<PrintfulEstimate> {
    const response = await this.request<{
      data: PrintfulEstimate;
    }>('/v2/order-estimation-tasks', {
      method: 'POST',
      body: JSON.stringify({
        store_id: this.storeId,
        recipient,
        items,
      }),
    });

    return response.data;
  }

  /**
   * Create draft order
   * POST /v2/orders
   */
  async createOrder(
    externalId: string,
    recipient: PrintfulRecipient,
    items: PrintfulOrderItem[],
    retailCosts?: PrintfulCosts
  ): Promise<PrintfulOrder> {
    const response = await this.request<{
      data: PrintfulOrder;
    }>('/v2/orders', {
      method: 'POST',
      body: JSON.stringify({
        store_id: this.storeId,
        external_id: externalId,
        recipient,
        items,
        retail_costs: retailCosts,
      }),
    });

    return response.data;
  }

  /**
   * Confirm order (move from draft to confirmed)
   * POST /v2/orders/:id/confirm
   */
  async confirmOrder(orderId: number): Promise<PrintfulOrder> {
    const response = await this.request<{
      data: PrintfulOrder;
    }>(`/v2/orders/${orderId}/confirm`, {
      method: 'POST',
    });

    return response.data;
  }

  /**
   * Get order by ID
   * GET /v2/orders/:id
   */
  async getOrder(orderId: number): Promise<PrintfulOrder> {
    const response = await this.request<{
      data: PrintfulOrder;
    }>(`/v2/orders/${orderId}`);

    return response.data;
  }

  /**
   * Get order by external ID
   * GET /v2/orders?external_id=:external_id
   */
  async getOrderByExternalId(externalId: string): Promise<PrintfulOrder> {
    const response = await this.request<{
      data: PrintfulOrder[];
    }>(`/v2/orders?external_id=${externalId}`);

    return response.data[0];
  }
}

/**
 * Cache helper for KV storage
 */
export class PrintfulCache {
  private kv: KVNamespace;
  private ttl: {
    products: number;
    variants: number;
  };

  constructor(kv: KVNamespace) {
    this.kv = kv;
    this.ttl = {
      products: 60 * 60, // 1 hour
      variants: 60 * 60 * 6, // 6 hours
    };
  }

  /**
   * Get cached products list
   */
  async getProducts(): Promise<PrintfulStoreProduct[] | null> {
    const cached = await this.kv.get('printful:products:list');
    if (!cached) return null;

    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }

  /**
   * Cache products list
   */
  async setProducts(products: PrintfulStoreProduct[]): Promise<void> {
    await this.kv.put(
      'printful:products:list',
      JSON.stringify(products),
      { expirationTtl: this.ttl.products }
    );
  }

  /**
   * Get cached product
   */
  async getProduct(productId: number): Promise<PrintfulStoreProduct | null> {
    const cached = await this.kv.get(`printful:product:${productId}`);
    if (!cached) return null;

    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }

  /**
   * Cache product
   */
  async setProduct(product: PrintfulStoreProduct): Promise<void> {
    await this.kv.put(
      `printful:product:${product.sync_product.id}`,
      JSON.stringify(product),
      { expirationTtl: this.ttl.products }
    );
  }

  /**
   * Get cached variants for a product
   */
  async getVariants(productId: number): Promise<PrintfulVariant[] | null> {
    const cached = await this.kv.get(`printful:variants:${productId}`);
    if (!cached) return null;

    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }

  /**
   * Cache variants for a product
   */
  async setVariants(productId: number, variants: PrintfulVariant[]): Promise<void> {
    await this.kv.put(
      `printful:variants:${productId}`,
      JSON.stringify(variants),
      { expirationTtl: this.ttl.variants }
    );
  }

  /**
   * Invalidate product cache
   */
  async invalidateProduct(productId: number): Promise<void> {
    await this.kv.delete(`printful:product:${productId}`);
    await this.kv.delete(`printful:variants:${productId}`);
    await this.kv.delete('printful:products:list');
  }

  /**
   * Invalidate all product cache
   */
  async invalidateAll(): Promise<void> {
    await this.kv.delete('printful:products:list');
  }
}
