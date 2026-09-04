import path from "node:path";
import { defineConfig } from "vitest/config";

const dir = import.meta.dirname;

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/tests/setup.ts",
  },
  resolve: {
    alias: {
      "@": path.resolve(dir, "src"),
      "services": path.resolve(dir, "src/services"),
      "contexts": path.resolve(dir, "src/contexts"),
      "components": path.resolve(dir, "src/components"),
      "hooks": path.resolve(dir, "src/hooks"),
      "types": path.resolve(dir, "src/types"),
      "utils": path.resolve(dir, "src/utils"),
      "assets": path.resolve(dir, "src/assets"),
      "lang": path.resolve(dir, "src/lang")
    },
  },
});
