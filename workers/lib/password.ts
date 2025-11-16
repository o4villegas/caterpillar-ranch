/**
 * Password Hashing Utilities
 *
 * Uses Web Crypto API PBKDF2 (Workers-compatible replacement for bcrypt)
 * Follows OWASP 2025 guidelines for password storage
 */

// OWASP recommended minimum: 100,000 iterations (2025)
// Provides ~100ms hash time (acceptable UX, secure against brute-force)
const PBKDF2_ITERATIONS = 100000;

// SHA-256 produces 32-byte hash
const HASH_LENGTH = 32;

// 16-byte random salt (128 bits)
const SALT_LENGTH = 16;

/**
 * Hash Format (base64-encoded):
 * [16-byte salt][32-byte hash] = 48 bytes total → base64
 *
 * Example: "hM3k9pL2...qR7vN1==" (64 characters)
 */

/**
 * Hash a password using PBKDF2
 *
 * @param password - Plain text password
 * @returns Base64-encoded hash (salt + derived key)
 *
 * Security properties:
 * - Random 16-byte salt (prevents rainbow tables)
 * - 100,000 iterations (OWASP minimum for 2025)
 * - SHA-256 hash function
 * - Constant-time comparison in verifyPassword()
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate cryptographically secure random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Convert password string to bytes
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as CryptoKey for PBKDF2
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false, // Not extractable (security best practice)
    ['deriveBits']
  );

  // Derive 32-byte hash using PBKDF2-SHA256
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    key,
    HASH_LENGTH * 8 // bits
  );

  // Combine salt + hash into single buffer
  const combined = new Uint8Array(SALT_LENGTH + HASH_LENGTH);
  combined.set(salt, 0);
  combined.set(new Uint8Array(hashBuffer), SALT_LENGTH);

  // Encode as base64 for database storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Verify a password against a hash
 *
 * @param password - Plain text password to verify
 * @param hash - Base64-encoded hash from database
 * @returns true if password matches, false otherwise
 *
 * Uses constant-time comparison to prevent timing attacks
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    // Decode base64 hash
    const combined = Uint8Array.from(atob(hash), (c) => c.charCodeAt(0));

    // Extract salt and stored hash
    const salt = combined.slice(0, SALT_LENGTH);
    const storedHash = combined.slice(SALT_LENGTH);

    // Derive hash from input password using same salt
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const key = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      key,
      HASH_LENGTH * 8
    );

    const computedHash = new Uint8Array(hashBuffer);

    // Constant-time comparison (prevents timing attacks)
    return timingSafeEqual(computedHash, storedHash);
  } catch (error) {
    // Invalid hash format or decoding error
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Timing-safe equality comparison
 *
 * Prevents timing attacks by ensuring comparison always takes
 * the same amount of time regardless of where mismatch occurs
 *
 * @param a - First byte array
 * @param b - Second byte array
 * @returns true if arrays are equal
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  // Different lengths = not equal (but still check all bytes)
  if (a.length !== b.length) {
    return false;
  }

  // XOR all bytes, accumulate differences
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  // result === 0 only if all bytes matched
  return result === 0;
}
