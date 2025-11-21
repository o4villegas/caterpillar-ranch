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

  // Fetch products from D1 database with design images
  const db = cloudflare.env.DB;
  const result = await db
    .prepare(`
      SELECT
        p.id, p.name, p.slug, p.status, p.display_order,
        p.image_url, p.printful_product_id, p.printful_synced_at,
        p.base_price, p.retail_price, p.created_at,
        pd.design_url
      FROM products p
      LEFT JOIN product_designs pd ON p.id = pd.product_id
      ORDER BY p.display_order ASC NULLS LAST, p.created_at DESC
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
  design_url?: string | null; // Admin-uploaded design image
}

export default function AdminProductsPage() {
  const { products } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [uploadingDesign, setUploadingDesign] = useState<string | null>(null);
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

  /**
   * Upload design image for product
   */
  const handleDesignUpload = async (productId: string, file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image (PNG, JPG, WebP)');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large (max 10MB)');
      return;
    }

    setUploadingDesign(productId);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productId);

      const res = await fetch('/api/admin/designs/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getTokenFromCookie()}`,
        },
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json() as { error?: string };
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await res.json();
      toast.success('Design image uploaded successfully!');
      revalidator.revalidate(); // Auto-refresh to show new image
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload design');
      console.error(error);
    } finally {
      setUploadingDesign(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ranch-cream" style={{ fontFamily: 'Tourney, cursive' }}>Products</h1>
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
                  Design Image
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
                  <td colSpan={8} className="px-4 py-8 text-center text-ranch-lavender">
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

                    {/* Design Image Upload */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        {product.design_url ? (
                          <div className="space-y-2">
                            <img
                              src={`/api/admin/designs/serve/${product.design_url}`}
                              alt="Design"
                              className="w-16 h-16 object-cover rounded border-2 border-ranch-lime"
                            />
                            <div className="text-xs text-ranch-lime">✓ Uploaded</div>
                          </div>
                        ) : (
                          <div className="text-xs text-ranch-lavender">No design</div>
                        )}
                        <label
                          htmlFor={`design-upload-${product.id}`}
                          className={`cursor-pointer inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded border-2 transition-colors ${
                            uploadingDesign === product.id
                              ? 'border-ranch-lavender text-ranch-lavender cursor-wait'
                              : 'border-ranch-cyan text-ranch-cyan hover:bg-ranch-cyan hover:text-ranch-dark'
                          }`}
                        >
                          {uploadingDesign === product.id ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-3 w-3"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              Uploading...
                            </>
                          ) : product.design_url ? (
                            'Replace'
                          ) : (
                            'Upload'
                          )}
                        </label>
                        <input
                          id={`design-upload-${product.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingDesign === product.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleDesignUpload(product.id, file);
                            }
                          }}
                        />
                      </div>
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
