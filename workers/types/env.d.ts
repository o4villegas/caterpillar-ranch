/**
 * Extended environment type declarations
 *
 * These augment the auto-generated worker-configuration.d.ts
 * to include secrets that are added via `wrangler secret put`
 */

declare namespace Cloudflare {
  interface Env {
    // Stripe API keys (secrets)
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    STRIPE_PUBLISHABLE_KEY: string;

    // Resend API key (secret)
    RESEND_API_KEY: string;
  }
}
