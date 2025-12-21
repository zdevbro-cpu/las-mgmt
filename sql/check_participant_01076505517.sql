-- 전화번호 01076505517 인 신청자 확인
SELECT id, parent_name, phone, referrer_code, created_at
FROM event_participants
WHERE phone = '01076505517';
