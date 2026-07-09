import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    // PGlite spins up an in-process Postgres; give the DB suite room.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
