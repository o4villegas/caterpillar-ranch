/**
 * usePolling Hook
 *
 * Custom hook for polling data at regular intervals
 * - Fetches data on mount
 * - Polls at specified interval
 * - Tracks last update timestamp
 * - Cleans up on unmount
 *
 * @example
 * const { data, lastUpdated, isLoading, error } = usePolling(
 *   () => fetch('/api/admin/analytics/dashboard-stats').then(r => r.json()),
 *   30000 // 30 seconds
 * );
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PollingResult<T> {
  data: T | null;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function usePolling<T>(
  fetcher: () => Promise<T>,
  interval: number = 30000 // 30 seconds default
): PollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetcher();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Polling error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  // Initial fetch and setup polling
  useEffect(() => {
    fetchData(); // Initial fetch

    // Set up polling interval
    intervalRef.current = setInterval(fetchData, interval);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, interval]);

  return {
    data,
    lastUpdated,
    isLoading,
    error,
    refetch: fetchData,
  };
}
