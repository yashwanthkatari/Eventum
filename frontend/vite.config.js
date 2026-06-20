import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Fixed the corrupted package name here

// Exporting Vite configurations to control asset builds and hot-reload development servers
export default defineConfig({
  plugins: [react()],
  server: {
    // Port definition ensuring your development interface serves over localhost:5173
    port: 5173,
    watch: {
      // Directs the bundler to listen dynamically for system-level text adjustments
      usePolling: true,
    },
  },
});