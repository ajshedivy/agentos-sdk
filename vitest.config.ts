import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "dist/**",
        "tests/**",
        "**/*.config.ts",
        "**/*.d.ts",
        "src/generated/**",
      ],
    },
  },
});
