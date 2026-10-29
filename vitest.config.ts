import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    environment: 'node',
    // The first stack entry has no tests yet; keep `npm test` green until suites land.
    passWithNoTests: true
  }
});
