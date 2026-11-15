import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },

  vite: {
    server: {
      proxy: {
        "/api/sans": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/sans/, ""),
        },

        "/api/oct": {
          target: "http://127.0.0.1:8001",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/oct/, ""),
        },

        "/api/vitals": {
          target: "http://127.0.0.1:8002",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/vitals/, ""),
        },
      },
    },
  },
});