import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        // target: "http://sales-management-production-a026.up.railway.app/",
        // target: "http://localhost:5000/",
        target: "https://sales-management-development.up.railway.app/",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
