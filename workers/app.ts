import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import authRoutes from "./routes/auth";
import catalogRoutes from "./routes/catalog";
import ordersRoutes from "./routes/orders";
import adminRoutes from "./routes/admin";
import newsletterRoutes from "./routes/newsletter";
import contactRoutes from "./routes/contact";

const app = new Hono();

// API Routes
app.route("/api/auth", authRoutes);
app.route("/api/catalog", catalogRoutes);
app.route("/api/orders", ordersRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/newsletter", newsletterRoutes);
app.route("/api/contact", contactRoutes);

// Add more API routes here

// Temporary: Debug Printful variant names
app.get("/api/debug/printful/:id", async (c) => {
  try {
    const productId = c.req.param('id');
    const { PrintfulClient } = await import('./lib/printful');
    const printful = new PrintfulClient(
      c.env.PRINTFUL_API_TOKEN,
      c.env.PRINTFUL_STORE_ID
    );

    const product = await printful.getStoreProduct(parseInt(productId));

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Extract just the variant names for analysis
    const variantNames = product.sync_variants
      .filter(v => v.synced && !v.is_ignored)
      .map(v => ({
        variant_id: v.variant_id,
        name: v.name,
        product_name: v.product.name,
        name_parts: v.name.split(' / '),
        parts_count: v.name.split(' / ').length
      }));

    return c.json({
      product_name: product.sync_product.name,
      total_variants: product.sync_variants.length,
      synced_variants: variantNames.length,
      variants: variantNames
    });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

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
