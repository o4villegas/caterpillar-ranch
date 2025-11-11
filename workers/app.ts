import { Hono } from "hono";
import { createRequestHandler } from "react-router";
// import authRoutes from "./routes/auth"; // TODO: Phase 3 - implement with Web Crypto API (bcryptjs incompatible with Workers)
import catalogRoutes from "./routes/catalog";
import ordersRoutes from "./routes/orders";

const app = new Hono();

// API Routes
// app.route("/api/auth", authRoutes); // TODO: Phase 3 - enable after Workers-compatible auth implementation
app.route("/api/catalog", catalogRoutes);
app.route("/api/orders", ordersRoutes);

// Add more API routes here

app.get("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;
