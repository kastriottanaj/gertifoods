import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Split rarely-changing vendor code into its own long-lived chunks so
        // the app bundle stays small and the browser caches React/router across
        // deploys. Route-level code-splitting (React.lazy in App.jsx) does the
        // rest of the work of shrinking the initial download.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router') || id.includes('/react-dom/')) {
              return 'react'
            }
            return 'vendor'
          }
        },
      },
    },
  },
})
