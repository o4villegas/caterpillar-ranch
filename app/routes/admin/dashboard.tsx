/**
 * Admin Dashboard
 *
 * Main landing page with stats and activity feed
 */

import { useLoaderData } from 'react-router';
import type { Route } from './+types/dashboard';
import { Breadcrumbs } from '~/lib/components/admin/Breadcrumbs';

/**
 * Loader - Fetch dashboard stats
 */
export async function loader({ context }: Route.LoaderArgs) {
  const db = (context.cloudflare as { env: Cloudflare.Env }).env.DB;

  // Fetch basic stats
  const ordersToday = await db
    .prepare(
      `SELECT COUNT(*) as count, SUM(CAST(total as REAL)) as revenue
       FROM orders
       WHERE DATE(created_at) = DATE('now')`
    )
    .first<{ count: number; revenue: number }>();

  const productsActive = await db
    .prepare('SELECT COUNT(*) as count FROM products WHERE status = "active"')
    .first<{ count: number }>();

  const gamesPlayedToday = await db
    .prepare(
      `SELECT COUNT(*) as plays,
       COUNT(CASE WHEN converted_to_purchase = 1 THEN 1 END) as conversions
       FROM game_completions
       WHERE DATE(created_at) = DATE('now')`
    )
    .first<{ plays: number; conversions: number }>();

  // Recent orders
  const recentOrders = await db
    .prepare(
      `SELECT id, customer_email, total, status, created_at
       FROM orders
       ORDER BY created_at DESC
       LIMIT 5`
    )
    .all();

  return {
    stats: {
      orders: {
        today: ordersToday?.count || 0,
        revenue: ordersToday?.revenue || 0,
      },
      products: {
        active: productsActive?.count || 0,
      },
      games: {
        plays: gamesPlayedToday?.plays || 0,
        conversions: gamesPlayedToday?.conversions || 0,
      },
    },
    recentOrders: recentOrders.results,
  };
}

/**
 * Dashboard Component
 */
export default function Dashboard() {
  const { stats, recentOrders } = useLoaderData<typeof loader>();

  const conversionRate =
    stats.games.plays > 0
      ? ((stats.games.conversions / stats.games.plays) * 100).toFixed(1)
      : '0';

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard' }]} />

      <h1
        className="text-4xl text-[#F5F5DC] mb-8"
        style={{ fontFamily: 'Handjet, monospace', fontWeight: 800 }}
      >
        Dashboard
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Orders Today */}
        <div className="bg-[#2d1f3a] border-2 border-[#4A3258] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📋</span>
            <h3
              className="text-lg text-[#9B8FB5]"
              style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
            >
              Orders Today
            </h3>
          </div>
          <p
            className="text-4xl text-[#32CD32]"
            style={{ fontFamily: 'Handjet, monospace', fontWeight: 800 }}
          >
            {stats.orders.today}
          </p>
          <p className="text-sm text-[#9B8FB5] mt-1">
            ${stats.orders.revenue.toFixed(2)} revenue
          </p>
        </div>

        {/* Active Products */}
        <div className="bg-[#2d1f3a] border-2 border-[#4A3258] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📦</span>
            <h3
              className="text-lg text-[#9B8FB5]"
              style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
            >
              Active Products
            </h3>
          </div>
          <p
            className="text-4xl text-[#00CED1]"
            style={{ fontFamily: 'Handjet, monospace', fontWeight: 800 }}
          >
            {stats.products.active}
          </p>
          <p className="text-sm text-[#9B8FB5] mt-1">Synced from Printful</p>
        </div>

        {/* Games Played */}
        <div className="bg-[#2d1f3a] border-2 border-[#4A3258] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🎮</span>
            <h3
              className="text-lg text-[#9B8FB5]"
              style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
            >
              Games Today
            </h3>
          </div>
          <p
            className="text-4xl text-[#FF1493]"
            style={{ fontFamily: 'Handjet, monospace', fontWeight: 800 }}
          >
            {stats.games.plays}
          </p>
          <p className="text-sm text-[#9B8FB5] mt-1">{conversionRate}% conversion</p>
        </div>

        {/* Conversions */}
        <div className="bg-[#2d1f3a] border-2 border-[#4A3258] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">✨</span>
            <h3
              className="text-lg text-[#9B8FB5]"
              style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
            >
              Conversions
            </h3>
          </div>
          <p
            className="text-4xl text-[#32CD32]"
            style={{ fontFamily: 'Handjet, monospace', fontWeight: 800 }}
          >
            {stats.games.conversions}
          </p>
          <p className="text-sm text-[#9B8FB5] mt-1">Games → Purchases</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-[#2d1f3a] border-2 border-[#4A3258] rounded-lg p-6">
        <h2
          className="text-2xl text-[#F5F5DC] mb-4"
          style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
        >
          Recent Orders
        </h2>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-6xl mb-4 block">🐛</span>
            <p className="text-[#9B8FB5]">No orders yet</p>
            <p className="text-sm text-[#9B8FB5] mt-1">
              Orders will appear here after checkout
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#4A3258]">
                  <th
                    className="text-left py-3 px-4 text-[#9B8FB5]"
                    style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
                  >
                    Order ID
                  </th>
                  <th
                    className="text-left py-3 px-4 text-[#9B8FB5]"
                    style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
                  >
                    Customer
                  </th>
                  <th
                    className="text-left py-3 px-4 text-[#9B8FB5]"
                    style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
                  >
                    Total
                  </th>
                  <th
                    className="text-left py-3 px-4 text-[#9B8FB5]"
                    style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
                  >
                    Status
                  </th>
                  <th
                    className="text-left py-3 px-4 text-[#9B8FB5]"
                    style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any, index: number) => (
                  <tr
                    key={order.id}
                    className={index % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#2d1f3a]'}
                  >
                    <td className="py-3 px-4 text-[#F5F5DC] font-mono text-sm">
                      {order.id}
                    </td>
                    <td className="py-3 px-4 text-[#F5F5DC]">{order.customer_email}</td>
                    <td className="py-3 px-4 text-[#32CD32] font-semibold">
                      ${order.total}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'confirmed'
                            ? 'bg-[#32CD32] text-[#1a1a1a]'
                            : order.status === 'pending'
                              ? 'bg-[#FFA500] text-[#1a1a1a]'
                              : 'bg-[#6B7280] text-[#F5F5DC]'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#9B8FB5] text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
