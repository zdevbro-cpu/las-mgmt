-- ========================================
-- 신청인 코드와 추천인 코드 불일치 수정
-- ========================================
-- 실행 순서: 1단계 → 2단계 → 3단계 → 4단계
-- ⚠️ 주의: 각 단계를 순서대로 실행하세요!

-- ========================================
-- 1단계: 백업 테이블 생성 (필수!)
-- ========================================
DROP TABLE IF EXISTS event_participants_backup_mismatch_20251120;

CREATE TABLE event_participants_backup_mismatch_20251120 AS 
SELECT * FROM event_participants;

-- 백업 확인
SELECT COUNT(*) as backup_count FROM event_participants_backup_mismatch_20251120;
SELECT COUNT(*) as original_count FROM event_participants;


-- ========================================
-- 2단계: 수정 전 불일치 케이스 확인
-- ========================================
SELECT 
    id,
    subscriber_number,
    referrer_code,
    parent_name,
    -- 수정될 값 미리보기
    referrer_code || '-' || SPLIT_PART(subscriber_number, '-', 2) as new_subscriber_number
FROM event_participants
WHERE subscriber_number IS NOT NULL
  AND referrer_code IS NOT NULL
  AND SPLIT_PART(subscriber_number, '-', 1) != referrer_code
ORDER BY created_at DESC;


-- ========================================
-- 3단계: 불일치 코드 수정 실행
-- ========================================
-- subscriber_number의 앞부분을 referrer_code로 교체
-- 예: LAS1092-A003 → LAS1090-A003 (referrer_code가 LAS1090인 경우)

UPDATE event_participants
SET subscriber_number = referrer_code || '-' || SPLIT_PART(subscriber_number, '-', 2)
WHERE subscriber_number IS NOT NULL
  AND referrer_code IS NOT NULL
  AND SPLIT_PART(subscriber_number, '-', 1) != referrer_code;

-- 수정된 행 개수 확인 (위 쿼리 실행 후 결과 확인)


-- ========================================
-- 4단계: 수정 결과 확인
-- ========================================
-- 불일치가 남아있는지 확인 (결과가 0이어야 정상)
SELECT COUNT(*) as remaining_mismatches
FROM event_participants
WHERE subscriber_number IS NOT NULL
  AND referrer_code IS NOT NULL
  AND SPLIT_PART(subscriber_number, '-', 1) != referrer_code;

-- 일치/불일치 개수 확인
SELECT 
    CASE 
        WHEN SPLIT_PART(subscriber_number, '-', 1) = referrer_code THEN '일치'
        WHEN referrer_code IS NULL THEN '추천인없음'
        ELSE '불일치'
    END as match_status,
    COUNT(*) as count
FROM event_participants
WHERE subscriber_number IS NOT NULL
GROUP BY match_status
ORDER BY count DESC;

-- 수정된 데이터 샘플 확인
SELECT 
    subscriber_number,
    referrer_code,
    parent_name,
    created_at
FROM event_participants
WHERE parent_name IN ('경수현', '윤수한', '이정아', '김은애', '홍도빈', '정선아', '이소인', '주혜리')
ORDER BY created_at DESC;


-- ========================================
-- 롤백 방법 (문제 발생 시)
-- ========================================
-- 만약 수정 후 문제가 발생하면 아래 쿼리로 복구 가능:
-- 
-- TRUNCATE TABLE event_participants;
-- INSERT INTO event_participants SELECT * FROM event_participants_backup_mismatch_20251120;
-- 
-- ⚠️ 주의: 위 쿼리는 모든 데이터를 백업으로 되돌립니다!
