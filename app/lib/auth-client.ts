/**
 * Client-side auth utilities
 *
 * Used in loaders for token verification
 */

import { verify } from 'hono/jwt';

export interface JWTPayload {
  userId: number;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Verify JWT token
 */
export async function verifyToken(
  token: string,
  secret: string
): Promise<JWTPayload | null> {
  try {
    const payload = await verify(token, secret);
    // Validate payload has required fields
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'userId' in payload &&
      'email' in payload
    ) {
      return payload as unknown as JWTPayload;
    }
    return null;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}
