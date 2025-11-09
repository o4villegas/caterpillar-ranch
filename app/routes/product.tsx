import { useEffect, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { Route } from './+types/product';
import type { ProductVariant } from '~/lib/types/product';
import { getProductBySlug } from '~/lib/mocks/products';
import { useCart } from '~/lib/contexts/CartContext';
import { HORROR_COPY, getRandomLoadingMessage } from '~/lib/constants/horror-copy';
import { ParticleBurst } from '~/lib/components/ParticleBurst';
import { GameModal } from '~/lib/components/GameModal';
import { ProductView } from '~/lib/components/ProductView';

export async function loader({ params }: Route.LoaderArgs) {
  const product = getProductBySlug(params.slug);

  if (!product) {
    throw new Response('Product not found', { status: 404 });
  }

  return { product };
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
  const imageUrl = `https://caterpillar-ranch.lando555.workers.dev${product.imageUrl}`;

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
    const productDiscounts = cart.discounts.filter(
      (d) => d.productId === product.id || d.productId === product.slug
    );

    if (productDiscounts.length > 0) {
      // Apply highest discount
      const maxDiscount = Math.max(...productDiscounts.map((d) => d.discountPercent));
      setEarnedDiscount(maxDiscount);
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

  const inStockVariants = product.variants.filter(v => v.inStock);

  return (
    <div className="min-h-screen bg-ranch-dark py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <motion.button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-ranch-lavender hover:text-ranch-lime transition-colors"
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
          isAdding={isAdding}
          loadingMessage={loadingMessage}
          inStockVariants={inStockVariants}
          onPlayGame={() => setIsGameModalOpen(true)}
          onAddToCart={handleAddToCart}
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
