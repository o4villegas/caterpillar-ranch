/**
 * Admin Sidebar Navigation
 *
 * Fixed left sidebar on desktop (250px), drawer on mobile
 * Horror-themed with lime active indicators
 */

import { Link, useLocation } from 'react-router';
import { cn } from '~/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/admin/products', label: 'Products', icon: '📦' },
  { path: '/admin/orders', label: 'Orders', icon: '📋' },
  { path: '/admin/subscribers', label: 'Subscribers', icon: '📧' },
  { path: '/admin/analytics', label: 'Game Analytics', icon: '🎮' },
  { path: '/admin/sync-logs', label: 'Sync Logs', icon: '🔄' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  userEmail?: string;
}

export function Sidebar({ isOpen = true, onClose, userEmail }: SidebarProps) {
  const location = useLocation();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-50',
          'w-64 bg-[#2d1f3a] border-r-2 border-[#4A3258]',
          'flex flex-col',
          'transition-transform duration-300',
          // Mobile: slide in from left
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-6 border-b-2 border-[#4A3258]">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🐛</span>
            <div>
              <h1
                className="text-2xl text-[#FF1493]"
                style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
              >
                RANCCH
              </h1>
              <p className="text-sm text-[#9B8FB5]">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              location.pathname.startsWith(item.path + '/');

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg mb-2',
                  'transition-colors duration-200',
                  'text-[#F5F5DC]',
                  isActive
                    ? 'bg-[#4A3258] border-l-4 border-[#32CD32] text-[#32CD32]'
                    : 'hover:bg-[#4A3258]'
                )}
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: isActive ? 600 : 400 }}
              >
                <span className="text-2xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer (User) */}
        <div className="p-4 border-t-2 border-[#4A3258]">
          <div className="mb-3">
            <p className="text-sm text-[#9B8FB5] mb-1">Logged in as</p>
            <p className="text-sm text-[#F5F5DC] font-mono truncate">
              {userEmail || 'admin@caterpillar-ranch.com'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-[#FF1493] text-[#F5F5DC] rounded-lg
              hover:bg-[#e0127f] transition-colors"
            style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
