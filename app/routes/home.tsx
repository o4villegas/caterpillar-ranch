import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import type { Route } from "./+types/home";
import { mockProducts } from "../lib/mocks/products";
import { Badge } from "../lib/components/ui/badge";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Caterpillar Ranch - Horror Tees" },
    { name: "description", content: "Cute horror t-shirts. Play games, earn discounts up to 40% off." },
  ];
}

export function links() {
  return [
    // Preload PNG logo (717KB, better performance than GIF) to improve LCP
    { rel: "preload", as: "image", href: "/cr-logo.png", type: "image/png" },
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
          <p className="text-4xl text-ranch-cream leading-relaxed" style={{ fontFamily: 'Handjet, monospace', fontWeight: 800 }}>
            Play mini-games to earn up to 40% off your order.
          </p>
          <p className="text-lg text-ranch-lavender mt-1" style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}>
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
                    animation: "breathing 3s ease-in-out infinite",
                  }}
                />
              </div>

              {/* Product Info */}
              <h2 className="text-2xl mb-2 leading-tight text-ranch-cream group-hover:text-ranch-dark transition-colors duration-300" style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}>
                {product.name}
              </h2>
              <p className="text-ranch-lavender group-hover:text-ranch-dark/80 text-lg mb-4 line-clamp-2 transition-colors duration-300" style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}>
                {product.description}
              </p>

              {/* Price */}
              <div className="text-4xl text-ranch-lime group-hover:text-ranch-dark transition-colors duration-300" style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}>
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

        {/* Leaderboard Link */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-ranch-purple/30 border-2 border-ranch-purple text-ranch-cream font-bold rounded-lg hover:bg-ranch-purple/50 hover:border-ranch-lime hover:text-ranch-lime transition-all hover:scale-105"
          >
            <span className="text-xl">🏆</span>
            <span>View Leaderboards</span>
          </Link>
        </motion.div>

        {/* Debug Info (Dev Only) */}
        {import.meta.env.DEV && (
          <div className="mt-12 p-4 bg-ranch-purple/10 rounded-lg">
            <p className="text-lg opacity-50">
              ENV: {loaderData.message} | Products: {loaderData.products.length}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
