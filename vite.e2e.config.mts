import { defineConfig } from 'vitest/config';

// End-to-end suite: runs the built generator through the real prisma CLI over
// fixture schemas, then compiles and executes the generated code.
// Requires `pnpm build` first — see the `test:e2e` script.
export default defineConfig({
  test: {
    globals: true,
    include: ['e2e/**/*.test.ts'],
    // each fixture shells out to `prisma generate`
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
});
