import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("products/:slug", "routes/product.tsx"),
] satisfies RouteConfig;
