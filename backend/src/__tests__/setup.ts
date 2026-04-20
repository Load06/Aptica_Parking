import { vi } from 'vitest';

// Mock push notifications — no real web-push keys needed in tests
vi.mock('../lib/push', () => ({
  sendPushToUser: vi.fn().mockResolvedValue(undefined),
  sendPushToRole: vi.fn().mockResolvedValue(undefined),
}));

// Use test database
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
process.env.JWT_SECRET = 'test-secret-key';
