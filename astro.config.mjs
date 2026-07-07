import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://calcuzakat.netlify.app",
  trailingSlash: "ignore",
  integrations: [tailwind({ applyBaseStyles: false })],
  build: {
    inlineStylesheets: "auto",
    format: "directory",
  },
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: "viewport" },
});
