import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("products/:slug", "routes/product.tsx"),
  route("checkout", "routes/checkout.tsx"),
  route("checkout/review", "routes/checkout.review.tsx"),
  route("checkout/confirmation", "routes/checkout.confirmation.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("terms", "routes/terms.tsx"),
  route("shipping", "routes/shipping.tsx"),
  route("games/the-culling", "routes/games.the-culling.tsx"),
  route("games/cursed-harvest", "routes/games.cursed-harvest.tsx"),
  route("games/bug-telegram", "routes/games.bug-telegram.tsx"),
  route("games/hungry-caterpillar", "routes/games.hungry-caterpillar.tsx"),
  route("games/midnight-garden", "routes/games.midnight-garden.tsx"),
  route("games/metamorphosis-queue", "routes/games.metamorphosis-queue.tsx"),
  route("admin/login", "routes/admin.login.tsx"),
  layout("routes/admin/layout.tsx", [
    route("admin/dashboard", "routes/admin/dashboard.tsx"),
    route("admin/products", "routes/admin/products.tsx"),
    route("admin/orders", "routes/admin/orders.tsx"),
  ]),
] satisfies RouteConfig;
