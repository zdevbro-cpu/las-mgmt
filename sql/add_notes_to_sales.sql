-- sales 테이블에 notes 컬럼 추가
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 컬럼 추가 후 'Reload PostgREST config'를 수행하거나 잠시 기다려 주세요.
