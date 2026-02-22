import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "bot/main": "src/bot/main.ts",
    "web/server": "src/web/server.ts",
  },
  outDir: "dist",
  format: ["esm"],
  // 型定義ファイルは不要（型チェックは tsc --noEmit で実施）
  dts: false,
  sourcemap: false,
  clean: true,
  platform: "node",
  target: "node24",
  splitting: false,
});
