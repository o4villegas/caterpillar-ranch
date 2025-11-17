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
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Get auth token from cookie
  const cookieHeader = request.headers.get('Cookie');
  const match = cookieHeader?.match(/admin_token=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    throw new Response('Unauthorized', { status: 401 });
  }

  // Fetch dashboard stats and recent activity in parallel
  const [statsRes, activityRes] = await Promise.all([
    fetch(new URL('/api/admin/analytics/dashboard-stats', request.url), {
      headers: {
        Cookie: cookieHeader || '',
      },
    }),
    fetch(new URL('/api/admin/analytics/recent-activity', request.url), {
      headers: {
        Cookie: cookieHeader || '',
      },
    }),
  ]);

  if (!statsRes.ok || !activityRes.ok) {
    throw new Response('Failed to fetch dashboard data', { status: 500 });
  }

  const stats = await statsRes.json();
  const activity = await activityRes.json();

  return {
    stats,
    activity,
    loadedAt: new Date().toISOString(),
  };
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
            style={{ fontFamily: 'Handjet, monospace' }}
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
