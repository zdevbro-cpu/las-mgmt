-- 잘못된 추천인 이름 일괄 수정
-- LAS1047 코드를 가진 모든 내역의 추천인 이름을 '김현경'으로 변경
UPDATE event_participants
SET referrer_name = '김현경'
WHERE referrer_code = 'LAS1047';
