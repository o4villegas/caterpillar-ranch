/**
 * ErrorHeader Component
 *
 * Simplified header for error pages (404, 500, etc.)
 * Does not depend on CartContext to avoid crashes in ErrorBoundary
 */

import { Link } from 'react-router';

export function ErrorHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-ranch-purple bg-ranch-dark/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 md:px-8 py-4">
        {/* Logo/Brand - Click to return home */}
        <Link
          to="/"
          className="group transition-all hover:scale-105 inline-block"
          aria-label="Return to Caterpillar Ranch homepage"
        >
          <span
            className="text-4xl font-bold text-ranch-pink"
            style={{
              fontFamily: 'Creepster, cursive',
              textShadow: '0 0 2px #32CD32, 0 0 3px #32CD32, 0 0 4px #32CD32, -1px -1px 0 #32CD32, 1px -1px 0 #32CD32, -1px 1px 0 #32CD32, 1px 1px 0 #32CD32'
            }}
          >
            Caterpillar Rancch
          </span>
        </Link>
      </div>
    </header>
  );
}
