/**
 * Admin Analytics API Routes
 *
 * Endpoints for admin dashboard stats and analytics
 * - Dashboard stats (orders, revenue, products, games)
 * - Recent activity (orders, game completions)
 * - Game analytics (detailed game metrics)
 */

import { Hono } from 'hono';
import { requireAuth } from '../../lib/auth';
import type { AuthVariables } from '../../lib/auth';

const analytics = new Hono<{ Bindings: Cloudflare.Env; Variables: AuthVariables }>();

/**
 * GET /api/admin/analytics/dashboard-stats
 *
 * Real-time stats for dashboard overview
 * - Orders (today, this week, this month)
 * - Revenue (net after discounts)
 * - Active products count
 * - Games played (today, conversion to purchases)
 */
analytics.get('/dashboard-stats', requireAuth, async (c) => {
  try {
    const db = c.env.DB;

    // Orders today
    const ordersToday = await db
      .prepare(
        `SELECT
           COUNT(*) as count,
           COALESCE(SUM(CAST(total as REAL)), 0) as revenue
         FROM orders
         WHERE DATE(created_at) = DATE('now')`
      )
      .first<{ count: number; revenue: number }>();

    // Orders this week
    const ordersWeek = await db
      .prepare(
        `SELECT
           COUNT(*) as count,
           COALESCE(SUM(CAST(total as REAL)), 0) as revenue
         FROM orders
         WHERE DATE(created_at) >= DATE('now', '-7 days')`
      )
      .first<{ count: number; revenue: number }>();

    // Orders this month
    const ordersMonth = await db
      .prepare(
        `SELECT
           COUNT(*) as count,
           COALESCE(SUM(CAST(total as REAL)), 0) as revenue
         FROM orders
         WHERE DATE(created_at) >= DATE('now', 'start of month')`
      )
      .first<{ count: number; revenue: number }>();

    // Active products
    const productsActive = await db
      .prepare(
        `SELECT COUNT(*) as count
         FROM products
         WHERE status = 'active'`
      )
      .first<{ count: number }>();

    // Games played today
    const gamesToday = await db
      .prepare(
        `SELECT COUNT(*) as plays
         FROM game_completions
         WHERE DATE(completed_at) = DATE('now')`
      )
      .first<{ plays: number }>();

    // Total games all time
    const gamesTotal = await db
      .prepare(`SELECT COUNT(*) as total FROM game_completions`)
      .first<{ total: number }>();

    return c.json({
      orders: {
        today: ordersToday?.count || 0,
        week: ordersWeek?.count || 0,
        month: ordersMonth?.count || 0,
      },
      revenue: {
        today: ordersToday?.revenue || 0,
        week: ordersWeek?.revenue || 0,
        month: ordersMonth?.revenue || 0,
      },
      products: {
        active: productsActive?.count || 0,
      },
      games: {
        today: gamesToday?.plays || 0,
        total: gamesTotal?.total || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return c.json({ error: 'Failed to fetch dashboard stats' }, 500);
  }
});

/**
 * GET /api/admin/analytics/recent-activity
 *
 * Recent orders and game completions for activity feed
 * Returns last 10 of each
 */
analytics.get('/recent-activity', requireAuth, async (c) => {
  try {
    const db = c.env.DB;

    // Last 10 orders
    const recentOrders = await db
      .prepare(
        `SELECT
           id,
           customer_email,
           total,
           discount_amount,
           printful_status,
           created_at
         FROM orders
         ORDER BY created_at DESC
         LIMIT 10`
      )
      .all<{
        id: string;
        customer_email: string;
        total: string;
        discount_amount: string;
        printful_status: string | null;
        created_at: string;
      }>();

    // Last 10 game completions
    const recentGames = await db
      .prepare(
        `SELECT
           game_type,
           score,
           discount_earned,
           product_id,
           completed_at
         FROM game_completions
         ORDER BY completed_at DESC
         LIMIT 10`
      )
      .all<{
        game_type: string;
        score: number;
        discount_earned: number;
        product_id: string;
        completed_at: string;
      }>();

    return c.json({
      orders: recentOrders.results || [],
      games: recentGames.results || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    return c.json({ error: 'Failed to fetch recent activity' }, 500);
  }
});

export default analytics;
