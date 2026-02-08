import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ["phosphorescently-stretchier-sharyl.ngrok-free.dev"],
    proxy: {
      "/api/nominatim": {
        target: "https://nominatim.openstreetmap.org",
        changeOrigin: true,
        secure: true,
        headers: {
          "User-Agent": "dawg",
          Referer: "http://localhost:5173",
        },
        rewrite: (path) => path.replace(/^\/api\/nominatim/, ""),
      },
    },
  },
});
