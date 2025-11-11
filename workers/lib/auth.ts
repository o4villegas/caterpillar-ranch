/**
 * Authentication & Authorization Utilities
 *
 * JWT-based admin authentication for Caterpillar Ranch
 * - Token generation and verification
 * - Password hashing with bcryptjs
 * - Middleware for protecting admin routes
 */

import type { Context, Next } from 'hono';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';

// JWT Configuration
const JWT_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds
const SALT_ROUNDS = 10;

/**
 * JWT Payload Structure
 * Extends Hono's base JWTPayload with our custom fields
 */
export interface CustomJWTPayload {
  userId: number;
  email: string;
  iat: number;
  exp: number;
  [key: string]: unknown; // Allow additional properties for Hono compatibility
}

/**
 * User data from database (password excluded)
 */
export interface User {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
  last_login_at: string | null;
}

/**
 * Generate JWT token for authenticated user
 */
export async function generateToken(
  userId: number,
  email: string,
  secret: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const payload: CustomJWTPayload = {
    userId,
    email,
    iat: now,
    exp: now + JWT_EXPIRY,
  };

  return await sign(payload, secret);
}

/**
 * Verify JWT token and return payload
 */
export async function verifyToken(
  token: string,
  secret: string
): Promise<CustomJWTPayload | null> {
  try {
    const payload = await verify(token, secret);
    return payload as CustomJWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Hash password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare password with hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Extract JWT token from Authorization header or cookie
 */
function extractToken(c: Context): string | null {
  // Try Authorization header first (Bearer token)
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Fallback to cookie (for browser requests)
  const cookieHeader = c.req.header('Cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/admin_token=([^;]+)/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Context variables set by auth middleware
 */
export type AuthVariables = {
  userId: number;
  userEmail: string;
};

/**
 * Authentication Middleware
 *
 * Protects routes requiring admin authentication.
 * Verifies JWT token and attaches user data to context.
 *
 * Usage:
 *   app.get('/api/admin/products', requireAuth, async (c) => { ... })
 */
export async function requireAuth(
  c: Context<{ Bindings: Cloudflare.Env; Variables: AuthVariables }>,
  next: Next
) {
  // Extract JWT secret from environment
  const secret = c.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not configured in environment');
    return c.json({ error: 'Authentication not configured' }, 500);
  }

  // Extract token
  const token = extractToken(c);
  if (!token) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  // Verify token
  const payload = await verifyToken(token, secret);
  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  // Check token expiry (additional safety check)
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    return c.json({ error: 'Token expired' }, 401);
  }

  // Attach user info to context for downstream handlers
  c.set('userId', payload.userId);
  c.set('userEmail', payload.email);

  await next();
}

/**
 * Fetch user from database by ID
 */
export async function getUserById(
  db: D1Database,
  userId: number
): Promise<User | null> {
  try {
    const result = await db
      .prepare('SELECT id, email, name, created_at, last_login_at FROM users WHERE id = ?')
      .bind(userId)
      .first<User>();

    return result || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Fetch user from database by email
 */
export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<(User & { password_hash: string }) | null> {
  try {
    const result = await db
      .prepare('SELECT id, email, name, password_hash, created_at, last_login_at FROM users WHERE email = ?')
      .bind(email)
      .first<User & { password_hash: string }>();

    return result || null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(
  db: D1Database,
  userId: number
): Promise<boolean> {
  try {
    await db
      .prepare('UPDATE users SET last_login_at = datetime("now") WHERE id = ?')
      .bind(userId)
      .run();

    return true;
  } catch (error) {
    console.error('Error updating last login:', error);
    return false;
  }
}

/**
 * Create new admin user (manual provisioning only)
 */
export async function createUser(
  db: D1Database,
  email: string,
  password: string,
  name: string | null = null
): Promise<User | null> {
  try {
    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert user
    const result = await db
      .prepare(
        'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?) RETURNING id, email, name, created_at, last_login_at'
      )
      .bind(email, passwordHash, name)
      .first<User>();

    return result || null;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: 8+ characters, at least 1 uppercase, 1 lowercase, 1 number
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasUppercase && hasLowercase && hasNumber;
}
