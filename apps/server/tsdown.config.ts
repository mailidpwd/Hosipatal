import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  format: "esm",
  outDir: "./dist",
  clean: true,
  noExternal: [/@hosipatal\/.*/],
  outExtension: () => ({ js: ".js" }), // Output .js for better Vercel compatibility
});
