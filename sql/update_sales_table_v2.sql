-- sales 테이블에 신규 컬럼 추가
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS planned_delivery BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS buyer_type TEXT; -- '구독', '관리', '시리즈구매' 등 저장

-- 컬럼 추가 후 Supabase 대시보드에서 'Reload PostgREST config'를 수행하거나 잠시 기다려 주세요.
