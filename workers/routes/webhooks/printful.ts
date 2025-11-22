/**
 * Printful Webhook Handler
 *
 * Processes Printful webhook events for order status updates
 * Updates D1 database and sends shipping notification emails
 */

import { Hono } from 'hono';
import { sendShippingNotificationEmail } from '../../lib/email';

const printfulWebhooks = new Hono<{ Bindings: Cloudflare.Env }>();

/**
 * Printful webhook event types
 * Docs: https://developers.printful.com/docs/#section/Webhooks
 */
interface PrintfulWebhookEvent {
  type: string;
  created: number;
  retries: number;
  store: number;
  data: {
    order: {
      id: number;
      external_id: string;
      status: string;
      shipping: string;
      created: number;
      updated: number;
      recipient: {
        name: string;
        email: string;
        address1: string;
        city: string;
        state_code: string;
        country_code: string;
        zip: string;
      };
      shipments?: Array<{
        id: number;
        carrier: string;
        service: string;
        tracking_number: string;
        tracking_url: string;
        ship_date: string;
        shipped_at: number;
      }>;
    };
  };
}

/**
 * POST /api/webhooks/printful
 * Handle Printful webhook events
 */
printfulWebhooks.post('/', async (c) => {
  try {
    const event = await c.req.json<PrintfulWebhookEvent>();

    console.log(`[Printful Webhook] Event received: ${event.type}`);
    console.log(`[Printful Webhook] Order ID: ${event.data?.order?.id}, External ID: ${event.data?.order?.external_id}`);

    // Handle different event types
    switch (event.type) {
      case 'package_shipped': {
        await handlePackageShipped(c.env, event);
        break;
      }

      case 'order_updated': {
        await handleOrderUpdated(c.env, event);
        break;
      }

      case 'order_canceled': {
        await handleOrderCanceled(c.env, event);
        break;
      }

      case 'order_failed': {
        await handleOrderFailed(c.env, event);
        break;
      }

      case 'product_synced':
      case 'product_updated':
      case 'product_deleted': {
        // Product events - invalidate cache
        console.log(`[Printful Webhook] Product event: ${event.type}`);
        await c.env.CATALOG_CACHE.delete('printful:products:list');
        break;
      }

      default:
        console.log(`[Printful Webhook] Unhandled event type: ${event.type}`);
    }

    return c.json({ received: true });
  } catch (error) {
    console.error('[Printful Webhook] Error processing event:', error);
    return c.json({ received: true, error: 'Processing error' });
  }
});

/**
 * Handle package_shipped event
 * Updates tracking info and sends shipping notification email
 */
async function handlePackageShipped(
  env: Cloudflare.Env,
  event: PrintfulWebhookEvent
): Promise<void> {
  const { order } = event.data;
  const shipment = order.shipments?.[0];

  if (!shipment) {
    console.error('[Printful Webhook] No shipment data in package_shipped event');
    return;
  }

  const db = env.DB;
  const now = new Date().toISOString();

  // Update order with tracking info
  await db
    .prepare(
      `UPDATE orders
       SET printful_status = ?,
           tracking_number = ?,
           tracking_url = ?,
           shipped_at = ?
       WHERE printful_order_id = ?`
    )
    .bind(
      'shipped',
      shipment.tracking_number,
      shipment.tracking_url,
      now,
      order.id
    )
    .run();

  console.log(`[Printful Webhook] Order ${order.external_id} shipped with tracking: ${shipment.tracking_number}`);

  // Get customer email from database (more reliable than webhook data)
  const orderRecord = await db
    .prepare('SELECT customer_email, customer_name FROM orders WHERE printful_order_id = ?')
    .bind(order.id)
    .first<{ customer_email: string; customer_name: string }>();

  if (orderRecord) {
    // Send shipping notification email
    try {
      await sendShippingNotificationEmail(env, {
        orderId: order.external_id,
        customerEmail: orderRecord.customer_email,
        customerName: orderRecord.customer_name,
        trackingNumber: shipment.tracking_number,
        trackingUrl: shipment.tracking_url,
        carrier: shipment.carrier || 'Standard Shipping',
      });
      console.log(`[Printful Webhook] Shipping notification sent for: ${order.external_id}`);
    } catch (emailError) {
      console.error('[Printful Webhook] Failed to send shipping notification:', emailError);
    }
  }
}

/**
 * Handle order_updated event
 * Updates order status in database
 */
async function handleOrderUpdated(
  env: Cloudflare.Env,
  event: PrintfulWebhookEvent
): Promise<void> {
  const { order } = event.data;

  const db = env.DB;

  // Map Printful status to our status
  const statusMap: Record<string, string> = {
    draft: 'draft',
    pending: 'pending',
    failed: 'failed',
    canceled: 'cancelled',
    inprocess: 'processing',
    onhold: 'on_hold',
    partial: 'partial',
    fulfilled: 'fulfilled',
  };

  const mappedStatus = statusMap[order.status] || order.status;

  await db
    .prepare(
      `UPDATE orders
       SET printful_status = ?
       WHERE printful_order_id = ?`
    )
    .bind(mappedStatus, order.id)
    .run();

  console.log(`[Printful Webhook] Order ${order.external_id} status updated to: ${mappedStatus}`);
}

/**
 * Handle order_canceled event
 */
async function handleOrderCanceled(
  env: Cloudflare.Env,
  event: PrintfulWebhookEvent
): Promise<void> {
  const { order } = event.data;

  const db = env.DB;

  await db
    .prepare(
      `UPDATE orders
       SET printful_status = ?
       WHERE printful_order_id = ?`
    )
    .bind('cancelled', order.id)
    .run();

  console.log(`[Printful Webhook] Order ${order.external_id} cancelled`);

  // TODO: Consider sending cancellation email to customer
}

/**
 * Handle order_failed event
 */
async function handleOrderFailed(
  env: Cloudflare.Env,
  event: PrintfulWebhookEvent
): Promise<void> {
  const { order } = event.data;

  const db = env.DB;

  await db
    .prepare(
      `UPDATE orders
       SET printful_status = ?
       WHERE printful_order_id = ?`
    )
    .bind('failed', order.id)
    .run();

  console.error(`[Printful Webhook] Order ${order.external_id} failed`);

  // TODO: Consider sending failure notification to admin
}

export default printfulWebhooks;
