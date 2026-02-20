-- 추천인 '홍현희' 인 신청자 명단 조회

-- 1. 홍현희의 추천인 코드 확인
SELECT 
    id,
    name,
    referral_code,
    branch,
    user_type,
    email
FROM users
WHERE name LIKE '%홍현희%';

-- 2. referrer_name으로 직접 검색 (신청서에 이름이 직접 저장된 경우)
SELECT 
    id,
    parent_name   AS 신청자명,
    phone         AS 연락처,
    referrer_name AS 추천인명,
    referrer_code AS 추천인코드,
    created_at    AS 신청일시
FROM event_participants
WHERE referrer_name LIKE '%홍현희%'
ORDER BY created_at DESC;

-- 3. referrer_code로 검색 (위 1번 쿼리에서 확인한 코드로 교체)
--    예) 홍현희의 referral_code가 'LAS1234' 인 경우
SELECT 
    ep.id,
    ep.parent_name   AS 신청자명,
    ep.phone         AS 연락처,
    ep.referrer_code AS 추천인코드,
    u.name           AS 추천인명,
    ep.created_at    AS 신청일시
FROM event_participants ep
JOIN users u ON ep.referrer_code = u.referral_code
WHERE u.name LIKE '%홍현희%'
ORDER BY ep.created_at DESC;

-- 4. 홍현희 추천 건수 요약
SELECT 
    u.name           AS 추천인명,
    u.referral_code  AS 추천인코드,
    u.branch         AS 지점,
    COUNT(ep.id)     AS 총추천수
FROM users u
LEFT JOIN event_participants ep ON u.referral_code = ep.referrer_code
WHERE u.name LIKE '%홍현희%'
GROUP BY u.id, u.name, u.referral_code, u.branch;
