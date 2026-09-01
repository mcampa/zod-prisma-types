import { defineConfig } from 'vitest/config';

// Unit suite. The end-to-end suite lives in e2e/ and is excluded here because
// it needs a build first — run it with `pnpm test:e2e` (see vite.e2e.config.mts).
export default defineConfig({
  test: {
    globals: true,
    threads: false,
    include: ['src/**/*.test.ts'],
  },
});
