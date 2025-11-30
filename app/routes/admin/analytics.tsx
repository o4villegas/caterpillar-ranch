/**
 * Admin Analytics Page
 *
 * Dashboard for business intelligence and insights
 * - Revenue analytics from orders
 * - Game completion statistics
 * - Product performance metrics
 */

import { useLoaderData, useSearchParams } from 'react-router';
import type { Route } from './+types/analytics';
import { Badge } from '~/lib/components/ui/badge';
import { Button } from '~/lib/components/ui/button';

/**
 * Loader - Fetch analytics data from D1
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  const cloudflare = context.cloudflare as { env: Cloudflare.Env };

  // Get auth token from cookie
  const cookieHeader = request.headers.get('Cookie');
  const match = cookieHeader?.match(/admin_token=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const db = cloudflare.env.DB;

  // Get time range from URL params
  const url = new URL(request.url);
  const range = url.searchParams.get('range') || 'all';

  // Build date filter based on range
  let dateFilter = '';
  let gameDateFilter = '';
  if (range === 'today') {
    dateFilter = "AND DATE(created_at) = DATE('now')";
    gameDateFilter = "AND DATE(completed_at) = DATE('now')";
  } else if (range === 'week') {
    dateFilter = "AND created_at >= DATE('now', '-7 days')";
    gameDateFilter = "AND completed_at >= DATE('now', '-7 days')";
  } else if (range === 'month') {
    dateFilter = "AND created_at >= DATE('now', '-30 days')";
    gameDateFilter = "AND completed_at >= DATE('now', '-30 days')";
  }

  // Revenue analytics from orders
  const revenueResult = await db
    .prepare(
      `SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(subtotal), 0) as total_revenue,
        COALESCE(SUM(discount_amount), 0) as total_discounts,
        COALESCE(SUM(total), 0) as net_revenue,
        COALESCE(AVG(total), 0) as avg_order_value
      FROM orders
      WHERE printful_status != 'cancelled' ${dateFilter}`
    )
    .first<{
      total_orders: number;
      total_revenue: number;
      total_discounts: number;
      net_revenue: number;
      avg_order_value: number;
    }>();

  // Orders by status
  const ordersByStatus = await db
    .prepare(
      `SELECT
        printful_status,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE 1=1 ${dateFilter}
      GROUP BY printful_status`
    )
    .all<{ printful_status: string | null; count: number; revenue: number }>();

  // Game completion stats
  const gameStats = await db
    .prepare(
      `SELECT
        game_type,
        COUNT(*) as plays,
        COALESCE(AVG(score), 0) as avg_score,
        COALESCE(SUM(discount_earned), 0) as total_discounts_issued,
        COALESCE(AVG(discount_earned), 0) as avg_discount
      FROM game_completions
      WHERE 1=1 ${gameDateFilter}
      GROUP BY game_type
      ORDER BY plays DESC`
    )
    .all<{
      game_type: string;
      plays: number;
      avg_score: number;
      total_discounts_issued: number;
      avg_discount: number;
    }>();

  // Total game completions
  const totalGames = await db
    .prepare(`SELECT COUNT(*) as count FROM game_completions WHERE 1=1 ${gameDateFilter}`)
    .first<{ count: number }>();

  // Top products by revenue (from order_items)
  const topProducts = await db
    .prepare(
      `SELECT
        oi.product_name,
        COUNT(*) as times_ordered,
        COALESCE(SUM(oi.quantity), 0) as units_sold,
        COALESCE(SUM(oi.subtotal), 0) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE 1=1 ${dateFilter.replace('created_at', 'o.created_at')}
      GROUP BY oi.product_name
      ORDER BY revenue DESC
      LIMIT 10`
    )
    .all<{
      product_name: string;
      times_ordered: number;
      units_sold: number;
      revenue: number;
    }>();

  // Recent activity (last 10 orders)
  const recentOrders = await db
    .prepare(
      `SELECT
        id, customer_name, total, printful_status, created_at
      FROM orders
      WHERE 1=1 ${dateFilter}
      ORDER BY created_at DESC
      LIMIT 10`
    )
    .all<{
      id: string;
      customer_name: string;
      total: number;
      printful_status: string | null;
      created_at: string;
    }>();

  return {
    range,
    revenue: revenueResult || {
      total_orders: 0,
      total_revenue: 0,
      total_discounts: 0,
      net_revenue: 0,
      avg_order_value: 0,
    },
    ordersByStatus: ordersByStatus.results || [],
    gameStats: gameStats.results || [],
    totalGames: totalGames?.count || 0,
    topProducts: topProducts.results || [],
    recentOrders: recentOrders.results || [],
  };
}

export default function AdminAnalyticsPage() {
  const { range, revenue, ordersByStatus, gameStats, totalGames, topProducts, recentOrders } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleRangeChange = (newRange: string) => {
    setSearchParams({ range: newRange });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ranch-cream font-display">Analytics</h1>
          <p className="text-ranch-lavender mt-1">Business insights and performance metrics</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-2">
          <Button
            variant={range === 'today' ? 'default' : 'outline'}
            onClick={() => handleRangeChange('today')}
            className={range === 'today' ? 'bg-ranch-cyan text-ranch-dark' : ''}
          >
            Today
          </Button>
          <Button
            variant={range === 'week' ? 'default' : 'outline'}
            onClick={() => handleRangeChange('week')}
            className={range === 'week' ? 'bg-ranch-cyan text-ranch-dark' : ''}
          >
            This Week
          </Button>
          <Button
            variant={range === 'month' ? 'default' : 'outline'}
            onClick={() => handleRangeChange('month')}
            className={range === 'month' ? 'bg-ranch-cyan text-ranch-dark' : ''}
          >
            This Month
          </Button>
          <Button
            variant={range === 'all' ? 'default' : 'outline'}
            onClick={() => handleRangeChange('all')}
            className={range === 'all' ? 'bg-ranch-cyan text-ranch-dark' : ''}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div>
        <h2 className="text-2xl font-semibold text-ranch-cream mb-4 font-display">Revenue Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6">
            <div className="text-sm text-ranch-lavender mb-1">Total Orders</div>
            <div className="text-3xl font-bold text-ranch-cream">{revenue.total_orders}</div>
          </div>

          <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6">
            <div className="text-sm text-ranch-lavender mb-1">Net Revenue</div>
            <div className="text-3xl font-bold text-ranch-lime">
              ${revenue.net_revenue.toFixed(2)}
            </div>
            <div className="text-xs text-ranch-lavender mt-1">
              Gross: ${revenue.total_revenue.toFixed(2)}
            </div>
          </div>

          <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6">
            <div className="text-sm text-ranch-lavender mb-1">Avg Order Value</div>
            <div className="text-3xl font-bold text-ranch-cyan">
              ${revenue.avg_order_value.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Orders by Status */}
      <div>
        <h2 className="text-2xl font-semibold text-ranch-cream mb-4 font-display">Orders by Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ordersByStatus.map((status) => (
            <div
              key={status.printful_status || 'null'}
              className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge
                  variant={
                    status.printful_status === 'confirmed'
                      ? 'success'
                      : status.printful_status === 'cancelled'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {status.printful_status || 'draft'}
                </Badge>
                <span className="text-2xl font-bold text-ranch-cream">{status.count}</span>
              </div>
              <div className="text-sm text-ranch-lavender">
                ${status.revenue.toFixed(2)} revenue
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Statistics */}
      <div>
        <h2 className="text-2xl font-semibold text-ranch-cream mb-4 font-display">Game Performance</h2>
        <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6">
          <div className="mb-4">
            <span className="text-ranch-lavender">Total Games Played:</span>{' '}
            <span className="text-2xl font-bold text-ranch-cream ml-2">{totalGames}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-ranch-purple">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-ranch-cream">
                    Game Type
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-ranch-cream">
                    Plays
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-ranch-cream">
                    Avg Score
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-ranch-cream">
                    Discounts Issued
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ranch-purple/20">
                {gameStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-ranch-lavender">
                      No games played yet
                    </td>
                  </tr>
                ) : (
                  gameStats.map((game) => (
                    <tr key={game.game_type}>
                      <td className="px-4 py-3 text-ranch-cream capitalize">
                        {game.game_type.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 text-right text-ranch-lavender">{game.plays}</td>
                      <td className="px-4 py-3 text-right text-ranch-cyan">
                        {game.avg_score.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right text-ranch-lime">
                        {game.avg_discount.toFixed(1)}% avg
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div>
        <h2 className="text-2xl font-semibold text-ranch-cream mb-4 font-display">Top Products</h2>
        <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-ranch-purple">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-ranch-cream">
                    Product
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-ranch-cream">
                    Orders
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-ranch-cream">
                    Units Sold
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-ranch-cream">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ranch-purple/20">
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-ranch-lavender">
                      No product sales yet
                    </td>
                  </tr>
                ) : (
                  topProducts.map((product, index) => (
                    <tr key={product.product_name}>
                      <td className="px-4 py-3 text-ranch-cream">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{index + 1}</Badge>
                          <span>{product.product_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-ranch-lavender">
                        {product.times_ordered}
                      </td>
                      <td className="px-4 py-3 text-right text-ranch-cyan">
                        {product.units_sold}
                      </td>
                      <td className="px-4 py-3 text-right text-ranch-lime font-semibold">
                        ${product.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-semibold text-ranch-cream mb-4 font-display">Recent Orders</h2>
        <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6">
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <div className="text-center text-ranch-lavender py-8">No orders yet</div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b border-ranch-purple/20 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="text-ranch-cream font-medium">{order.customer_name}</div>
                    <div className="text-sm text-ranch-lavender font-mono">{order.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-ranch-lime font-semibold">
                      ${order.total.toFixed(2)}
                    </div>
                    <div className="text-xs text-ranch-lavender">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
