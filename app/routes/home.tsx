import { useState } from "react";
import { motion } from "framer-motion";
import type { Route } from "./+types/home";
import { mockProducts } from "../lib/mocks/products";
import { ProductModal } from "../lib/components/ProductModal";
import type { Product } from "../lib/types/product";
import { Button } from "../lib/components/ui/button";
import { Badge } from "../lib/components/ui/badge";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Caterpillar Ranch - Horror Tees" },
    { name: "description", content: "Cute horror t-shirts. Play games, earn discounts up to 40% off." },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  const cloudflare = context.cloudflare as { env: Env };
  return {
    products: mockProducts,
    message: cloudflare.env.VALUE_FROM_CLOUDFLARE,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Delay clearing product to allow exit animation
    setTimeout(() => setSelectedProduct(null), 300);
  };

  const handleAddToCart = (productId: string, variantId: string, quantity: number) => {
    // TODO: Implement cart state management in Phase 2
    console.log('Add to cart:', { productId, variantId, quantity });

    // For now, just show a console message
    // In Phase 2, this will integrate with cart state (localStorage + KV)
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.header
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="drip-text text-5xl md:text-6xl mb-4">
            CATERPILLAR RANCCH
          </h1>
          <p className="text-xl text-ranch-cream opacity-80 mb-2">
            Where Cute Meets Creepy
          </p>
          <p className="text-sm text-ranch-lavender">
            Play games to unlock discounts up to 40% off. The caterpillars are watching...
          </p>
        </motion.header>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {loaderData.products.map((product, index) => (
            <motion.div
              key={product.id}
              className="card bg-ranch-purple/20 p-4 rounded-2xl border-2 border-ranch-purple hover:border-ranch-lavender transition-all duration-300 cursor-pointer relative overflow-hidden group"
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
              {/* Rapid-Fire Badge */}
              {product.isRapidFire && (
                <div className="mb-2">
                  <Badge variant="destructive" className="text-xs font-bold">
                    ⚡ RAPID-FIRE
                  </Badge>
                </div>
              )}

              {/* Product Image */}
              <div className="relative overflow-hidden rounded-lg mb-4 bg-ranch-purple/10">
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
                    animation: "breathing 3s ease-in-out infinite",
                  }}
                />
              </div>

              {/* Product Info */}
              <h2 className="text-lg font-bold mb-2 leading-tight text-ranch-cream">
                {product.name}
              </h2>
              <p className="text-ranch-lavender text-sm mb-4 line-clamp-2">
                {product.description}
              </p>

              {/* Price and Action */}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-ranch-lime">
                  ${product.price}
                </span>
                <Button
                  onClick={() => handleOpenModal(product)}
                  size="sm"
                  className="shadow-lg"
                >
                  View Details
                </Button>
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
            </motion.div>
          ))}
        </div>

        {/* Debug Info (Dev Only) */}
        {import.meta.env.DEV && (
          <div className="mt-12 p-4 bg-ranch-purple/10 rounded-lg">
            <p className="text-xs opacity-50">
              ENV: {loaderData.message} | Products: {loaderData.products.length} | Rapid-Fire: {loaderData.products.filter(p => p.isRapidFire).length}
            </p>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCart}
        />
      )}
    </main>
  );
}
