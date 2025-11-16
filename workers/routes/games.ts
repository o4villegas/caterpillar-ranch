/**
 * Games API Routes
 *
 * Endpoints for tracking game completions and discount earnings
 * Stores data for analytics and discount abuse detection
 */

import { Hono } from 'hono';

const games = new Hono<{ Bindings: Cloudflare.Env }>();

/**
 * Valid game types
 */
const VALID_GAME_TYPES = [
  'culling',
  'harvest',
  'telegram',
  'snake',
  'garden',
  'metamorphosis',
] as const;

type GameType = (typeof VALID_GAME_TYPES)[number];

/**
 * Maximum discount percentage allowed
 */
const MAX_DISCOUNT_PERCENT = 15;

/**
 * Convert score to discount percentage
 * Based on game design specifications from CLAUDE.md
 */
function scoreToDiscount(score: number): number {
  if (score >= 60) return 15; // Perfect/near-perfect play
  if (score >= 50) return 12; // Excellent play
  if (score >= 40) return 9; // Very good play
  if (score >= 30) return 6; // Good play
  if (score >= 20) return 3; // Decent play
  return 0; // Can retry
}

/**
 * POST /api/games/complete
 * Track game completion and return earned discount
 */
games.post('/complete', async (c) => {
  try {
    const body = await c.req.json<{
      sessionToken: string;
      gameType: string;
      productId: string;
      score: number;
    }>();

    const { sessionToken, gameType, productId, score } = body;

    // Validate required fields
    if (!sessionToken || !gameType || !productId || score === undefined) {
      return c.json(
        {
          error: 'Missing required fields',
          details: 'sessionToken, gameType, productId, and score are required',
        },
        400
      );
    }

    // Validate game type
    if (!VALID_GAME_TYPES.includes(gameType as GameType)) {
      return c.json(
        {
          error: 'Invalid game type',
          details: `gameType must be one of: ${VALID_GAME_TYPES.join(', ')}`,
        },
        400
      );
    }

    // Validate score
    if (typeof score !== 'number' || score < 0) {
      return c.json(
        {
          error: 'Invalid score',
          details: 'score must be a non-negative number',
        },
        400
      );
    }

    // Calculate discount earned
    const discountEarned = scoreToDiscount(score);

    // Persist to D1 database
    const db = c.env.DB;
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO game_completions (
          session_token, game_type, product_id,
          score, discount_earned, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(sessionToken, gameType, productId, score, discountEarned, now)
      .run();

    return c.json({
      data: {
        gameType,
        productId,
        score,
        discountEarned,
        maxDiscountPercent: MAX_DISCOUNT_PERCENT,
        completedAt: now,
      },
      meta: { persisted: true },
    });
  } catch (error) {
    console.error('Error tracking game completion:', error);
    return c.json(
      {
        error: 'Failed to track game completion',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/games/stats/:sessionToken
 * Get game completion stats for a session
 */
games.get('/stats/:sessionToken', async (c) => {
  try {
    const sessionToken = c.req.param('sessionToken');

    if (!sessionToken) {
      return c.json({ error: 'Session token is required' }, 400);
    }

    const db = c.env.DB;

    // Get all completions for this session
    const result = await db
      .prepare(
        `SELECT game_type, product_id, score, discount_earned, completed_at
         FROM game_completions
         WHERE session_token = ?
         ORDER BY completed_at DESC`
      )
      .bind(sessionToken)
      .all<{
        game_type: string;
        product_id: string;
        score: number;
        discount_earned: number;
        completed_at: string;
      }>();

    const completions = result.results || [];

    // Calculate aggregate stats
    const totalGamesPlayed = completions.length;
    const totalDiscountEarned = completions.reduce(
      (sum, c) => sum + c.discount_earned,
      0
    );
    const averageScore =
      totalGamesPlayed > 0
        ? completions.reduce((sum, c) => sum + c.score, 0) / totalGamesPlayed
        : 0;

    // Group by game type
    const byGameType = completions.reduce(
      (acc, c) => {
        if (!acc[c.game_type]) {
          acc[c.game_type] = { count: 0, totalDiscount: 0, avgScore: 0 };
        }
        acc[c.game_type].count++;
        acc[c.game_type].totalDiscount += c.discount_earned;
        return acc;
      },
      {} as Record<string, { count: number; totalDiscount: number; avgScore: number }>
    );

    // Calculate average scores per game type
    for (const gameType in byGameType) {
      const games = completions.filter((c) => c.game_type === gameType);
      byGameType[gameType].avgScore =
        games.reduce((sum, c) => sum + c.score, 0) / games.length;
    }

    return c.json({
      data: {
        sessionToken,
        totalGamesPlayed,
        totalDiscountEarned: Math.min(totalDiscountEarned, MAX_DISCOUNT_PERCENT),
        effectiveDiscountPercent: Math.min(totalDiscountEarned, MAX_DISCOUNT_PERCENT),
        averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal
        completions,
        byGameType,
      },
      meta: { source: 'd1-database' },
    });
  } catch (error) {
    console.error('Error fetching game stats:', error);
    return c.json(
      {
        error: 'Failed to fetch game stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default games;
