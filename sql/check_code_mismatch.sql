-- 신청인 코드와 추천인 코드 불일치 확인

-- 1. 불일치 케이스 확인
-- subscriber_number의 앞부분(LAS1092)과 referrer_code(LAS1090)가 다른 경우
SELECT 
    id,
    subscriber_number,
    referrer_code,
    parent_name,
    phone,
    created_at,
    -- subscriber_number에서 '-' 앞부분 추출
    SPLIT_PART(subscriber_number, '-', 1) as code_prefix,
    -- 일치 여부
    CASE 
        WHEN SPLIT_PART(subscriber_number, '-', 1) = referrer_code THEN '일치'
        ELSE '불일치'
    END as match_status
FROM event_participants
WHERE subscriber_number IS NOT NULL
  AND referrer_code IS NOT NULL
  AND SPLIT_PART(subscriber_number, '-', 1) != referrer_code
ORDER BY created_at DESC
LIMIT 50;

-- 2. 불일치 개수 확인
SELECT 
    CASE 
        WHEN SPLIT_PART(subscriber_number, '-', 1) = referrer_code THEN '일치'
        ELSE '불일치'
    END as match_status,
    COUNT(*) as count
FROM event_participants
WHERE subscriber_number IS NOT NULL
  AND referrer_code IS NOT NULL
GROUP BY match_status
ORDER BY count DESC;

-- 3. 불일치 패턴 분석
SELECT 
    SPLIT_PART(subscriber_number, '-', 1) as subscriber_prefix,
    referrer_code,
    COUNT(*) as count,
    STRING_AGG(DISTINCT parent_name, ', ') as sample_names
FROM event_participants
WHERE subscriber_number IS NOT NULL
  AND referrer_code IS NOT NULL
  AND SPLIT_PART(subscriber_number, '-', 1) != referrer_code
GROUP BY subscriber_prefix, referrer_code
ORDER BY count DESC
LIMIT 20;
