/**
 * Admin Products Page
 *
 * Manage product catalog from Printful
 * - View all products with status and display order
 * - Products auto-sync daily at 2 AM UTC via scheduled handler
 * - Control visibility (draft/active/hidden)
 * - Reorder products for homepage display
 */

import { useState } from 'react';
import { useLoaderData, useRevalidator, useFetcher } from 'react-router';
import type { Route } from './+types/products';
import { Button } from '~/lib/components/ui/button';
import { Badge } from '~/lib/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

/**
 * Loader - Fetch products from admin API
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

  // Fetch products from D1 database
  const db = cloudflare.env.DB;
  const result = await db
    .prepare(`
      SELECT
        id, name, slug, status, display_order,
        image_url, printful_product_id, printful_synced_at,
        base_price, retail_price, created_at
      FROM products
      ORDER BY display_order ASC NULLS LAST, created_at DESC
    `)
    .all<Product>();

  return {
    products: result.results || [],
  };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  status: 'draft' | 'active' | 'hidden';
  display_order: number | null;
  image_url: string;
  printful_product_id: number;
  printful_synced_at: string | null;
  base_price: number;
  retail_price: number | null;
  created_at: string;
}

export default function AdminProductsPage() {
  const { products } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const fetcher = useFetcher();

  /**
   * Change product status (draft/active/hidden)
   */
  const handleStatusChange = async (productId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getTokenFromCookie()}`,
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success(`Product status changed to ${newStatus}`);
      revalidator.revalidate(); // Auto-refresh
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  /**
   * Reorder product (move up or down)
   */
  const handleReorder = async (productId: string, direction: 'up' | 'down') => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getTokenFromCookie()}`,
        },
        body: JSON.stringify({ direction }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to reorder');

      toast.success(`Product moved ${direction}`);
      revalidator.revalidate(); // Auto-refresh
    } catch (error) {
      toast.error('Failed to reorder product');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ranch-cream">Products</h1>
          <p className="text-ranch-lavender mt-1">
            Auto-synced daily at 2 AM UTC via scheduled handler
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

      {/* Products Table */}
      <div className="border-2 border-ranch-purple rounded-lg overflow-hidden bg-ranch-dark/50">
        <div className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-ranch-purple/30 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Image
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Last Synced
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ranch-purple/20">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ranch-lavender">
                    No products found. Products auto-sync daily at 2 AM UTC.
                  </td>
                </tr>
              ) : (
                products.map((product: Product, index: number) => (
                  <tr
                    key={product.id}
                    className="hover:bg-ranch-purple/10 transition-colors"
                  >
                    {/* Image */}
                    <td className="px-4 py-3">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded border border-ranch-purple"
                      />
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="text-ranch-cream font-medium">
                        {product.name}
                      </div>
                      <div className="text-xs text-ranch-lavender">
                        ID: {product.printful_product_id}
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-4 py-3 text-ranch-lavender text-sm">
                      {product.slug}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <select
                        value={product.status}
                        onChange={(e) =>
                          handleStatusChange(product.id, e.target.value)
                        }
                        className="bg-ranch-dark border-2 border-ranch-purple rounded px-2 py-1 text-sm text-ranch-cream focus:border-ranch-cyan focus:outline-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </td>

                    {/* Display Order + Reorder Buttons */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-ranch-lavender text-sm w-8">
                          {product.display_order ?? '-'}
                        </span>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleReorder(product.id, 'up')}
                            disabled={index === 0}
                            className="text-ranch-cyan hover:text-ranch-lime disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Move up"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleReorder(product.id, 'down')}
                            disabled={index === products.length - 1}
                            className="text-ranch-cyan hover:text-ranch-lime disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Move down"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-ranch-lime font-semibold">
                      ${(product.retail_price || product.base_price).toFixed(2)}
                    </td>

                    {/* Last Synced */}
                    <td className="px-4 py-3 text-ranch-lavender text-sm">
                      {product.printful_synced_at
                        ? formatDistanceToNow(new Date(product.printful_synced_at), {
                            addSuffix: true,
                          })
                        : 'Never'}
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
          Total: {products.length} products
          {' | '}
          Active: {products.filter((p: Product) => p.status === 'active').length}
          {' | '}
          Draft: {products.filter((p: Product) => p.status === 'draft').length}
          {' | '}
          Hidden: {products.filter((p: Product) => p.status === 'hidden').length}
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
