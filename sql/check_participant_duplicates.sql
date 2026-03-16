-- 1. 문제가 발생한 전화번호(01052279774)의 모든 데이터 조회
-- 결과가 2줄 이상이면 중복 데이터가 있는 것입니다.
SELECT id, parent_name, phone, referrer_code, created_at
FROM event_participants
WHERE phone = '01052279774';

-- 2. 추천인이 '이상화'(LAS1098)이면서 해당 전화번호를 가진 데이터 조회
SELECT id, parent_name, phone, referrer_code, created_at
FROM event_participants
WHERE referrer_code = 'LAS1098'
  AND phone = '01052279774';
