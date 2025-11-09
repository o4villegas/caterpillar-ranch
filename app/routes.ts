import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("products/:slug", "routes/product.tsx"),
  route("games/the-culling", "routes/games.the-culling.tsx"),
  route("games/cursed-harvest", "routes/games.cursed-harvest.tsx"),
  route("games/bug-telegram", "routes/games.bug-telegram.tsx"),
  route("games/hungry-caterpillar", "routes/games.hungry-caterpillar.tsx"),
  route("games/midnight-garden", "routes/games.midnight-garden.tsx"),
] satisfies RouteConfig;
