const { resolve } = require("path");
const { defineConfig } = require("vite");

module.exports = defineConfig({
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
