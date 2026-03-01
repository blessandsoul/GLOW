// Set required env vars BEFORE any module imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db';
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-chars-long';
process.env.OTP_API_KEY = 'test-otp-api-key';
process.env.LAUNCH_MODE = 'true';
process.env.LAUNCH_DAILY_LIMIT = '5';
process.env.APP_URL = 'http://localhost:3001';
