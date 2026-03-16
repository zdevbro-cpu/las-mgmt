-- 추천인 탑12 문제 진단 쿼리

-- 1. event_participants 테이블의 전체 데이터 개수
SELECT 'Total Participants' as metric, COUNT(*) as count
FROM event_participants;

-- 2. referrer_code가 있는 참가자 수
SELECT 'Participants with Referrer Code' as metric, COUNT(*) as count
FROM event_participants
WHERE referrer_code IS NOT NULL;

-- 3. referrer_code별 카운트 (Top 12)
SELECT 
    referrer_code,
    referrer_name,
    COUNT(*) as count
FROM event_participants
WHERE referrer_code IS NOT NULL
GROUP BY referrer_code, referrer_name
ORDER BY count DESC
LIMIT 12;

-- 4. referrer_code와 users 테이블 조인 확인 (Top 12)
SELECT 
    ep.referrer_code,
    ep.referrer_name as ep_name,
    u.name as user_name,
    u.branch,
    COUNT(*) as count
FROM event_participants ep
LEFT JOIN users u ON ep.referrer_code = u.referral_code
WHERE ep.referrer_code IS NOT NULL
GROUP BY ep.referrer_code, ep.referrer_name, u.name, u.branch
ORDER BY count DESC
LIMIT 12;

-- 5. users 테이블에서 referral_code가 있는 사용자 수
SELECT 'Users with Referral Code' as metric, COUNT(*) as count
FROM users
WHERE referral_code IS NOT NULL;

-- 6. event_participants에 있으나 users에 없는 referrer_code 확인
SELECT DISTINCT
    ep.referrer_code,
    ep.referrer_name,
    COUNT(*) as participant_count
FROM event_participants ep
LEFT JOIN users u ON ep.referrer_code = u.referral_code
WHERE ep.referrer_code IS NOT NULL
  AND u.referral_code IS NULL
GROUP BY ep.referrer_code, ep.referrer_name
ORDER BY participant_count DESC;

-- 7. 최근 생성된 participants 확인 (최근 10명)
SELECT 
    id,
    parent_name,
    phone,
    referrer_code,
    referrer_name,
    created_at
FROM event_participants
ORDER BY created_at DESC
LIMIT 10;

-- 8. 이벤트명별 참가자 수
SELECT 
    event_name,
    COUNT(*) as count
FROM event_participants
GROUP BY event_name
ORDER BY count DESC;

-- 9. referrer_code가 NULL인 참가자 수
SELECT 'Participants without Referrer Code' as metric, COUNT(*) as count
FROM event_participants
WHERE referrer_code IS NULL;

-- 10. 특정 직원의 추천 카운트 확인 (users 테이블 기준으로 모든 직원)
SELECT 
    u.name,
    u.referral_code,
    u.branch,
    COUNT(ep.id) as referral_count
FROM users u
LEFT JOIN event_participants ep ON u.referral_code = ep.referrer_code
WHERE u.referral_code IS NOT NULL
GROUP BY u.name, u.referral_code, u.branch
ORDER BY referral_count DESC
LIMIT 20;
