/**
 * Global Search Component
 *
 * Searches products and orders across the admin portal
 * Debounced, shows dropdown results
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '~/lib/components/ui/input';

interface SearchResult {
  type: 'product' | 'order';
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchResults {
  products: SearchResult[];
  orders: SearchResult[];
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout (300ms debounce)
    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/admin/search?q=${encodeURIComponent(query)}`
        );
        const data = (await response.json()) as SearchResults;
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    setResults(null);

    if (result.type === 'product') {
      navigate(`/admin/products?id=${result.id}`);
    } else {
      navigate(`/admin/orders?id=${result.id}`);
    }
  };

  const totalResults = (results?.products.length || 0) + (results?.orders.length || 0);

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B8FB5] text-lg">
          🔍
        </span>
        <Input
          type="search"
          placeholder="Search products, orders..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 bg-[#2d1f3a] border-[#4A3258] text-[#F5F5DC] placeholder:text-[#9B8FB5]
            focus:border-[#00CED1] focus:ring-[#00CED1]"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
        {isLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B8FB5] text-sm">
            Searching...
          </span>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && results && totalResults > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#2d1f3a] border-2 border-[#4A3258]
          rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {results.products.length > 0 && (
            <section className="p-2">
              <h4
                className="px-3 py-2 text-sm text-[#9B8FB5] uppercase tracking-wide"
                style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
              >
                Products ({results.products.length})
              </h4>
              {results.products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-[#4A3258] transition-colors
                    text-[#F5F5DC]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <div className="font-medium">{product.label}</div>
                  {product.sublabel && (
                    <div className="text-sm text-[#9B8FB5]">{product.sublabel}</div>
                  )}
                </button>
              ))}
            </section>
          )}

          {results.orders.length > 0 && (
            <section className="p-2 border-t-2 border-[#4A3258]">
              <h4
                className="px-3 py-2 text-sm text-[#9B8FB5] uppercase tracking-wide"
                style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
              >
                Orders ({results.orders.length})
              </h4>
              {results.orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleSelect(order)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-[#4A3258] transition-colors
                    text-[#F5F5DC]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <div className="font-medium font-mono">{order.label}</div>
                  {order.sublabel && (
                    <div className="text-sm text-[#9B8FB5]">{order.sublabel}</div>
                  )}
                </button>
              ))}
            </section>
          )}
        </div>
      )}

      {/* No Results */}
      {isOpen && results && totalResults === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#2d1f3a] border-2 border-[#4A3258]
          rounded-lg p-4 text-center text-[#9B8FB5]">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}
