import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import type { Route } from "./+types/home";
import { transformStoreProduct, transformStoreProductListItem } from "../lib/api/transformers";
import { Badge } from "../lib/components/ui/badge";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Caterpillar Ranch - Horror Tees" },
    { name: "description", content: "Cute horror t-shirts. Play games, earn discounts on your order." },
  ];
}

export function links() {
  return [
    // Preload PNG logo (717KB, better performance than GIF) to improve LCP
    { rel: "preload", as: "image", href: "/cr-logo.png", type: "image/png" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const cloudflare = context.cloudflare as { env: Env };

  try {
    const db = cloudflare.env.DB;

    // Step 1: Query D1 database for active products with design images (ordered by display_order)
    const dbProductsResult = await db.prepare(`
      SELECT
        p.id, p.name, p.slug, p.description,
        p.base_price, p.retail_price,
        p.image_url, p.tags, p.status, p.display_order,
        p.created_at,
        pd.design_url
      FROM products p
      LEFT JOIN product_designs pd ON p.id = pd.product_id
      WHERE p.status = 'active'
      ORDER BY p.display_order ASC NULLS LAST, p.created_at DESC
    `).all();

    // If D1 has products, use them (fast path - ~5ms)
    if (dbProductsResult.results && dbProductsResult.results.length > 0) {
      // Step 2: Fetch variants for each product
      const productsWithVariants = await Promise.all(
        dbProductsResult.results.map(async (dbProduct: any) => {
          const variantsResult = await db.prepare(`
            SELECT id, size, color, printful_variant_id, in_stock
            FROM product_variants
            WHERE product_id = ?
            ORDER BY size ASC
          `).bind(dbProduct.id).all();

          // Transform D1 row to Product type
          // Prioritize design image over Printful thumbnail
          const imageUrl = dbProduct.design_url
            ? `/api/admin/designs/serve/${dbProduct.design_url}`
            : dbProduct.image_url;

          return {
            id: dbProduct.id,
            name: dbProduct.name,
            slug: dbProduct.slug,
            description: dbProduct.description || 'A unique design from Caterpillar Ranch.',
            price: dbProduct.retail_price || dbProduct.base_price || 0,
            imageUrl,
            designImageUrl: dbProduct.design_url ? imageUrl : undefined,
            tags: dbProduct.tags ? JSON.parse(dbProduct.tags) : ['apparel'],
            createdAt: dbProduct.created_at,
            variants: (variantsResult.results || []).map((v: any) => ({
              id: v.id,
              printfulVariantId: v.printful_variant_id,
              size: v.size,
              color: v.color,
              inStock: v.in_stock === 1,
            })),
          };
        })
      );

      return {
        products: productsWithVariants,
        message: cloudflare.env.VALUE_FROM_CLOUDFLARE,
        cached: false,
        source: 'database',
      };
    }

    // Step 3: Fallback to Printful API (fresh install or no products synced yet)
    console.log('No products in D1 database, falling back to Printful API');

    const { PrintfulClient, PrintfulCache } = await import('../../workers/lib/printful');

    const cache = new PrintfulCache(cloudflare.env.CATALOG_CACHE);
    const printful = new PrintfulClient(
      cloudflare.env.PRINTFUL_API_TOKEN,
      cloudflare.env.PRINTFUL_STORE_ID
    );

    // Get list of product IDs
    let storeProducts = await cache.getProducts();
    let cached = true;

    if (!storeProducts) {
      // Fetch from Printful if not cached
      storeProducts = await printful.getStoreProducts();
      await cache.setProducts(storeProducts);
      cached = false;
    }

    // Fetch full details for each product (with prices and variants)
    const productPromises = storeProducts.map(async (item) => {
      try {
        const cachedFull = await cache.getProduct(item.id);
        if (cachedFull) {
          return { success: true, product: transformStoreProduct(cachedFull) };
        }

        const fullProduct = await printful.getStoreProduct(item.id);
        await cache.setProduct(fullProduct);
        return { success: true, product: transformStoreProduct(fullProduct) };
      } catch (error) {
        console.error(`Failed to fetch product ${item.id}:`, error);
        // Fallback: return product with $0 price (graceful degradation)
        return { success: false, product: transformStoreProductListItem(item) };
      }
    });

    const results = await Promise.allSettled(productPromises);

    // Extract products (both successful and fallback)
    const products = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value.product);

    // Fetch design images for all products
    const designImagesResult = await db.prepare(`
      SELECT product_id, design_url
      FROM product_designs
    `).all();

    // Map design URLs to products
    const designImagesMap = new Map(
      (designImagesResult.results || []).map((d: any) => [d.product_id, d.design_url])
    );

    // Add design images to products
    const productsWithDesigns = products.map((product) => {
      const designUrl = designImagesMap.get(product.id);
      if (designUrl) {
        const designImageUrl = `/api/admin/designs/serve/${designUrl}`;
        return {
          ...product,
          imageUrl: designImageUrl, // Prioritize design image
          designImageUrl,
        };
      }
      return product;
    });

    return {
      products: productsWithDesigns,
      message: cloudflare.env.VALUE_FROM_CLOUDFLARE,
      cached,
      source: 'printful',
    };
  } catch (error) {
    console.error('Failed to fetch products:', error);

    // Return empty products array on error
    return {
      products: [],
      message: cloudflare.env.VALUE_FROM_CLOUDFLARE,
      cached: false,
      source: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen px-4 md:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.header
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="mb-4">
            <motion.img
              src="/cr-logo.png"
              alt="Caterpillar Ranch - Horror Tees"
              width="500"
              height="500"
              loading="eager"
              fetchPriority="high"
              className="mx-auto"
              style={{
                maxWidth: "min(500px, 90vw)",
                height: "auto",
                width: "100%"
              }}
              // Entrance animation (fade + scale)
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: [1, 1.02, 1], // Breathing effect (3s cycle)
                y: [0, -10, 0], // Floating effect (8s cycle)
                filter: [
                  'drop-shadow(0 0 15px rgba(50, 205, 50, 0.4))',
                  'drop-shadow(0 0 25px rgba(50, 205, 50, 0.6))',
                  'drop-shadow(0 0 15px rgba(50, 205, 50, 0.4))'
                ] // Pulsing glow (2s cycle)
              }}
              transition={{
                opacity: { duration: 0.6, ease: "easeOut" },
                scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
                filter: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              // Hover effects (scale only)
              whileHover={{
                scale: 1.05,
                transition: {
                  scale: { duration: 0.3 }
                }
              }}
            />
          </h1>
        </motion.header>

        {/* Concept Explanation */}
        <motion.div
          className="text-center mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-lg text-ranch-cream leading-relaxed" style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}>
            Play mini-games to earn discounts on your order.
          </p>
          <p className="text-sm text-ranch-lavender mt-1" style={{ fontFamily: 'Tourney, cursive', fontWeight: 500 }}>
            Higher scores unlock bigger discounts.
          </p>
        </motion.div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {loaderData.products.map((product, index) => (
            <motion.button
              key={product.id}
              onClick={() => navigate(`/products/${product.slug}`)}
              className="card bg-ranch-purple/20 p-4 rounded-2xl border-2 border-ranch-purple hover:border-ranch-lavender transition-all duration-300 cursor-pointer relative overflow-hidden group text-left w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{
                scale: 1.05,
                rotateZ: index % 2 === 0 ? 2 : -2, // 2-3deg tilt (alternating direction)
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              whileTap={{ scale: 0.98 }}
              aria-label={`View ${product.name}`}
            >
              {/* Border glow on hover */}
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-ranch-cyan to-ranch-lime rounded-2xl opacity-0 group-hover:opacity-75 blur-sm -z-10 transition-opacity duration-300"
                aria-hidden="true"
              />

              {/* Glossy highlight overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
                aria-hidden="true"
              />

              {/* Product Image */}
              <div className="relative overflow-hidden rounded-lg mb-4 bg-ranch-purple/10 product-image">
                <motion.img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-auto"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  style={{
                    animation: "breathe 3s ease-in-out infinite",
                  }}
                />
              </div>

              {/* Product Info */}
              <h2 className="text-xl mb-2 leading-tight text-ranch-cream group-hover:text-ranch-dark transition-colors duration-300" style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}>
                {product.name}
              </h2>
              <p className="text-ranch-lavender group-hover:text-ranch-dark/80 text-lg mb-4 line-clamp-2 transition-colors duration-300" style={{ fontFamily: 'Inter, sans-serif' }}>
                {product.description}
              </p>

              {/* Price */}
              <div className="text-4xl text-ranch-lime group-hover:text-ranch-dark transition-colors duration-300" style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}>
                ${product.price}
              </div>

              {/* Stock Status (if any variant out of stock) */}
              {product.variants.some((v) => !v.inStock) && (
                <motion.div
                  className="mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Badge variant="outline" className="text-xs">
                    Some sizes sold out
                  </Badge>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </main>
  );
}
