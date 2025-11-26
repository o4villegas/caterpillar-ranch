/**
 * Admin Subscribers Page
 *
 * View and manage newsletter subscribers
 * - Subscriber list with filters (active/inactive)
 * - Export subscribers as CSV
 * - Search by email
 * - Stats overview
 */

import { useState } from 'react';
import { useLoaderData } from 'react-router';
import type { Route } from './+types/subscribers';
import { Button } from '~/lib/components/ui/button';
import { Badge } from '~/lib/components/ui/badge';
import { Input } from '~/lib/components/ui/input';

interface Subscriber {
  id: number;
  email: string;
  subscribed_at: string;
  source: string;
  active: number;
}

interface SubscriberStats {
  total: number;
  active: number;
  inactive: number;
  thisWeek: number;
  thisMonth: number;
}

/**
 * Loader - Fetch subscribers from API
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
  const page = parseInt(url.searchParams.get('page') || '1', 10);

  const db = cloudflare.env.DB;

  // Build WHERE clause
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (status === 'active') {
    conditions.push('active = 1');
  } else if (status === 'inactive') {
    conditions.push('active = 0');
  }

  if (search) {
    conditions.push('LOWER(email) LIKE ?');
    params.push(`%${search.toLowerCase()}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM newsletter_subscribers ${whereClause}`;
  const countResult = await db
    .prepare(countQuery)
    .bind(...params)
    .first<{ count: number }>();

  const total = countResult?.count || 0;
  const limit = 50;
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);

  // Get subscribers
  const subscribersQuery = `
    SELECT id, email, subscribed_at, source, active
    FROM newsletter_subscribers
    ${whereClause}
    ORDER BY subscribed_at DESC
    LIMIT ? OFFSET ?
  `;
  const subscribersResult = await db
    .prepare(subscribersQuery)
    .bind(...params, limit, offset)
    .all<Subscriber>();

  // Get stats
  const stats = await db.batch([
    db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers'),
    db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE active = 1'),
    db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE active = 0'),
    db.prepare(
      `SELECT COUNT(*) as count FROM newsletter_subscribers
       WHERE subscribed_at >= datetime('now', '-7 days')`
    ),
    db.prepare(
      `SELECT COUNT(*) as count FROM newsletter_subscribers
       WHERE subscribed_at >= datetime('now', '-30 days')`
    ),
  ]);

  const subscriberStats: SubscriberStats = {
    total: (stats[0].results?.[0] as any)?.count || 0,
    active: (stats[1].results?.[0] as any)?.count || 0,
    inactive: (stats[2].results?.[0] as any)?.count || 0,
    thisWeek: (stats[3].results?.[0] as any)?.count || 0,
    thisMonth: (stats[4].results?.[0] as any)?.count || 0,
  };

  return {
    subscribers: subscribersResult.results || [],
    stats: subscriberStats,
    pagination: { page, limit, total, totalPages },
    filters: { status, search },
  };
}

export default function AdminSubscribersPage() {
  const { subscribers, stats, pagination, filters } = useLoaderData<typeof loader>();
  const [searchInput, setSearchInput] = useState(filters.search);
  const [isExporting, setIsExporting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const search = formData.get('search') as string;
    const status = formData.get('status') as string;

    const url = new URL(window.location.href);
    url.searchParams.set('search', search);
    url.searchParams.set('status', status);
    url.searchParams.set('page', '1');
    window.location.href = url.toString();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/subscribers/export', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export subscribers');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRemove = async (id: number, email: string) => {
    if (!confirm(`Are you sure you want to permanently remove ${email}? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/subscribers/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to remove');
      }

      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error('Remove error:', error);
      alert('Failed to remove subscriber');
    }
  };

  const handlePageChange = (newPage: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', newPage.toString());
    window.location.href = url.toString();
  };

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: newEmail }),
      });

      const data = await response.json() as { success?: boolean; message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add subscriber');
      }

      alert(data.message || 'Subscriber added');
      setNewEmail('');
      setShowAddForm(false);
      window.location.reload();
    } catch (error) {
      console.error('Add subscriber error:', error);
      alert(error instanceof Error ? error.message : 'Failed to add subscriber');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1
            className="text-3xl font-bold text-ranch-cream font-display"
          >
            Subscribers
          </h1>
          <p className="text-ranch-lavender mt-1">Manage newsletter subscribers</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-ranch-cyan hover:bg-ranch-cyan/90 text-ranch-dark font-semibold"
          >
            {showAddForm ? 'Cancel' : 'Add Subscriber'}
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-ranch-lime hover:bg-ranch-lime/90 text-ranch-dark font-semibold"
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Add Subscriber Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubscriber}
          className="bg-ranch-dark/50 border-2 border-ranch-purple rounded-lg p-4 flex gap-4 items-end"
        >
          <div className="flex-1">
            <label className="block text-sm text-ranch-cream mb-2">Email Address</label>
            <Input
              type="email"
              placeholder="subscriber@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="bg-ranch-dark border-ranch-purple text-ranch-cream"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isAdding}
            className="bg-ranch-lime hover:bg-ranch-lime/90 text-ranch-dark font-semibold"
          >
            {isAdding ? 'Adding...' : 'Add'}
          </Button>
        </form>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-ranch-dark/50 border-2 border-ranch-purple rounded-lg p-4">
          <div className="text-2xl font-bold text-ranch-cyan">{stats.total}</div>
          <div className="text-sm text-ranch-lavender">Total</div>
        </div>
        <div className="bg-ranch-dark/50 border-2 border-ranch-purple rounded-lg p-4">
          <div className="text-2xl font-bold text-ranch-lime">{stats.active}</div>
          <div className="text-sm text-ranch-lavender">Active</div>
        </div>
        <div className="bg-ranch-dark/50 border-2 border-ranch-purple rounded-lg p-4">
          <div className="text-2xl font-bold text-ranch-lavender">{stats.inactive}</div>
          <div className="text-sm text-ranch-lavender">Inactive</div>
        </div>
        <div className="bg-ranch-dark/50 border-2 border-ranch-purple rounded-lg p-4">
          <div className="text-2xl font-bold text-ranch-pink">{stats.thisWeek}</div>
          <div className="text-sm text-ranch-lavender">This Week</div>
        </div>
        <div className="bg-ranch-dark/50 border-2 border-ranch-purple rounded-lg p-4">
          <div className="text-2xl font-bold text-ranch-cream">{stats.thisMonth}</div>
          <div className="text-sm text-ranch-lavender">This Month</div>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm text-ranch-cream mb-2">Search</label>
          <Input
            name="search"
            type="text"
            placeholder="Search by email..."
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
            <option value="all">All Subscribers</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
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
            onClick={() => (window.location.href = '/admin/subscribers')}
            className="text-ranch-lavender"
          >
            Clear
          </Button>
        )}
      </form>

      {/* Subscribers Table */}
      <div className="border-2 border-ranch-purple rounded-lg overflow-hidden bg-ranch-dark/50">
        <div className="overflow-x-auto max-h-[calc(100vh-500px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-ranch-purple/30 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Subscribed
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ranch-cream">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ranch-purple/20">
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ranch-lavender">
                    {filters.search || filters.status !== 'all'
                      ? 'No subscribers match your filters'
                      : 'No subscribers yet'}
                  </td>
                </tr>
              ) : (
                subscribers.map((subscriber: Subscriber) => (
                  <tr
                    key={subscriber.id}
                    className="hover:bg-ranch-purple/10 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-ranch-cream font-mono text-sm">
                        {subscriber.email}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-ranch-lavender text-sm capitalize">
                      {subscriber.source}
                    </td>

                    <td className="px-4 py-3">
                      {subscriber.active ? (
                        <Badge className="bg-ranch-lime text-ranch-dark">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm text-ranch-lavender">
                      {new Date(subscriber.subscribed_at).toLocaleDateString()}
                      <div className="text-xs">
                        {new Date(subscriber.subscribed_at).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-ranch-purple text-ranch-pink hover:bg-ranch-purple/20"
                        onClick={() => handleRemove(subscriber.id, subscriber.email)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-ranch-lavender">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => handlePageChange(pagination.page - 1)}
              className="border-ranch-purple text-ranch-cream"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
              className="border-ranch-purple text-ranch-cream"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
