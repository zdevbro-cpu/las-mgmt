-- 배미운 추천인 확인 쿼리

-- 1. users 테이블에서 배미운 검색
SELECT 
    id,
    name,
    referral_code,
    branch,
    user_type,
    email
FROM users
WHERE name LIKE '%배미운%';

-- 2. 배미운의 추천 참가자 수 확인
SELECT 
    u.name as 추천인명,
    u.referral_code as 추천인코드,
    u.branch as 지점,
    COUNT(ep.id) as 추천수
FROM users u
LEFT JOIN event_participants ep ON u.referral_code = ep.referrer_code
WHERE u.name LIKE '%배미운%'
GROUP BY u.id, u.name, u.referral_code, u.branch;

-- 3. event_participants에서 referrer_name으로 검색
SELECT 
    referrer_name,
    referrer_code,
    COUNT(*) as count
FROM event_participants
WHERE referrer_name LIKE '%배미운%'
GROUP BY referrer_name, referrer_code;

-- 4. 배미운과 유사한 이름 검색 (오타 가능성)
SELECT 
    name,
    referral_code,
    branch
FROM users
WHERE 
    name LIKE '%배%' 
    OR name LIKE '%미%'
    OR name LIKE '%운%'
ORDER BY name;
