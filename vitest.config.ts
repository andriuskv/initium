import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/tests/setup.ts",
  },
 resolve: {
    alias: {
      "services": path.resolve(__dirname, "./src/services"),
      "contexts": path.resolve(__dirname, "./src/contexts"),
      "components": path.resolve(__dirname, "./src/components"),
      "hooks": path.resolve(__dirname, "./src/hooks"),
      "types": path.resolve(__dirname, "./src/types"),
      "utils": path.resolve(__dirname, "./src/utils"),
      "assets": path.resolve(__dirname, "./src/assets"),
      "lang": path.resolve(__dirname, "./src/lang")
    },
  },
});
