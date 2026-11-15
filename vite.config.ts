import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  base: './',
  plugins: [
    react(), 
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
  server: {
    port: Number.parseInt(process.env.VITE_PORT || '', 10) || 3000,
    host: '0.0.0.0',
    strictPort: true,
    hmr: false,
  },
});
