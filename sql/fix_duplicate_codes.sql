-- ========================================
-- 신청인 코드 중복 수정 쿼리
-- ========================================
-- 실행 순서: 1단계 → 2단계 → 3단계 → 4단계 → 5단계
-- ⚠️ 주의: 각 단계를 순서대로 실행하세요!

-- ========================================
-- 1단계: 백업 테이블 생성 (필수!)
-- ========================================
-- 실행 전 반드시 백업 테이블을 생성하세요
-- 백업 테이블명: event_participants_backup_20251120

DROP TABLE IF EXISTS event_participants_backup_20251120;

CREATE TABLE event_participants_backup_20251120 AS 
SELECT * FROM event_participants;

-- 백업 확인
SELECT COUNT(*) as backup_count FROM event_participants_backup_20251120;
SELECT COUNT(*) as original_count FROM event_participants;


-- ========================================
-- 2단계: 중복 코드 현황 확인
-- ========================================
-- LASLAS로 시작하는 중복 코드 확인
SELECT 
    id,
    subscriber_number,
    parent_name,
    phone,
    referrer_code,
    created_at
FROM event_participants
WHERE subscriber_number LIKE 'LASLAS%'
ORDER BY created_at DESC;

-- 패턴별 개수 확인
SELECT 
    CASE 
        WHEN subscriber_number LIKE 'LASLAS%' THEN 'LASLAS (중복)'
        WHEN subscriber_number LIKE 'LAS%-%' THEN 'LAS-정상'
        ELSE '기타'
    END AS pattern_type,
    COUNT(*) as count
FROM event_participants
WHERE subscriber_number IS NOT NULL
GROUP BY pattern_type
ORDER BY count DESC;


-- ========================================
-- 3단계: LASLAS → LAS 수정 실행
-- ========================================
-- 예: LASLAS-A010 → LAS-A010
UPDATE event_participants
SET subscriber_number = REPLACE(subscriber_number, 'LASLAS', 'LAS')
WHERE subscriber_number LIKE 'LASLAS%';

-- 수정된 행 개수 확인 (위 쿼리 실행 후 결과 확인)


-- ========================================
-- 4단계: 수정 결과 확인
-- ========================================
-- LASLAS가 남아있는지 확인 (결과가 0이어야 정상)
SELECT COUNT(*) as remaining_duplicates
FROM event_participants
WHERE subscriber_number LIKE 'LASLAS%';

-- 최근 수정된 데이터 샘플 확인
SELECT 
    subscriber_number,
    parent_name,
    referrer_code,
    created_at
FROM event_participants
WHERE subscriber_number LIKE 'LAS%'
ORDER BY created_at DESC
LIMIT 30;


-- ========================================
-- 5단계: 중복 subscriber_number 확인
-- ========================================
-- 같은 subscriber_number가 여러 개 있는지 확인
-- (정상적으로는 중복이 없어야 함)
SELECT 
    subscriber_number,
    COUNT(*) as count,
    STRING_AGG(parent_name, ', ') as parents
FROM event_participants
WHERE subscriber_number IS NOT NULL
GROUP BY subscriber_number
HAVING COUNT(*) > 1
ORDER BY count DESC;


-- ========================================
-- 롤백 방법 (문제 발생 시)
-- ========================================
-- 만약 수정 후 문제가 발생하면 아래 쿼리로 복구 가능:
-- 
-- TRUNCATE TABLE event_participants;
-- INSERT INTO event_participants SELECT * FROM event_participants_backup_20251120;
-- 
-- ⚠️ 주의: 위 쿼리는 모든 데이터를 백업으로 되돌립니다!
