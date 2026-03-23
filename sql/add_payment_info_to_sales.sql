-- sales 테이블에 payment_info 컬럼이 없을 경우 추가하는 쿼리입니다.
-- 기존에 sales 테이블이 이미 존재하여 신규 컬럼이 생성되지 않았을 때 실행해 주세요.

ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS payment_info JSONB;

-- 컬럼 추가 후 Supabase 대시보드에서 'Reload PostgREST config'를 수행하거나 잠시 기다려 주세요.
