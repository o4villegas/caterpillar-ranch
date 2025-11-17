import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import authRoutes from "./routes/auth";
import catalogRoutes from "./routes/catalog";
import ordersRoutes from "./routes/orders";
import gamesRoutes from "./routes/games";
import cartRoutes from "./routes/cart";
import adminRoutes from "./routes/admin";
import newsletterRoutes from "./routes/newsletter";
import contactRoutes from "./routes/contact";

const app = new Hono();

// API Routes
app.route("/api/auth", authRoutes);
app.route("/api/catalog", catalogRoutes);
app.route("/api/orders", ordersRoutes);
app.route("/api/games", gamesRoutes);
app.route("/api/cart", cartRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/newsletter", newsletterRoutes);
app.route("/api/contact", contactRoutes);

// Add more API routes here

// Test endpoint for scheduled handler (will be removed before production)
app.get("/__test-scheduled", async (c) => {
  const controller: ScheduledController = {
    scheduledTime: Date.now(),
    cron: "0 2 * * *",
    noRetry: () => {},
  };

  try {
    await scheduled(controller, c.env as Cloudflare.Env, c.executionCtx);
    return c.json({ success: true, message: "Scheduled handler executed successfully" });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
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

/**
 * Scheduled Handler for Daily Printful Inventory Sync
 * Triggered by cron: "0 2 * * *" (2 AM UTC daily)
 *
 * Syncs all products from Printful catalog to D1 database
 * Ensures product data, variants, and pricing stay up-to-date
 */
async function scheduled(
  controller: ScheduledController,
  env: Cloudflare.Env,
  ctx: ExecutionContext
): Promise<void> {
  console.log(`[CRON] Daily Printful sync triggered at ${new Date().toISOString()}`);
  console.log(`[CRON] Scheduled time: ${new Date(controller.scheduledTime).toISOString()}`);
  console.log(`[CRON] Cron pattern: ${controller.cron}`);

  try {
    const { syncAllProducts } = await import('./lib/sync-products');
    const result = await syncAllProducts(env, '[CRON]');

    console.log(`[CRON] Sync result: ${result.added} added, ${result.updated} updated, ${result.errors.length} errors`);
  } catch (error) {
    console.error('[CRON] Fatal error during Printful sync:', error);
    throw error;
  }
}

// Export both fetch and scheduled handlers
export default {
  fetch: app.fetch,
  scheduled,
};
