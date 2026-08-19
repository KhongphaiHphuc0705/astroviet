import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import {
  configDefaults,
  coverageConfigDefaults,
  defineConfig,
} from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    exclude: [...configDefaults.exclude, "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        ...coverageConfigDefaults.exclude,
        "src/test/**",
        "**/*.config.*",
        "e2e/**",
        "**/*.d.ts",
      ],
    },
  },
});
