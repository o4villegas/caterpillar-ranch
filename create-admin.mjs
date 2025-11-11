/**
 * Create Admin User Script
 *
 * Creates a test admin user in the D1 database
 * Usage: node create-admin.mjs <email> <password> <name>
 */

import bcrypt from 'bcryptjs';
import { execSync } from 'child_process';

const [email, password, name] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: node create-admin.mjs <email> <password> [name]');
  console.error('Example: node create-admin.mjs admin@caterpillar-ranch.com TestAdmin123! "Admin User"');
  process.exit(1);
}

// Hash password
console.log('🔐 Hashing password...');
const passwordHash = await bcrypt.hash(password, 10);
console.log(`✅ Hash generated: ${passwordHash.substring(0, 20)}...`);

// Create SQL command (escape single quotes in name and hash)
const nameValue = name ? `'${name.replace(/'/g, "''")}'` : 'NULL';
// Escape single quotes in password hash
const escapedHash = passwordHash.replace(/'/g, "''");
const sql = `INSERT INTO users (email, password_hash, name) VALUES ('${email}', '${escapedHash}', ${nameValue});`;

// Execute via wrangler
try {
  console.log('💾 Inserting into database...');
  const result = execSync(
    `wrangler d1 execute caterpillar-ranch-db --local --command="${sql}"`,
    { encoding: 'utf-8' }
  );

  console.log('✅ Admin user created successfully!');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log(result);
} catch (error) {
  console.error('❌ Error creating admin user:', error.message);
  console.error('SQL:', sql);
  process.exit(1);
}
