import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // Ignore zip files to prevent EBUSY crash when dist.zip is locked
      ignored: ['**/*.zip', '**/dist.zip'],
    },
  },
  plugins: [
    react({ jsxRuntime: 'automatic' }),
    tailwindcss(),
  ],
  define: {
    global: 'globalThis'
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-redux'],
    alias: {
      'socket.io-client': 'socket.io-client/dist/socket.io.js'
    }
  },
  optimizeDeps: {
    include: ['socket.io-client', 'engine.io-client'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // chunks
        }
      }
    }
  }
})