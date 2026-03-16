-- 1. 현재 신청하려는 이메일이 다른 전화번호로 이미 등록되어 있는지 확인
-- (로그에 보였던 'dckwak@las.com' 기준)
SELECT id, parent_name, phone, email, created_at
FROM event_participants
WHERE email = 'dckwak@las.com';

-- 2. 해당 전화번호(01076505517)로 저장된 데이터가 혹시 하이픈(-)이나 공백을 포함하고 있는지 확인
SELECT id, parent_name, phone, length(phone) as phone_len
FROM event_participants
WHERE phone LIKE '%7650%5517%';
