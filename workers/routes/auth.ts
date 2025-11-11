/**
 * Authentication API Routes
 *
 * Endpoints for admin login/logout
 * POST /api/auth/login - Admin login with email/password
 * POST /api/auth/logout - Clear authentication token
 * GET  /api/auth/me - Get current authenticated user info
 */

import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import {
  generateToken,
  comparePassword,
  getUserByEmail,
  updateLastLogin,
  isValidEmail,
  type User,
} from '../lib/auth';

// Extend Hono context with custom variables
type Variables = {
  userId: number;
  userEmail: string;
};

const auth = new Hono<{ Bindings: Cloudflare.Env; Variables: Variables }>();

/**
 * POST /api/auth/login
 *
 * Admin login endpoint
 *
 * Request body:
 *   { email: string, password: string }
 *
 * Response:
 *   Success: { token: string, user: User }
 *   Error: { error: string }
 */
auth.post('/login', async (c) => {
  try {
    // Parse request body
    const body = await c.req.json<{ email: string; password: string }>();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    if (!isValidEmail(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    // Fetch user from database
    const db = c.env.DB;
    const userWithPassword = await getUserByEmail(db, email.toLowerCase());

    if (!userWithPassword) {
      // Don't reveal whether email exists
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password
    const isValidPassword = await comparePassword(password, userWithPassword.password_hash);

    if (!isValidPassword) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Update last login timestamp
    await updateLastLogin(db, userWithPassword.id);

    // Generate JWT token
    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return c.json({ error: 'Authentication not configured' }, 500);
    }

    const token = await generateToken(userWithPassword.id, userWithPassword.email, jwtSecret);

    // Remove password_hash from response
    const user: User = {
      id: userWithPassword.id,
      email: userWithPassword.email,
      name: userWithPassword.name,
      created_at: userWithPassword.created_at,
      last_login_at: new Date().toISOString(), // Use current time since we just updated it
    };

    // Set cookie for browser-based requests
    setCookie(c, 'admin_token', token, {
      httpOnly: true,
      secure: true, // HTTPS only in production
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return c.json({
      token,
      user,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

/**
 * POST /api/auth/logout
 *
 * Logout endpoint - clears authentication cookie
 *
 * Response:
 *   { message: string }
 */
auth.post('/logout', async (c) => {
  try {
    // Clear authentication cookie
    deleteCookie(c, 'admin_token', {
      path: '/',
    });

    return c.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
});

/**
 * GET /api/auth/me
 *
 * Get current authenticated user
 *
 * Requires: Authorization header with Bearer token OR admin_token cookie
 *
 * Response:
 *   Success: { user: User }
 *   Error: { error: string }
 */
auth.get('/me', async (c) => {
  try {
    // Import requireAuth middleware
    const { requireAuth, getUserById } = await import('../lib/auth');

    // Apply authentication middleware
    await requireAuth(c, async () => {});

    // Get user info from context (set by requireAuth)
    const userId = c.get('userId') as number | undefined;

    if (!userId) {
      return c.json({ error: 'User ID not found' }, 401);
    }

    // Fetch full user details from database
    const db = c.env.DB;
    const user = await getUserById(db, userId);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    console.error('Get user error:', error);

    // Check if error is from authentication middleware
    if (error instanceof Response) {
      return error;
    }

    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

export default auth;
