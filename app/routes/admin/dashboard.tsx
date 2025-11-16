/**
 * Admin Dashboard - Phase 2 Implementation
 *
 * Main dashboard view with real-time stats and activity feed
 * - Polls every 30 seconds for updates
 * - Shows orders, revenue, products, games stats
 * - Recent activity feed (last 10 orders, last 10 games)
 * - Mobile-first responsive design
 * - Horror-themed styling
 */

import { formatDistanceToNow } from 'date-fns';
import { usePolling } from '../../lib/hooks/usePolling';
import { StatCard } from '../../lib/components/admin/StatCard';
import { ActivityFeed } from '../../lib/components/admin/ActivityFeed';

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

export default function AdminDashboard() {
  // Fetch dashboard stats (polls every 30 seconds)
  const {
    data: stats,
    lastUpdated: statsUpdated,
    isLoading: statsLoading,
  } = usePolling<DashboardStats>(
    () =>
      fetch('/api/admin/analytics/dashboard-stats', {
        credentials: 'include',
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to fetch stats');
        return r.json();
      }),
    30000 // 30 seconds
  );

  // Fetch recent activity (polls every 30 seconds)
  const {
    data: activity,
    lastUpdated: activityUpdated,
    isLoading: activityLoading,
  } = usePolling<RecentActivity>(
    () =>
      fetch('/api/admin/analytics/recent-activity', {
        credentials: 'include',
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to fetch activity');
        return r.json();
      }),
    30000 // 30 seconds
  );

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
        <div className="mb-6 md:mb-8">
          <h1
            className="text-3xl md:text-4xl text-[#F5F5DC] font-bold mb-2"
            style={{ fontFamily: 'Creepster, cursive' }}
          >
            Dashboard
          </h1>
          {statsUpdated && (
            <p
              className="text-sm text-[#9B8FB5]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Updated {formatDistanceToNow(statsUpdated, { addSuffix: true })}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Orders Today */}
          <StatCard
            title="Orders Today"
            value={formatNumber(stats?.orders.today || 0)}
            subtitle={`${formatNumber(stats?.orders.week || 0)} this week`}
            colorScheme="cyan"
            isLoading={statsLoading}
          />

          {/* Revenue Today */}
          <StatCard
            title="Revenue Today"
            value={formatCurrency(stats?.revenue.today || 0)}
            subtitle={`${formatCurrency(stats?.revenue.week || 0)} this week`}
            colorScheme="lime"
            isLoading={statsLoading}
          />

          {/* Active Products */}
          <StatCard
            title="Active Products"
            value={formatNumber(stats?.products.active || 0)}
            subtitle="Synced from Printful"
            colorScheme="purple"
            isLoading={statsLoading}
          />

          {/* Games Played */}
          <StatCard
            title="Games Today"
            value={formatNumber(stats?.games.today || 0)}
            subtitle={`${formatNumber(stats?.games.total || 0)} total`}
            colorScheme="pink"
            isLoading={statsLoading}
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
            isLoading={activityLoading}
          />
        </div>
      </div>
    </div>
  );
}
