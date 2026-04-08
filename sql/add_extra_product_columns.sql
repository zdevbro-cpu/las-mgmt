-- sales 테이블에 별도구매상품 정보를 저장하기 위한 컬럼을 추가합니다.
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS extra_product_name TEXT,
ADD COLUMN IF NOT EXISTS extra_product_price INTEGER;

COMMENT ON COLUMN public.sales.extra_product_name IS '별도구매상품명';
COMMENT ON COLUMN public.sales.extra_product_price IS '별도구매상품금액';
