import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 15_000,
    hookTimeout: 15_000,
    env: {
      DATABASE_URL: 'postgresql://aptica:aptica1234@localhost:5432/aptica_parking_test',
      TEST_DATABASE_URL: 'postgresql://aptica:aptica1234@localhost:5432/aptica_parking_test',
      JWT_SECRET: 'test-secret-key',
    },
  },
});
