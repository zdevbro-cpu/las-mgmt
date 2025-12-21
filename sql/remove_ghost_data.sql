-- 1. 'LAS1098-A028' 구독자 번호를 가진 유령 데이터 찾기
SELECT *
FROM event_participants
WHERE subscriber_number = 'LAS1098-A028';

-- 2. 만약 위 쿼리에 데이터가 나온다면 아래 DELETE 문을 실행하세요.
-- DELETE FROM event_participants WHERE subscriber_number = 'LAS1098-A028';
