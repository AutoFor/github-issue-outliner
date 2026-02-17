import { defineConfig } from "vitest/config";  // vitest設定をインポート
import path from "path";  // パスユーティリティ

export default defineConfig({
  test: {
    environment: "jsdom",  // ブラウザ環境をシミュレート
    globals: true,  // describe, it, expect をグローバルに
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),  // @/ エイリアスを解決
    },
  },
});
