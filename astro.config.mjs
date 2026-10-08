import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://zerunniu.github.io",
  output: "static",
  integrations: [
    react(),
    sitemap({ filter: (page) => !new URL(page).pathname.startsWith("/demo/") }),
  ],
  markdown: {
    shikiConfig: {
      theme: "github-dark-default",
      wrap: true,
    },
  },
});
