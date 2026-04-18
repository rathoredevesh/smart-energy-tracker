import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@react-three") || id.includes("three")) {
              return "three-stack";
            }
            if (id.includes("chart.js") || id.includes("react-chartjs-2") || id.includes("gsap")) {
              return "motion-analytics";
            }
            if (id.includes("react") || id.includes("scheduler")) {
              return "react-vendor";
            }
          }
        },
      },
    },
  },
});
