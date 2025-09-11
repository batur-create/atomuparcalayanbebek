import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Performance optimizations
  build: {
    // Code splitting for better loading
    rollupOptions: {
      output: {
        manualChunks: {
          // React vendor chunk
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Firebase chunk
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          // UI libraries chunk
          ui: ['framer-motion', 'lucide-react'],
          // Animation libraries
          animations: ['gsap']
        }
      }
    },
    
    // Build optimizations
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    
    // Asset optimization
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,
    
    // CSS optimization
    cssCodeSplit: true
  },
  
  // Development server optimization
  server: {
    hmr: {
      overlay: false
    },
    host: true,
    port: 3000
  },
  
  // Preview server settings
  preview: {
    port: 4173,
    host: true
  },
  
  // Asset optimization
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
  
  // Environment variables prefix
  envPrefix: 'VITE_',
  
  // Dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/firestore'],
    exclude: ['@firebase/app', '@firebase/firestore']
  }
})