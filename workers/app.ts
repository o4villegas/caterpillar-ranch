import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import authRoutes from "./routes/auth";
import catalogRoutes from "./routes/catalog";

const app = new Hono();

// API Routes
app.route("/api/auth", authRoutes);
app.route("/api/catalog", catalogRoutes);

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
