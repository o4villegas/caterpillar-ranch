/**
 * Verification Test: Web Crypto API in Cloudflare Workers
 *
 * Tests that crypto.subtle, PBKDF2, and btoa/atob work in Workers runtime
 * Run with: node test-crypto-api.mjs (simulates Workers environment)
 */

// Test password
const TEST_PASSWORD = 'ILoveMyWife!';
const PBKDF2_ITERATIONS = 100000;
const HASH_LENGTH = 32;
const SALT_LENGTH = 16;

console.log('🔬 Testing Web Crypto API compatibility...\n');

// Test 1: Check crypto.subtle availability
console.log('Test 1: crypto.subtle availability');
if (typeof crypto !== 'undefined' && crypto.subtle) {
  console.log('✅ crypto.subtle is available');
} else {
  console.error('❌ crypto.subtle is NOT available');
  process.exit(1);
}

// Test 2: Hash password using PBKDF2
console.log('\nTest 2: PBKDF2 password hashing');
async function hashPassword(password) {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
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

    const combined = new Uint8Array(SALT_LENGTH + HASH_LENGTH);
    combined.set(salt, 0);
    combined.set(new Uint8Array(hashBuffer), SALT_LENGTH);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('❌ Hash failed:', error.message);
    throw error;
  }
}

// Test 3: Verify password
async function verifyPassword(password, hash) {
  try {
    const combined = Uint8Array.from(atob(hash), (c) => c.charCodeAt(0));
    const salt = combined.slice(0, SALT_LENGTH);
    const storedHash = combined.slice(SALT_LENGTH);

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

    // Timing-safe comparison
    let result = 0;
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash[i] ^ storedHash[i];
    }

    return result === 0;
  } catch (error) {
    console.error('❌ Verify failed:', error.message);
    return false;
  }
}

// Test 4: btoa/atob availability
console.log('\nTest 3: btoa/atob availability');
if (typeof btoa !== 'undefined' && typeof atob !== 'undefined') {
  console.log('✅ btoa/atob are available');
} else {
  console.error('❌ btoa/atob are NOT available');
  process.exit(1);
}

// Run tests
async function runTests() {
  try {
    // Test hashing
    const startHash = Date.now();
    const hash = await hashPassword(TEST_PASSWORD);
    const hashTime = Date.now() - startHash;

    console.log(`✅ Hash generated in ${hashTime}ms`);
    console.log(`   Hash: ${hash.substring(0, 20)}...`);
    console.log(`   Length: ${hash.length} characters`);

    // Test verification (correct password)
    console.log('\nTest 4: Password verification (correct password)');
    const startVerify = Date.now();
    const isValid = await verifyPassword(TEST_PASSWORD, hash);
    const verifyTime = Date.now() - startVerify;

    if (isValid) {
      console.log(`✅ Verification successful in ${verifyTime}ms`);
    } else {
      console.error('❌ Verification failed (should have succeeded)');
      process.exit(1);
    }

    // Test verification (wrong password)
    console.log('\nTest 5: Password verification (wrong password)');
    const isInvalid = await verifyPassword('WrongPassword123!', hash);

    if (!isInvalid) {
      console.log('✅ Correctly rejected wrong password');
    } else {
      console.error('❌ Wrong password was accepted (SECURITY BUG!)');
      process.exit(1);
    }

    // Performance check
    console.log('\n📊 Performance Analysis:');
    console.log(`   Hash time: ${hashTime}ms (target: <200ms)`);
    console.log(`   Verify time: ${verifyTime}ms (target: <200ms)`);

    if (hashTime > 200 || verifyTime > 200) {
      console.warn('⚠️  WARNING: Performance slower than target');
    } else {
      console.log('✅ Performance within acceptable range');
    }

    // Final verdict
    console.log('\n✅ All tests passed! PBKDF2 implementation is compatible.');
    console.log('\n📝 Next steps:');
    console.log('   1. Test in actual Workers environment: wrangler dev');
    console.log('   2. Create a test endpoint that calls hashPassword()');
    console.log('   3. Verify hash format matches Node.js implementation');
    console.log('   4. Proceed with full implementation');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

runTests();
