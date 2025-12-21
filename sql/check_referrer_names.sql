-- 1. LAS1047 코드로 저장된 신청자들의 추천인 이름(referrer_name) 확인
-- 만약 여기에 '박선혜'가 섞여 있다면, 신청 당시에 이름이 잘못 저장된 것입니다.
SELECT referrer_code, referrer_name, COUNT(*) as count
FROM event_participants
WHERE referrer_code IN ('LAS1046', 'LAS1047')
GROUP BY referrer_code, referrer_name;

-- 2. 실제 회원 테이블(users)에서 해당 코드의 주인 확인
SELECT referral_code, name, branch
FROM users
WHERE referral_code IN ('LAS1046', 'LAS1047');
