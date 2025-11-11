import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://sales-management-production-a026.up.railway.app/",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
