/**
 * Game Play Session Tracker
 *
 * Tracks which products had games played in the current browser session.
 * Uses sessionStorage (clears when tab closes) to determine game availability.
 *
 * Purpose: Prevent rapid game replays within a single session while allowing
 * users to replay games on subsequent visits.
 *
 * Storage: sessionStorage (session-scoped, clears on tab close)
 * Key: 'caterpillar-ranch-played-games'
 * Value: JSON array of product IDs/slugs
 */

import { useState } from 'react';

const SESSION_PLAYED_KEY = 'caterpillar-ranch-played-games';

/**
 * Load played products from sessionStorage
 * @returns Set of product IDs that were played in current session
 */
function loadPlayedProducts(): Set<string> {
  if (typeof window === 'undefined') return new Set();

  try {
    const stored = sessionStorage.getItem(SESSION_PLAYED_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch (error) {
    console.error('Failed to load game session from sessionStorage:', error);
    return new Set();
  }
}

/**
 * Save played products to sessionStorage
 * @param playedProducts - Set of product IDs to save
 */
function savePlayedProducts(playedProducts: Set<string>): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(SESSION_PLAYED_KEY, JSON.stringify([...playedProducts]));
  } catch (error) {
    console.error('Failed to save game session to sessionStorage:', error);
  }
}

/**
 * Hook to track game play within current browser session
 *
 * @returns Object with session tracking methods
 *
 * @example
 * const { wasPlayedInSession, markAsPlayed } = useGamePlaySession();
 *
 * // Check if game available
 * const canPlay = !wasPlayedInSession(product.id);
 *
 * // Mark as played when game starts
 * const handlePlayGame = () => {
 *   markAsPlayed(product.id);
 *   openGameModal();
 * };
 */
export function useGamePlaySession() {
  const [playedProducts, setPlayedProducts] = useState<Set<string>>(loadPlayedProducts);

  /**
   * Mark a product as played in current session
   * @param productId - Product ID or slug to mark as played
   */
  const markAsPlayed = (productId: string) => {
    const updated = new Set(playedProducts);
    updated.add(productId);

    savePlayedProducts(updated);
    setPlayedProducts(updated);
  };

  /**
   * Check if a product was played in current session
   * @param productId - Product ID or slug to check
   * @returns true if game was played in current session, false otherwise
   */
  const wasPlayedInSession = (productId: string): boolean => {
    return playedProducts.has(productId);
  };

  return {
    markAsPlayed,
    wasPlayedInSession,
  };
}
