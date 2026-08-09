import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        preview: resolve(__dirname, "chordwiki-preview.html"),
        committedPreview: resolve(__dirname, "committed-preview.html"),
        privacy: resolve(__dirname, "privacy.html")
      }
    }
  }
});
