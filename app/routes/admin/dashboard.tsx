/**
 * Admin Dashboard - Phase 2 Implementation
 *
 * Main dashboard view with manual refresh
 * - Shows orders, revenue, products, games stats
 * - Recent activity feed (last 10 orders, last 10 games)
 * - Manual refresh button (no auto-polling)
 * - Mobile-first responsive design
 * - Horror-themed styling
 */

import { formatDistanceToNow } from 'date-fns';
import { useLoaderData, useRevalidator } from 'react-router';
import type { Route } from './+types/dashboard';
import { StatCard } from '../../lib/components/admin/StatCard';
import { ActivityFeed } from '../../lib/components/admin/ActivityFeed';
import { Button } from '../../lib/components/ui/button';

interface DashboardStats {
  orders: {
    today: number;
    week: number;
    month: number;
  };
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  products: {
    active: number;
  };
  games: {
    today: number;
    total: number;
  };
  timestamp: string;
}

interface RecentActivity {
  orders: Array<{
    id: string;
    customer_email: string;
    total: string;
    discount_amount: string;
    printful_status: string | null;
    created_at: string;
  }>;
  games: Array<{
    game_type: string;
    score: number;
    discount_earned: number;
    product_id: string;
    completed_at: string;
  }>;
  timestamp: string;
}

/**
 * Loader - Fetch dashboard data on page load and manual refresh
 * Queries D1 database directly (no HTTP self-fetch)
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  // Get auth token from cookie
  const cookieHeader = request.headers.get('Cookie');
  const match = cookieHeader?.match(/admin_token=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const cloudflare = context.cloudflare as { env: Cloudflare.Env };
  const db = cloudflare.env.DB;

  try {
    // Fetch dashboard stats - Orders today
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

    // Recent orders
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

    // Recent games
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

    const stats: DashboardStats = {
      orders: {
        today: ordersToday?.count || 0,
        week: ordersWeek?.count || 0,
        month: 0, // Not needed for current display
      },
      revenue: {
        today: ordersToday?.revenue || 0,
        week: ordersWeek?.revenue || 0,
        month: 0, // Not needed for current display
      },
      products: {
        active: productsActive?.count || 0,
      },
      games: {
        today: gamesToday?.plays || 0,
        total: gamesTotal?.total || 0,
      },
      timestamp: new Date().toISOString(),
    };

    const activity: RecentActivity = {
      orders: recentOrders.results || [],
      games: recentGames.results || [],
      timestamp: new Date().toISOString(),
    };

    return {
      stats,
      activity,
      loadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Dashboard loader error:', error);
    throw new Response('Failed to load dashboard data', { status: 500 });
  }
}

export default function AdminDashboard() {
  const { stats, activity, loadedAt } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const isRefreshing = revalidator.state === 'loading';

  // Format numbers
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] px-4 md:px-8 py-6 md:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex items-center justify-between">
          <div>
            <h1
              className="text-3xl md:text-4xl text-[#F5F5DC] font-bold mb-2"
              style={{ fontFamily: 'Creepster, cursive' }}
            >
              Dashboard
            </h1>
            {loadedAt && (
              <p
                className="text-sm text-[#9B8FB5]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Updated {formatDistanceToNow(new Date(loadedAt), { addSuffix: true })}
              </p>
            )}
          </div>
          <Button
            onClick={() => revalidator.revalidate()}
            disabled={isRefreshing}
            className="bg-ranch-cyan hover:bg-ranch-cyan/90 text-ranch-dark font-semibold"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Orders Today */}
          <StatCard
            title="Orders Today"
            value={formatNumber(stats?.orders.today || 0)}
            subtitle={`${formatNumber(stats?.orders.week || 0)} this week`}
            colorScheme="cyan"
            isLoading={isRefreshing}
          />

          {/* Revenue Today */}
          <StatCard
            title="Revenue Today"
            value={formatCurrency(stats?.revenue.today || 0)}
            subtitle={`${formatCurrency(stats?.revenue.week || 0)} this week`}
            colorScheme="lime"
            isLoading={isRefreshing}
          />

          {/* Active Products */}
          <StatCard
            title="Active Products"
            value={formatNumber(stats?.products.active || 0)}
            subtitle="Auto-synced daily at 2 AM UTC"
            colorScheme="purple"
            isLoading={isRefreshing}
          />

          {/* Games Played */}
          <StatCard
            title="Games Today"
            value={formatNumber(stats?.games.today || 0)}
            subtitle={`${formatNumber(stats?.games.total || 0)} total`}
            colorScheme="pink"
            isLoading={isRefreshing}
          />
        </div>

        {/* Activity Feed */}
        <div className="mb-6 md:mb-8">
          <h2
            className="text-2xl text-[#F5F5DC] font-bold mb-4"
            style={{ fontFamily: 'Tourney, cursive' }}
          >
            Recent Activity
          </h2>
          <ActivityFeed
            orders={activity?.orders || []}
            games={activity?.games || []}
            isLoading={isRefreshing}
          />
        </div>
      </div>
    </div>
  );
}
