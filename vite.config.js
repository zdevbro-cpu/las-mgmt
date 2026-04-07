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

              const { imageBase64, mimeType, type } = req.body;
              
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

              let promptText = "영수증 본문에서 amount, issuer, approvalNo, terminalNo, serialNo를 JSON으로 추출해줘.";
              if (type === 'cancel') {
                promptText = `아래는 한국 신용카드 단말기에서 출력된 취소 영수증 이미지입니다.
다음 항목을 찾아 JSON으로만 응답해줘. 설명 없이 JSON만 출력.

- approvalNo: 승인번호 (숫자, "승인번호" 또는 "승인No" 항목의 값)
- amount: 결제(취소)금액 (절대값, 숫자만, 콤마·원·마이너스 제외)
- cardNo: 카드번호 (예: 5425-86-****-5779)
- issuer: 카드사명 (예: NH카드, 신한카드, KB국민카드)
- cardHolder: 카드주명 (카드 소지자 이름, 없으면 빈 문자열)
- serialNo: 일련번호 (숫자)
- terminalNo: 단말기번호 (숫자)
- approvalDate: 원거래일자 또는 거래일자 (YYYY-MM-DD 형식, 없으면 빈 문자열)

없는 항목은 빈 문자열. 예시:
{"approvalNo":"174541873","amount":"2000000","cardNo":"5425-86-****-5779","issuer":"NH카드","cardHolder":"","serialNo":"76250661","terminalNo":"3295581001","approvalDate":"2026-03-03"}`;
              } else if (type === 'sales') {
                promptText = `아래는 한국 신용카드 결제 영수증 이미지입니다. 다음 6가지 핵심 항목을 정확히 찾아서 JSON으로만 응답해줘. 설명이나 주석 없이 오직 JSON만 출력해.

1. amount: 결제금액 (숫자만, 콤마 제외. 예: "1600000")
2. issuer: 카드사명 (영수증에 적힌 카드 브랜드명. 예: "KB국민카드", "신한카드", "현대카드", "삼성카드")
3. approvalNo: 승인번호 (영수증에 적힌 8자리 전후의 숫자. 예: "30014532")
4. terminalNo: 단말기번호 (영수증의 "단말기번호", "TID", 혹은 "CATID" 항목 옆의 숫자)
5. serialNo: 일련번호 (영수증의 "일련번호", "S/N" 항목 옆의 숫자)
6. cardNumber: 카드번호 (**필수 추출 필드**) - "카드번호", "NO.", "번호" 옆에 위치. 1234-****-****-5678 처럼 마스킹된 부분까지 영수증에 보이는 그대로 텍스트 전체를 정확히 추출.

항목을 찾을 수 없는 경우 빈 문자열("")로 응답해.
출력 예시: {"amount":"1600000","issuer":"KB국민카드","approvalNo":"30014532","terminalNo":"3295581001","serialNo":"0558","cardNumber":"5570-42**-****-7047"}`;
              }

              try {
                const genAI = new GoogleGenerativeAI(geminiKey);
                const model = genAI.getGenerativeModel({ model: global._bestModel });
                const result = await model.generateContent([
                  promptText,
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