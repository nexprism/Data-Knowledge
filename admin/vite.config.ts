import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  esbuild: {
    drop: ['console', 'debugger'],
  },
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    allowedHosts: ["admin.edrilla.com", "admin.dataknowledge.in"],
    watch: {
      // Ignore zip files to prevent EBUSY crash when dist.zip is locked
      ignored: ['**/*.zip', '**/dist.zip'],
    },
  },
});
