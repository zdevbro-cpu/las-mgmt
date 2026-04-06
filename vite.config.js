// vite.config.js

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai'
import bodyParser from 'body-parser'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const clientId = (env.VITE_NAVER_MAP_CLIENT_ID || '').trim();
  const clientSecret = (env.VITE_NAVER_MAP_CLIENT_SECRET || '').trim();
  const geminiKey = (env.VITE_GEMINI_API_KEY || '').trim();

  return {
  plugins: [
    react(),
    {
      name: 'ocr-receipt-api',
      configureServer(server) {
        server.middlewares.use(bodyParser.json({ limit: '10mb' }));
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/ocr-receipt' && req.method === 'POST') {
            try {
              if (!geminiKey || geminiKey === 'YOUR_API_KEY_HERE') {
                throw new Error('.env 파일에 VITE_GEMINI_API_KEY를 설정해주세요.');
              }

              const { imageBase64, mimeType } = req.body;
              
              // 1. 모델 캐싱 로직: 글로벌 변수를 사용하여 속도 극대화
              if (!global._bestModel) {
                try {
                  const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
                  const listData = await listRes.json();
                  const available = (listData.models || []).map(m => m.name.replace('models/', ''));
                  const priority = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro-vision', 'gemini-1.5-pro'];
                  global._bestModel = priority.find(p => available.includes(p)) || available[0] || 'gemini-1.5-flash';
                  console.log('Selected Best Model (Cached):', global._bestModel);
                } catch (e) {
                  global._bestModel = 'gemini-1.5-flash';
                }
              }

              try {
                const genAI = new GoogleGenerativeAI(geminiKey);
                const model = genAI.getGenerativeModel({ model: global._bestModel });
                const result = await model.generateContent([
                  "영수증 본문에서 amount, issuer, approvalNo, terminalNo, serialNo를 JSON으로 추출해줘.",
                  { inlineData: { data: imageBase64, mimeType: mimeType || "image/jpeg" } }
                ]);

                const aiResponse = await result.response;
                const text = aiResponse.text();
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                
                res.setHeader('Content-Type', 'application/json');
                res.end(jsonMatch ? jsonMatch[0] : JSON.stringify({ error: '파싱 실패', raw: text }));
              } catch (err) {
                global._bestModel = null; // 실패 시 캐시 무효화
                console.error("Gemini Request Error:", err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: `AI 분석 실패: ${err.message}` }));
              }
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          } else {
            next();
          }
        });
      }
    }
  ],
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