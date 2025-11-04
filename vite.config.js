// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'; // <--- 이 줄이 빠져있습니다!

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @components 로 별칭을 줬다면
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
  server: {
    port: 5173
  },
  ssr: {
    noExternal: [
      '@supabase/supabase-js',
      '@supabase/storage-js',
      '@supabase/postgrest-js',
      '@supabase/realtime-js',
      '@supabase/gotrue-js'
    ]
  },
  optimizeDeps: {
    include: [
      'lucide-react',
      'qrcode',
      '@supabase/supabase-js'
    ],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    sourcemap: false,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/]
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'icons': ['lucide-react']
        }
      }
    }
  }
})