-- ========================================
-- 신청인 코드 수정 (충돌 회피 버전)
-- ========================================
-- 실행 순서: 1단계 → 2단계 → 3단계

-- ========================================
-- 1단계: 수정 전 확인
-- ========================================
-- 수정할 데이터 확인
SELECT 
    id,
    subscriber_number,
    referrer_code,
    parent_name,
    created_at
FROM event_participants
WHERE parent_name IN ('윤수한', '이정아', '경수현', '김은애', '홍도빈', '정선아', '이소인', '주혜리')
ORDER BY referrer_code, created_at;


-- ========================================
-- 2단계: 개별 수정 (다음 사용 가능한 번호로)
-- ========================================
-- 각 추천인의 마지막 번호:
-- LAS1037: A129 → 다음 A130
-- LAS1053: A052 → 다음 A053
-- LAS1090: A036 → 다음 A037
-- LAS1110: A156 → 다음 A157

-- 2-1. 홍도빈: LAS1092-A003 → LAS1090-A037 (LAS1090의 다음 번호)
UPDATE event_participants
SET subscriber_number = 'LAS1090-A037'
WHERE parent_name = '홍도빈' AND subscriber_number = 'LAS1092-A003';

-- 2-2. 김은애: LAS1095-A047 → LAS1037-A130 (LAS1037의 다음 번호)
UPDATE event_participants
SET subscriber_number = 'LAS1037-A130'
WHERE parent_name = '김은애' AND subscriber_number = 'LAS1095-A047';

-- 2-3. 정선아: LAS1103-A001 → LAS1110-A157 (LAS1110의 다음 번호)
UPDATE event_participants
SET subscriber_number = 'LAS1110-A157'
WHERE parent_name = '정선아' AND subscriber_number = 'LAS1103-A001';

-- 2-4. 이소인: LAS5012-A008 → LAS1110-A158 (LAS1110의 다음 번호)
UPDATE event_participants
SET subscriber_number = 'LAS1110-A158'
WHERE parent_name = '이소인' AND subscriber_number = 'LAS5012-A008';

-- 2-5. 주혜리: LAS5026-A001 → LAS1110-A159 (LAS1110의 다음 번호)
UPDATE event_participants
SET subscriber_number = 'LAS1110-A159'
WHERE parent_name = '주혜리' AND subscriber_number = 'LAS5026-A001';


-- ========================================
-- 3단계: LAS1053 충돌 케이스 수정
-- ========================================
-- LAS1053의 마지막 번호가 A052이므로, A053부터 사용

-- 3-1. 윤수한: LAS1048-A012 → LAS1053-A053
UPDATE event_participants
SET subscriber_number = 'LAS1053-A053'
WHERE parent_name = '윤수한' AND subscriber_number = 'LAS1048-A012';

-- 3-2. 이정아: LAS1048-A013 → LAS1053-A054
UPDATE event_participants
SET subscriber_number = 'LAS1053-A054'
WHERE parent_name = '이정아' AND subscriber_number = 'LAS1048-A013';

-- 3-3. 경수현: LAS1048-A014 → LAS1053-A055
UPDATE event_participants
SET subscriber_number = 'LAS1053-A055'
WHERE parent_name = '경수현' AND subscriber_number = 'LAS1048-A014';


-- ========================================
-- 4단계: 수정 결과 확인
-- ========================================
-- 수정된 데이터 확인
SELECT 
    subscriber_number,
    referrer_code,
    parent_name,
    created_at
FROM event_participants
WHERE parent_name IN ('윤수한', '이정아', '경수현', '김은애', '홍도빈', '정선아', '이소인', '주혜리')
ORDER BY referrer_code, subscriber_number;

-- 불일치 확인 (0이어야 함)
SELECT COUNT(*) as remaining_mismatches
FROM event_participants
WHERE subscriber_number IS NOT NULL
  AND referrer_code IS NOT NULL
  AND SPLIT_PART(subscriber_number, '-', 1) != referrer_code;
