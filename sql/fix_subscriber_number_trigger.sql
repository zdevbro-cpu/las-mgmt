-- ========================================
-- subscriber_number 자동 생성 트리거 수정
-- ========================================
-- 문제 원인: referrer_code가 이미 'LAS'로 시작하는데, 트리거에서 'LAS'를 강제로 붙여서 'LASLAS...'가 되는 현상 발생
-- 해결 방안: 접두어를 강제로 붙이지 않고, referrer_code를 그대로 사용하도록 수정

-- 1. 함수 정의 (수정됨)
CREATE OR REPLACE FUNCTION public.fn_generate_subscriber_number()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    v_referrer_code text;
    v_next_seq text;
    v_max_num integer;
BEGIN
    -- 1. 추천인 코드 확인
    -- 클라이언트에서 보낸 referrer_code 사용 (예: LAS1011)
    v_referrer_code := NEW.referrer_code;
    
    -- referrer_code가 없으면 번호를 생성하지 않음 (또는 별도 처리)
    IF v_referrer_code IS NULL THEN
        RETURN NEW; 
    END IF;

    -- 2. 다음 순번 계산
    -- 해당 추천인의 기존 신청자 중 가장 큰 번호 추출
    -- 형식: '추천인코드-A001' -> 'A001' 추출 -> 숫자 1 변환
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(SPLIT_PART(subscriber_number, '-', 2) FROM 2) AS INTEGER)), 0)
    INTO v_max_num
    FROM event_participants
    WHERE referrer_code = v_referrer_code
      AND subscriber_number LIKE v_referrer_code || '-A%'; -- 형식이 맞는 데이터만 대상

    -- 번호 1 증가
    v_max_num := v_max_num + 1;

    -- 순번 포맷팅 (A001, A002, ... 형식으로 3자리 패딩)
    v_next_seq := 'A' || LPAD(v_max_num::text, 3, '0');

    -- 3. subscriber_number 설정
    -- 수정사항: 'LAS' 접두어를 제거하고 v_referrer_code를 그대로 사용
    NEW.subscriber_number := v_referrer_code || '-' || v_next_seq;

    RETURN NEW;
END;
$function$;

-- 2. 트리거 재생성
-- 기존 트리거가 있다면 삭제 (트리거 이름 확인 필요, 보통 tr_generate_subscriber_number 사용)
DROP TRIGGER IF EXISTS tr_generate_subscriber_number ON event_participants;

-- 트리거 생성
CREATE TRIGGER tr_generate_subscriber_number
BEFORE INSERT ON event_participants
FOR EACH ROW
EXECUTE FUNCTION public.fn_generate_subscriber_number();

-- 확인용: 트리거가 잘 생성되었는지 확인하는 쿼리
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'event_participants';
