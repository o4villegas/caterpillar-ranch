import { useState } from "react";
import type { Route } from "./+types/home";
import { mockProducts } from "../lib/mocks/products";
import { ProductModal } from "../lib/components/ProductModal";
import type { Product } from "../lib/types/product";

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
        <header className="text-center mb-12">
          <h1 className="drip-text text-5xl md:text-6xl mb-4">
            CATERPILLAR RANCCH
          </h1>
          <p className="text-xl text-ranch-cream opacity-80">
            Cute Horror Tees. Play Games, Earn Discounts.
          </p>
        </header>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {loaderData.products.map((product) => (
            <div
              key={product.id}
              className="card bg-ranch-purple/20 p-4 hover:bg-ranch-purple/30 transition-colors cursor-pointer relative"
            >
              {/* Rapid-Fire Badge */}
              {product.isRapidFire && (
                <div className="heartbeat-pulse inline-block bg-ranch-pink text-ranch-dark px-3 py-1 rounded-full text-xs font-bold mb-2">
                  ⚡ RAPID-FIRE
                </div>
              )}

              {/* Product Image */}
              <div className="relative overflow-hidden rounded-lg mb-4">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-auto breathing hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Product Info */}
              <h2 className="text-lg font-bold mb-2 leading-tight">
                {product.name}
              </h2>
              <p className="text-ranch-cream opacity-70 text-sm mb-4 line-clamp-2">
                {product.description}
              </p>

              {/* Price and Action */}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-ranch-lime">
                  ${product.price}
                </span>
                <button
                  onClick={() => handleOpenModal(product)}
                  className="bg-ranch-cyan hover:bg-ranch-lime text-ranch-dark px-4 py-2 rounded-lg font-bold transition-colors"
                >
                  View
                </button>
              </div>

              {/* Stock Status (if any variant out of stock) */}
              {product.variants.some((v) => !v.inStock) && (
                <div className="mt-2 text-xs text-ranch-pink">
                  Some sizes out of stock
                </div>
              )}
            </div>
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
