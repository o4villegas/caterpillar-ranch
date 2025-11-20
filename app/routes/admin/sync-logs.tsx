/**
 * Admin Sync Logs Page
 *
 * View audit trail of product sync operations
 * - List all sync actions (added, updated, hidden, error)
 * - Filter by action type
 * - View hidden products and restore them
 */

import { useState } from 'react';
import { useLoaderData, useRevalidator } from 'react-router';
import type { Route } from './+types/sync-logs';
import { Button } from '~/lib/components/ui/button';
import { Badge } from '~/lib/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

/**
 * Loader - Fetch sync logs and hidden products
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

  // Fetch recent sync logs (last 100)
  const logsResult = await db
    .prepare(`
      SELECT
        id, sync_timestamp, action,
        product_id, printful_product_id, product_name,
        reason, details
      FROM sync_logs
      ORDER BY sync_timestamp DESC
      LIMIT 100
    `)
    .all<SyncLog>();

  // Fetch hidden products
  const hiddenProductsResult = await db
    .prepare(`
      SELECT
        id, name, slug,
        printful_product_id,
        base_price, retail_price,
        image_url,
        updated_at
      FROM products
      WHERE status = 'hidden'
      ORDER BY updated_at DESC
      LIMIT 50
    `)
    .all<HiddenProduct>();

  return {
    logs: logsResult.results || [],
    hiddenProducts: hiddenProductsResult.results || [],
  };
}

interface SyncLog {
  id: number;
  sync_timestamp: string;
  action: 'added' | 'updated' | 'hidden' | 'error';
  product_id: string | null;
  printful_product_id: number | null;
  product_name: string | null;
  reason: string;
  details: string | null;
}

interface HiddenProduct {
  id: string;
  name: string;
  slug: string;
  printful_product_id: number;
  base_price: number;
  retail_price: number | null;
  image_url: string;
  updated_at: string;
}

export default function AdminSyncLogsPage() {
  const { logs, hiddenProducts } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [filterAction, setFilterAction] = useState<string>('all');
  const [restoringProduct, setRestoringProduct] = useState<string | null>(null);

  // Filter logs by action
  const filteredLogs = filterAction === 'all'
    ? logs
    : logs.filter((log: SyncLog) => log.action === filterAction);

  /**
   * Restore hidden product to active status
   */
  const handleRestore = async (productId: string, productName: string) => {
    if (!confirm(`Restore "${productName}" to active status? It will appear on the homepage again.`)) {
      return;
    }

    setRestoringProduct(productId);

    try {
      const res = await fetch(`/api/admin/sync-logs/restore/${productId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getTokenFromCookie()}`,
        },
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to restore product');
      }

      toast.success(`Product "${productName}" restored to active`);
      revalidator.revalidate(); // Auto-refresh
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to restore product');
      console.error(error);
    } finally {
      setRestoringProduct(null);
    }
  };

  /**
   * Get badge variant for action type
   */
  const getActionBadge = (action: string) => {
    const config: Record<string, { variant: any; text: string }> = {
      added: { variant: 'default' as const, text: 'Added' },
      updated: { variant: 'secondary' as const, text: 'Updated' },
      hidden: { variant: 'destructive' as const, text: 'Hidden' },
      error: { variant: 'destructive' as const, text: 'Error' },
    };

    const { variant, text } = config[action] || { variant: 'outline', text: action };

    return (
      <Badge variant={variant} className="font-mono text-xs">
        {text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ranch-cream">Sync Logs</h1>
          <p className="text-ranch-lavender mt-1">
            Audit trail of product sync operations from Printful
          </p>
        </div>
        <Button
          onClick={() => revalidator.revalidate()}
          disabled={revalidator.state === 'loading'}
          className="bg-ranch-cyan hover:bg-ranch-cyan/90 text-ranch-dark font-semibold"
        >
          {revalidator.state === 'loading' ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Hidden Products Section */}
      {hiddenProducts.length > 0 && (
        <div className="border-2 border-ranch-pink/50 rounded-lg p-6 bg-ranch-purple/10">
          <h2 className="text-xl font-bold text-ranch-pink mb-4">
            ⚠️ Hidden Products ({hiddenProducts.length})
          </h2>
          <p className="text-ranch-lavender mb-4 text-sm">
            These products are hidden from the storefront. They may have been deleted from Printful or have zero available variants.
          </p>

          <div className="space-y-3">
            {hiddenProducts.map((product: HiddenProduct) => (
              <div
                key={product.id}
                className="flex items-center gap-4 bg-ranch-dark/50 p-4 rounded-lg border border-ranch-purple"
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded border border-ranch-purple"
                />

                <div className="flex-1">
                  <div className="font-semibold text-ranch-cream">{product.name}</div>
                  <div className="text-sm text-ranch-lavender">
                    Printful ID: {product.printful_product_id} | Hidden {formatDistanceToNow(new Date(product.updated_at), { addSuffix: true })}
                  </div>
                </div>

                <Button
                  onClick={() => handleRestore(product.id, product.name)}
                  disabled={restoringProduct === product.id}
                  size="sm"
                  className="bg-ranch-lime hover:bg-ranch-lime/90 text-ranch-dark"
                >
                  {restoringProduct === product.id ? 'Restoring...' : 'Restore'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'added', 'updated', 'hidden', 'error'].map((action) => (
          <button
            key={action}
            onClick={() => setFilterAction(action)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterAction === action
                ? 'bg-ranch-cyan text-ranch-dark'
                : 'bg-ranch-purple/20 text-ranch-lavender hover:bg-ranch-purple/40'
            }`}
          >
            {action === 'all' ? 'All' : action.charAt(0).toUpperCase() + action.slice(1)}
            {' '}
            ({logs.filter((log: SyncLog) => action === 'all' || log.action === action).length})
          </button>
        ))}
      </div>

      {/* Sync Logs Table */}
      <div className="border-2 border-ranch-purple rounded-lg overflow-hidden bg-ranch-dark/50">
        <div className="overflow-x-auto max-h-[calc(100vh-400px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-ranch-purple/30 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ranch-purple/20">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ranch-lavender">
                    No sync logs found. Wait for next scheduled sync (daily at 2 AM UTC).
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: SyncLog) => (
                  <tr
                    key={log.id}
                    className="hover:bg-ranch-purple/10 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="px-4 py-3 text-ranch-lavender text-sm">
                      {formatDistanceToNow(new Date(log.sync_timestamp), { addSuffix: true })}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3">
                      {getActionBadge(log.action)}
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3">
                      {log.product_name ? (
                        <div>
                          <div className="text-ranch-cream font-medium">
                            {log.product_name}
                          </div>
                          <div className="text-xs text-ranch-lavender">
                            Printful ID: {log.printful_product_id}
                          </div>
                        </div>
                      ) : (
                        <span className="text-ranch-lavender italic">N/A</span>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-3 text-ranch-lavender text-sm">
                      {log.reason}
                    </td>

                    {/* Details */}
                    <td className="px-4 py-3">
                      {log.details ? (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-ranch-cyan hover:underline">
                            View JSON
                          </summary>
                          <pre className="mt-2 p-2 bg-ranch-dark rounded border border-ranch-purple text-ranch-lavender overflow-x-auto">
                            {JSON.stringify(JSON.parse(log.details), null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-ranch-lavender/50 text-xs">None</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="flex items-center justify-between text-sm text-ranch-lavender">
        <div>
          Total Logs: {logs.length}
          {' | '}
          Added: {logs.filter((l: SyncLog) => l.action === 'added').length}
          {' | '}
          Updated: {logs.filter((l: SyncLog) => l.action === 'updated').length}
          {' | '}
          Hidden: {logs.filter((l: SyncLog) => l.action === 'hidden').length}
          {' | '}
          Errors: {logs.filter((l: SyncLog) => l.action === 'error').length}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to get auth token from cookie
 */
function getTokenFromCookie(): string {
  const match = document.cookie.match(/admin_token=([^;]+)/);
  return match ? match[1] : '';
}
