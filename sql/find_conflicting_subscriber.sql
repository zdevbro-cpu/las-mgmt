-- 1. 현재 충돌을 일으키고 있는 'LAS1098-A028' 번호를 가진 데이터가 누구인지 확인
SELECT id, subscriber_number, parent_name, phone, created_at
FROM event_participants
WHERE subscriber_number = 'LAS1098-A028';

-- 2. (확인 후 삭제해도 된다면) 아래 쿼리를 실행하여 충돌 데이터 삭제
-- DELETE FROM event_participants WHERE subscriber_number = 'LAS1098-A028';
