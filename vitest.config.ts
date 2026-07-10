import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Match tsconfig's "@/*" path alias so tested modules resolve as in the app.
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  // React-PDF documents (.tsx) under test use JSX; Next handles this in the app,
  // esbuild needs the automatic runtime here.
  esbuild: { jsx: "automatic" },
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    // PGlite spins up an in-process Postgres; give the DB suite room.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
