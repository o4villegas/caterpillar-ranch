# bcrypt Compatibility Issue with Cloudflare Workers

**Date:** 2025-11-15
**Status:** CRITICAL BLOCKER - Authentication completely broken in production
**Impact:** Cannot test any admin endpoints; all require authentication

---

## Issue Summary

bcrypt password hashing/comparison fails in Cloudflare Workers environment with HTTP 500 errors, preventing all authentication-based endpoints from functioning in production.

## Technical Details

### What Works
- ✅ Homepage loads correctly (2 products from D1)
- ✅ Catalog API returns correct data (`/api/catalog/products`)
- ✅ JWT_SECRET configured as Cloudflare secret
- ✅ Password hash stored correctly in production DB
- ✅ Local bcrypt verification works: `bcrypt.compare('ILoveMyWife!', hash)` → `true`

### What Fails
- ❌ Login endpoint returns HTTP 500
- ❌ All admin endpoints inaccessible (require auth)
- ❌ Size extraction fix untestable (needs auth for `/api/admin/products/sync-all`)

### Error Manifestation

**Request:**
```bash
curl -X POST https://caterpillar-ranch.lando555.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"lando@gvoassurancepartners.com","password":"ILoveMyWife!"}'
```

**Response:**
```
HTTP/2 500
{"error":"Login failed"}
```

**Expected:** HTTP 200 with JWT token

### Root Cause Analysis

#### Evidence of bcrypt Incompatibility

1. **Workers Runtime Constraints:**
   - Cloudflare Workers uses V8 isolates, not Node.js
   - bcryptjs relies on Node.js Buffer and crypto APIs
   - Workers have limited compatibility with Node.js built-ins

2. **Verification:**
   - Same password hash works locally (Node.js environment)
   - Production DB has correct hash: `$2b$10$L8MAT7Tn.nucUnWUg38MCe5IZlnJLxBLN/ESsTgTOPQO1Crd8u76W`
   - JWT_SECRET configured and accessible
   - Middleware has no blocking code (async/await used correctly)

3. **Known Issue:**
   - bcryptjs is not officially supported in Cloudflare Workers
   - Web Crypto API is the recommended alternative for Workers

### Code Location

**Failing Code:** `workers/lib/auth.ts:81-96`

```typescript
export async function login(
  c: Context<{ Bindings: Cloudflare.Env }>,
  email: string,
  password: string
): Promise<LoginResponse> {
  const db: D1Database = c.env.DB;
  const result = await db
    .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .bind(email)
    .first();

  if (!result) {
    return { success: false, error: 'Invalid email or password' };
  }

  const isValidPassword = await bcrypt.compare(password, result.password_hash as string);
  // ^^^ THIS LINE FAILS IN WORKERS (HTTP 500)

  if (!isValidPassword) {
    return { success: false, error: 'Invalid email or password' };
  }
  // ... rest of function
}
```

---

## Production Environment Details

**Deployment:**
- Version: 298310c3-1dbc-43f6-9656-49c08d71c40c
- URL: https://caterpillar-ranch.lando555.workers.dev
- Database: Rancch-DB (D1 production)

**Test Credentials:**
- Email: lando@gvoassurancepartners.com
- Password: ILoveMyWife!
- Hash in DB: `$2b$10$L8MAT7Tn.nucUnWUg38MCe5IZlnJLxBLN/ESsTgTOPQO1Crd8u76W`

**Database Schema:**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT,
  CONSTRAINT email_format CHECK (email LIKE '%@%.%')
)
```

---

## Recommended Solutions

### Option 1: Web Crypto API (Native Workers Support) ⭐ RECOMMENDED

**Advantages:**
- ✅ Native to Workers (no dependencies)
- ✅ Fast (hardware-accelerated)
- ✅ Well-tested in production Workers
- ✅ Standard API (future-proof)

**Implementation:**

```typescript
// workers/lib/password.ts
const PBKDF2_ITERATIONS = 100000;
const HASH_LENGTH = 32;
const SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<string> {
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Hash password with PBKDF2
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

  // Combine salt + hash and encode as base64
  const combined = new Uint8Array(SALT_LENGTH + HASH_LENGTH);
  combined.set(salt);
  combined.set(new Uint8Array(hashBuffer), SALT_LENGTH);

  return btoa(String.fromCharCode(...combined));
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Decode base64 hash
  const combined = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
  const salt = combined.slice(0, SALT_LENGTH);
  const storedHash = combined.slice(SALT_LENGTH);

  // Hash input password with same salt
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

  // Constant-time comparison
  const computedHash = new Uint8Array(hashBuffer);
  return timingSafeEqual(computedHash, storedHash);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}
```

**Migration Steps:**
1. Replace `bcrypt` imports with new `password.ts` module
2. Update `login()` function in `workers/lib/auth.ts`
3. Regenerate password hash for existing user:
   ```sql
   UPDATE users
   SET password_hash = '<new-hash-from-hashPassword()>'
   WHERE email = 'lando@gvoassurancepartners.com'
   ```
4. Test locally, then deploy

---

### Option 2: @noble/hashes (Workers-Compatible Library)

**Advantages:**
- ✅ Drop-in bcrypt replacement
- ✅ Works in Workers
- ✅ Well-maintained (by Paul Miller)

**Disadvantages:**
- ⚠️ Adds external dependency (~5KB)
- ⚠️ Less common than Web Crypto API

**Implementation:**

```bash
npm install @noble/hashes
```

```typescript
import { scrypt } from '@noble/hashes/scrypt';
import { utf8ToBytes, bytesToHex, hexToBytes } from '@noble/hashes/utils';

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = scrypt(utf8ToBytes(password), salt, { N: 2**14, r: 8, p: 1, dkLen: 32 });

  const combined = new Uint8Array(salt.length + hash.length);
  combined.set(salt);
  combined.set(hash, salt.length);

  return bytesToHex(combined);
}

export async function verifyPassword(password: string, hashHex: string): Promise<boolean> {
  const combined = hexToBytes(hashHex);
  const salt = combined.slice(0, 16);
  const storedHash = combined.slice(16);

  const computedHash = scrypt(utf8ToBytes(password), salt, { N: 2**14, r: 8, p: 1, dkLen: 32 });

  return timingSafeEqual(computedHash, storedHash);
}
```

---

## Impact Assessment

### Blocked Features
- ❌ All admin endpoints (`/api/admin/*`)
- ❌ Admin portal functionality
- ❌ Product sync testing (cannot verify size extraction fix)
- ❌ Order management (future feature)

### Working Features
- ✅ Public homepage
- ✅ Product catalog API
- ✅ Product detail pages
- ✅ Cart functionality (client-side)

---

## Action Required

**Immediate Next Steps:**
1. Choose solution (Option 1 recommended)
2. Implement new password hashing
3. Update production user password hash
4. Deploy and test authentication
5. Verify admin endpoints accessible
6. Test size extraction fix on real products

**Estimated Time:** 1-2 hours for Option 1 implementation + testing

---

## References

- [Cloudflare Workers Web Crypto API](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
- [PBKDF2 Specification](https://datatracker.ietf.org/doc/html/rfc2898)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [@noble/hashes](https://github.com/paulmillr/noble-hashes)
