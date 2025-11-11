-- Insert test admin user
-- Email: admin@caterpillar-ranch.com
-- Password: TestAdmin123!

DELETE FROM users WHERE email = 'admin@caterpillar-ranch.com';

INSERT INTO users (email, password_hash, name)
VALUES (
  'admin@caterpillar-ranch.com',
  '$2b$10$qAm1S5RGckx1sv7XQY1TaOWxT12tQ5WqqnQTVRct1IYkrEH8m4XR.',
  'Test Admin'
);
