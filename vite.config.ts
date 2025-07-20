import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      "@blockchain": path.resolve(import.meta.dirname, "emotional-chain", "SRC", "blockchain"),
      "@network": path.resolve(import.meta.dirname, "emotional-chain", "SRC", "network"),
      "@wallet": path.resolve(import.meta.dirname, "emotional-chain", "SRC", "wallet"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/blockchain": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },
    },
  },
  define: {
    __BLOCKCHAIN_ENABLED__: JSON.stringify(process.env.INTEGRATE_WITH_POE_APP === 'true'),
    __BLOCKCHAIN_ENDPOINT__: JSON.stringify(process.env.POE_APP_API_ENDPOINT || 'http://localhost:8001'),
  },
});