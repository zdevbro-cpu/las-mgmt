// vite.config.js

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const clientId = (env.VITE_NAVER_MAP_CLIENT_ID || '').trim();
  const clientSecret = (env.VITE_NAVER_MAP_CLIENT_SECRET || '').trim();

  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api/naver-geocode': {
        target: 'https://maps.apigw.ntruss.com',
        changeOrigin: true,
        rewrite: (p) => p.replace('/api/naver-geocode', '/map-geocode/v2/geocode'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('X-NCP-APIGW-API-KEY-ID', clientId);
            proxyReq.setHeader('X-NCP-APIGW-API-KEY', clientSecret);
          });
        }
      }
    }
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
  } // end return
}) // end defineConfig