/**
 * ActivityFeed Component
 *
 * Displays recent orders and game completions
 * - Mobile-first stacked card layout
 * - Horror-themed styling
 * - Real-time updates via polling
 * - Shows last 10 of each type
 */

import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

interface RecentOrder {
  id: string;
  customer_email: string;
  total: string;
  discount_amount: string;
  printful_status: string | null;
  created_at: string;
}

interface RecentGame {
  game_type: string;
  score: number;
  discount_earned: number;
  product_id: string;
  completed_at: string;
}

interface ActivityFeedProps {
  orders: RecentOrder[];
  games: RecentGame[];
  isLoading?: boolean;
}

const GAME_NAMES: Record<string, string> = {
  culling: '🐛 The Culling',
  harvest: '🌾 Cursed Harvest',
  telegram: '📡 Bug Telegram',
  snake: '🐍 Hungry Caterpillar',
  garden: '🌙 Midnight Garden',
  metamorphosis: '🦋 Metamorphosis',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-[#9B8FB5]/20 text-[#9B8FB5] border-[#9B8FB5]/50',
  pending: 'bg-[#00CED1]/20 text-[#00CED1] border-[#00CED1]/50',
  fulfilled: 'bg-[#32CD32]/20 text-[#32CD32] border-[#32CD32]/50',
  cancelled: 'bg-[#FF1493]/20 text-[#FF1493] border-[#FF1493]/50',
};

export function ActivityFeed({ orders, games, isLoading = false }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-[#2d1f3a]/50 border-2 border-[#4A3258] rounded-lg p-4">
          <Skeleton className="h-6 w-32 mb-4 bg-[#4A3258]/30" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-full bg-[#4A3258]/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* Recent Orders */}
      <div className="bg-[#2d1f3a]/50 border-2 border-[#4A3258] rounded-lg p-4 md:p-6">
        <h3
          className="text-xl text-[#32CD32] mb-4 font-bold"
          style={{ fontFamily: 'Handjet, monospace' }}
        >
          Recent Orders
        </h3>
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-[#9B8FB5] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              No orders yet
            </p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-[#1a1a1a] border border-[#4A3258] rounded-lg p-3 hover:border-[#00CED1] transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className="text-sm text-[#F5F5DC] font-semibold truncate"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    {order.customer_email}
                  </span>
                  <Badge
                    className={`text-xs shrink-0 ${STATUS_COLORS[order.printful_status || 'draft']}`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {order.printful_status || 'draft'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-[#9B8FB5]">
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>
                    ${parseFloat(order.total).toFixed(2)}
                    {parseFloat(order.discount_amount) > 0 && (
                      <span className="text-[#FF1493] ml-1">
                        (-${parseFloat(order.discount_amount).toFixed(2)})
                      </span>
                    )}
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Games */}
      <div className="bg-[#2d1f3a]/50 border-2 border-[#4A3258] rounded-lg p-4 md:p-6">
        <h3
          className="text-xl text-[#00CED1] mb-4 font-bold"
          style={{ fontFamily: 'Handjet, monospace' }}
        >
          Recent Games
        </h3>
        <div className="space-y-3">
          {games.length === 0 ? (
            <p className="text-[#9B8FB5] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              No games played yet
            </p>
          ) : (
            games.map((game, idx) => (
              <div
                key={idx}
                className="bg-[#1a1a1a] border border-[#4A3258] rounded-lg p-3 hover:border-[#32CD32] transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className="text-sm text-[#F5F5DC] font-semibold"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    {GAME_NAMES[game.game_type] || game.game_type}
                  </span>
                  <span
                    className="text-sm text-[#32CD32] font-bold shrink-0"
                    style={{ fontFamily: 'Handjet, monospace' }}
                  >
                    {game.score} pts
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#9B8FB5]">
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>
                    {game.discount_earned > 0 ? (
                      <span className="text-[#FF1493]">{game.discount_earned}% off</span>
                    ) : (
                      'No discount'
                    )}
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>
                    {formatDistanceToNow(new Date(game.completed_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
