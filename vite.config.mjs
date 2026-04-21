import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: env.VITE_APP_BASE || "/",
    plugins: [vue()],
    server: {
      host: "0.0.0.0",
      port: 5188,
      strictPort: true,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true
        }
      }
    },
    preview: {
      host: "0.0.0.0",
      port: 4188,
      strictPort: true
    },
    build: {
      outDir: "dist",
      emptyOutDir: true
    }
  };
});
