/**
 * Admin Layout
 *
 * Protected layout for admin portal
 * - Requires authentication (JWT token)
 * - Fixed sidebar navigation (desktop), drawer (mobile)
 * - Global search bar
 * - Breadcrumbs
 */

import { useState } from 'react';
import { Outlet, redirect, useLoaderData } from 'react-router';
import type { Route } from './+types/layout';
import { Sidebar } from '~/lib/components/admin/Sidebar';
import { GlobalSearch } from '~/lib/components/admin/GlobalSearch';
import { Toaster } from 'sonner';

/**
 * Loader - Check authentication
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  // Extract token from cookie or Authorization header
  const cookieHeader = request.headers.get('Cookie');
  let token: string | null = null;

  // Try cookie first
  if (cookieHeader) {
    const match = cookieHeader.match(/admin_token=([^;]+)/);
    if (match) {
      token = match[1];
    }
  }

  // Try Authorization header
  if (!token) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // If no token, redirect to login
  if (!token) {
    throw redirect('/admin/login');
  }

  // Verify token with JWT_SECRET
  const { verifyToken } = await import('../../lib/auth-client');
  const cloudflare = context.cloudflare as { env: Cloudflare.Env };
  const payload = await verifyToken(token, cloudflare.env.JWT_SECRET);

  if (!payload) {
    throw redirect('/admin/login');
  }

  // Fetch user details from D1
  const db = cloudflare.env.DB;
  const user = await db
    .prepare('SELECT id, email, name, created_at FROM users WHERE id = ?')
    .bind(payload.userId)
    .first<{ id: number; email: string; name: string; created_at: string }>();

  if (!user) {
    throw redirect('/admin/login');
  }

  return { user };
}

/**
 * Admin Layout Component
 */
export default function AdminLayout() {
  const { user } = useLoaderData<typeof loader>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userEmail={user.email}
      />

      {/* Main Content Area */}
      <div className="md:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[#2d1f3a] border-b-2 border-[#4A3258] px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-[#F5F5DC] hover:bg-[#4A3258] rounded"
              aria-label="Toggle sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Global Search */}
            <div className="flex-1">
              <GlobalSearch />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#2d1f3a',
            color: '#F5F5DC',
            border: '2px solid #4A3258',
          },
        }}
      />
    </div>
  );
}
