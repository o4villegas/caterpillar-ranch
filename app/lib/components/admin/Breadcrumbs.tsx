/**
 * Breadcrumbs Navigation
 *
 * Shows current page hierarchy: Home > Products > CR-101
 */

import { Link } from 'react-router';

interface Breadcrumb {
  label: string;
  path?: string; // If no path, it's the current page
}

interface BreadcrumbsProps {
  items: Breadcrumb[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
      <Link
        to="/admin/dashboard"
        className="text-[#00CED1] hover:underline font-body"
      >
        Home
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-[#9B8FB5]">{'>'}</span>
          {item.path ? (
            <Link
              to={item.path}
              className="text-[#00CED1] hover:underline font-body"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="text-[#F5F5DC] font-semibold font-body"
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
