-- 신청인 코드 중복 문제 확인 쿼리

-- 1. LASLAS로 시작하는 중복 코드 확인
SELECT 
    id,
    subscriber_number,
    parent_name,
    phone,
    referrer_code,
    created_at
FROM event_participants
WHERE subscriber_number LIKE 'LASLAS%'
ORDER BY created_at DESC;

-- 2. subscriber_number 패턴 분석
SELECT 
    CASE 
        WHEN subscriber_number LIKE 'LASLAS%' THEN 'LASLAS (중복)'
        WHEN subscriber_number LIKE 'LAS%-%' THEN 'LAS-정상'
        ELSE '기타'
    END AS pattern_type,
    COUNT(*) as count
FROM event_participants
WHERE subscriber_number IS NOT NULL
GROUP BY pattern_type
ORDER BY count DESC;

-- 3. 모든 subscriber_number 샘플 확인 (최근 50개)
SELECT 
    subscriber_number,
    referrer_code,
    parent_name,
    created_at
FROM event_participants
WHERE subscriber_number IS NOT NULL
ORDER BY created_at DESC
LIMIT 50;
