/**
 * Admin Orders Page
 *
 * View and manage customer orders
 * - Order list with filters (status, date range)
 * - Order detail view with items and shipping info
 * - Search by order ID or customer email
 */

import { useState } from 'react';
import { useLoaderData, useFetcher } from 'react-router';
import type { Route } from './+types/orders';
import { Button } from '~/lib/components/ui/button';
import { Badge } from '~/lib/components/ui/badge';
import { Input } from '~/lib/components/ui/input';

/**
 * Loader - Fetch orders from D1
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

  // Parse query params for filters
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'all';
  const search = url.searchParams.get('search') || '';

  // Build SQL query with filters
  const db = cloudflare.env.DB;
  let query = `
    SELECT
      id, customer_email, customer_name,
      shipping_city, shipping_state,
      subtotal, discount_amount, total,
      printful_order_id, printful_status,
      created_at, confirmed_at
    FROM orders
    WHERE 1=1
  `;

  const params: (string | number)[] = [];

  // Filter by status
  if (status !== 'all') {
    query += ` AND printful_status = ?`;
    params.push(status);
  }

  // Search by order ID or email
  if (search) {
    query += ` AND (id LIKE ? OR customer_email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY created_at DESC LIMIT 100`;

  const result = await db.prepare(query).bind(...params).all<Order>();

  return {
    orders: result.results || [],
    filters: { status, search },
  };
}

interface Order {
  id: string;
  customer_email: string;
  customer_name: string;
  shipping_city: string;
  shipping_state: string;
  subtotal: number;
  discount_amount: number;
  total: number;
  printful_order_id: number | null;
  printful_status: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export default function AdminOrdersPage() {
  const { orders, filters } = useLoaderData<typeof loader>();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchInput, setSearchInput] = useState(filters.search);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const search = formData.get('search') as string;
    const status = formData.get('status') as string;

    // Update URL with search params
    const url = new URL(window.location.href);
    url.searchParams.set('search', search);
    url.searchParams.set('status', status);
    window.location.href = url.toString();
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">draft</Badge>;

    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'confirmed':
        return <Badge className="bg-ranch-lime text-ranch-dark">Confirmed</Badge>;
      case 'fulfilled':
        return <Badge variant="success">Fulfilled</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-ranch-cream">Orders</h1>
        <p className="text-ranch-lavender mt-1">View and manage customer orders</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm text-ranch-cream mb-2">Search</label>
          <Input
            name="search"
            type="text"
            placeholder="Order ID or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-ranch-dark border-ranch-purple text-ranch-cream"
          />
        </div>

        <div className="w-48">
          <label className="block text-sm text-ranch-cream mb-2">Status</label>
          <select
            name="status"
            defaultValue={filters.status}
            className="w-full bg-ranch-dark border-2 border-ranch-purple rounded px-3 py-2 text-ranch-cream focus:border-ranch-cyan focus:outline-none"
          >
            <option value="all">All Orders</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <Button
          type="submit"
          className="bg-ranch-cyan hover:bg-ranch-cyan/90 text-ranch-dark font-semibold"
        >
          Apply Filters
        </Button>

        {(filters.search || filters.status !== 'all') && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => (window.location.href = '/admin/orders')}
            className="text-ranch-lavender"
          >
            Clear
          </Button>
        )}
      </form>

      {/* Orders Table */}
      <div className="border-2 border-ranch-purple rounded-lg overflow-hidden bg-ranch-dark/50">
        <div className="overflow-x-auto max-h-[calc(100vh-350px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-ranch-purple/30 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Order ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ranch-purple/20">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ranch-lavender">
                    {filters.search || filters.status !== 'all'
                      ? 'No orders match your filters'
                      : 'No orders yet'}
                  </td>
                </tr>
              ) : (
                orders.map((order: Order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-ranch-purple/10 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Order ID */}
                    <td className="px-4 py-3">
                      <div className="text-ranch-cream font-mono text-sm">{order.id}</div>
                      {order.printful_order_id && (
                        <div className="text-xs text-ranch-lavender">
                          Printful: {order.printful_order_id}
                        </div>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="text-ranch-cream">{order.customer_name}</div>
                      <div className="text-sm text-ranch-lavender">{order.customer_email}</div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 text-ranch-lavender text-sm">
                      {order.shipping_city}, {order.shipping_state}
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3">
                      <div className="text-ranch-lime font-semibold">
                        ${order.total.toFixed(2)}
                      </div>
                      {order.discount_amount > 0 && (
                        <div className="text-xs text-ranch-lavender">
                          -{order.discount_amount.toFixed(2)} (
                          {Math.round((order.discount_amount / order.subtotal) * 100)}% off)
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">{getStatusBadge(order.printful_status)}</td>

                    {/* Date */}
                    <td className="px-4 py-3 text-sm text-ranch-lavender">
                      {new Date(order.created_at).toLocaleDateString()}
                      <div className="text-xs">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-ranch-purple text-ranch-cyan hover:bg-ranch-purple/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                      >
                        View
                      </Button>
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
          Total: {orders.length} orders
          {filters.status !== 'all' && ` (filtered by ${filters.status})`}
        </div>
        <div>
          Total Revenue: $
          {orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
        </div>
      </div>

      {/* Order Detail Modal (Simple for MVP) */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-ranch-dark border-2 border-ranch-purple rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-ranch-cream">
                  Order {selectedOrder.id}
                </h2>
                <p className="text-ranch-lavender mt-1">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedOrder(null)}
                className="text-ranch-lavender"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-ranch-cream mb-2">Customer</h3>
                <p className="text-ranch-lavender">{selectedOrder.customer_name}</p>
                <p className="text-ranch-lavender">{selectedOrder.customer_email}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-ranch-cream mb-2">Shipping</h3>
                <p className="text-ranch-lavender">
                  {selectedOrder.shipping_city}, {selectedOrder.shipping_state}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-ranch-cream mb-2">Order Total</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-ranch-lavender">Subtotal:</span>
                    <span className="text-ranch-cream">${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-ranch-lavender">Discount:</span>
                      <span className="text-ranch-lime">
                        -${selectedOrder.discount_amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-ranch-purple pt-1">
                    <span className="text-ranch-cream">Total:</span>
                    <span className="text-ranch-lime">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-ranch-cream mb-2">Status</h3>
                {getStatusBadge(selectedOrder.printful_status)}
                {selectedOrder.printful_order_id && (
                  <p className="text-sm text-ranch-lavender mt-2">
                    Printful Order ID: {selectedOrder.printful_order_id}
                  </p>
                )}
                {selectedOrder.confirmed_at && (
                  <p className="text-sm text-ranch-lavender mt-1">
                    Confirmed: {new Date(selectedOrder.confirmed_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
