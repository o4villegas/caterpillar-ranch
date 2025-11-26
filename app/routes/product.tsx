import { useEffect, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { Route } from './+types/product';
import type { ProductVariant } from '~/lib/types/product';
import { transformStoreProduct, transformStoreProductListItems } from '~/lib/api/transformers';
import { useCart } from '~/lib/contexts/CartContext';
import { useGamePlaySession } from '~/lib/hooks/useGamePlaySession';
import { HORROR_COPY, getRandomLoadingMessage } from '~/lib/constants/horror-copy';
import { ParticleBurst } from '~/lib/components/ParticleBurst';
import { GameModal } from '~/lib/components/GameModal';
import { ProductView } from '~/lib/components/ProductView';

export async function loader({ params, context }: Route.LoaderArgs) {
  const cloudflare = context.cloudflare as { env: Env };

  try {
    // Import PrintfulClient directly for SSR (avoid self-fetch issues)
    const { PrintfulClient, PrintfulCache } = await import('../../workers/lib/printful');

    const cache = new PrintfulCache(cloudflare.env.CATALOG_CACHE);
    const printful = new PrintfulClient(
      cloudflare.env.PRINTFUL_API_TOKEN,
      cloudflare.env.PRINTFUL_STORE_ID
    );

    // First get the product list to find by slug
    let storeProducts = await cache.getProducts();
    if (!storeProducts) {
      storeProducts = await printful.getStoreProducts();
      await cache.setProducts(storeProducts);
    }

    // Find product by slug
    const products = transformStoreProductListItems(storeProducts);
    const product = products.find((p) => p.slug === params.slug);

    if (!product) {
      throw new Response('Product not found', { status: 404 });
    }

    // Now fetch full product details with variants
    const cachedFullProduct = await cache.getProduct(parseInt(product.id));
    let fullProduct;

    if (cachedFullProduct) {
      fullProduct = cachedFullProduct;
    } else {
      fullProduct = await printful.getStoreProduct(parseInt(product.id));
      await cache.setProduct(fullProduct);
    }

    // Transform to our Product type
    const transformedProduct = transformStoreProduct(fullProduct);

    // Fetch design image from D1 if exists
    // Note: product_designs.product_id uses "cr-" prefix format (e.g., "cr-403422458")
    // but Printful transformer returns numeric ID (e.g., "403422458")
    const db = cloudflare.env.DB;
    const designResult = await db
      .prepare('SELECT design_url FROM product_designs WHERE product_id = ?')
      .bind(`cr-${product.id}`)
      .first<{ design_url: string }>();

    // Add design URL to product if exists
    if (designResult?.design_url) {
      transformedProduct.designImageUrl = `/api/admin/designs/serve/${designResult.design_url}`;
    }

    return { product: transformedProduct };
  } catch (error) {
    console.error('Failed to fetch product:', error);
    throw new Response('Product not found', { status: 404 });
  }
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.product) {
    return [
      { title: 'Product Not Found | Caterpillar Ranch' },
      { name: 'description', content: 'Product not found' },
    ];
  }

  const { product } = data;
  const productUrl = `https://caterpillar-ranch.lando555.workers.dev/products/${product.slug}`;
  // imageUrl already contains full Printful CDN URL, don't prepend domain
  const imageUrl = product.imageUrl;

  return [
    { title: `${product.name} | Caterpillar Ranch` },
    { name: 'description', content: product.description },

    // Open Graph tags for social sharing
    { property: 'og:title', content: product.name },
    { property: 'og:description', content: product.description },
    { property: 'og:image', content: imageUrl },
    { property: 'og:url', content: productUrl },
    { property: 'og:type', content: 'product' },
    { property: 'og:price:amount', content: product.price.toString() },
    { property: 'og:price:currency', content: 'USD' },

    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: product.name },
    { name: 'twitter:description', content: product.description },
    { name: 'twitter:image', content: imageUrl },

    // Additional meta tags
    { name: 'product:price:amount', content: product.price.toString() },
    { name: 'product:price:currency', content: 'USD' },
    { name: 'product:availability', content: product.variants.some(v => v.inStock) ? 'in stock' : 'out of stock' },
  ];
}

export default function ProductPage() {
  const { product } = useLoaderData<typeof loader>();
  const { addToCart, cart } = useCart();
  const { wasPlayedInSession, markAsPlayed } = useGamePlaySession();
  const navigate = useNavigate();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(getRandomLoadingMessage());
  const [showParticleBurst, setShowParticleBurst] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [earnedDiscount, setEarnedDiscount] = useState(0);

  // Load discount from CartContext (if user completed a game)
  useEffect(() => {
    // Filter for this product and exclude expired discounts
    const productDiscounts = cart.discounts.filter(
      (d) =>
        (d.productId === product.id || d.productId === product.slug) &&
        new Date(d.expiresAt) > new Date()
    );

    if (productDiscounts.length > 0) {
      // Get latest discount (most recently earned)
      const latestDiscount = productDiscounts.reduce((latest, current) => {
        return new Date(current.earnedAt) > new Date(latest.earnedAt) ? current : latest;
      });
      setEarnedDiscount(latestDiscount.discountPercent);
    } else {
      // Reset if no valid discounts
      setEarnedDiscount(0);
    }
  }, [cart.discounts, product.id, product.slug]);

  // Set first in-stock variant as default
  useEffect(() => {
    if (!selectedVariant) {
      const firstInStock = product.variants.find(v => v.inStock);
      if (firstInStock) {
        setSelectedVariant(firstInStock);
      }
    }
  }, [product.variants, selectedVariant]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    setIsAdding(true);
    setLoadingMessage(getRandomLoadingMessage());

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 600));

    addToCart(product, selectedVariant.id, quantity, earnedDiscount);
    setIsAdding(false);

    // Trigger particle burst effect
    setShowParticleBurst(true);
    setTimeout(() => setShowParticleBurst(false), 1000);

    // Show toast notification with horror theme
    toast.success(HORROR_COPY.success.added, {
      description: `${quantity}x ${product.name} (${selectedVariant.size}) - The Ranch accepts your selection 🐛`,
      duration: 3000,
    });

    // Navigate back to homepage after brief delay
    setTimeout(() => {
      navigate('/');
    }, 800);
  };

  const handleGameComplete = (discount: number) => {
    setEarnedDiscount(discount);
  };

  const handlePlayGame = () => {
    // Mark product as played in current session (prevents replay in same session)
    markAsPlayed(product.id);
    setIsGameModalOpen(true);
  };

  const inStockVariants = product.variants.filter(v => v.inStock);

  // Determine if Play Game button should show (not played in current session)
  const canPlayGame = !wasPlayedInSession(product.id);

  return (
    <div className="min-h-screen bg-ranch-dark py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <motion.button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-ranch-lavender hover:text-ranch-lime transition-colors font-display-600"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
        >
          <span className="text-xl">←</span>
          <span>Back to Products</span>
        </motion.button>

        {/* Product content */}
        <ProductView
          product={product}
          selectedVariant={selectedVariant}
          setSelectedVariant={setSelectedVariant}
          quantity={quantity}
          setQuantity={setQuantity}
          earnedDiscount={earnedDiscount}
          canPlayGame={canPlayGame}
          isAdding={isAdding}
          loadingMessage={loadingMessage}
          inStockVariants={inStockVariants}
          onPlayGame={handlePlayGame}
          onAddToCart={handleAddToCart}
          showColorSelection={true}
          designImageUrl={product.designImageUrl}
        />
      </div>

      <ParticleBurst trigger={showParticleBurst} />
      <GameModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
        productId={product.id}
        productSlug={product.slug}
        onGameComplete={handleGameComplete}
      />
    </div>
  );
}
