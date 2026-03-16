-- Supabase 트리거 및 함수 확인 쿼리

-- 1. event_participants 테이블의 트리거 확인
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'event_participants'
ORDER BY trigger_name;

-- 2. 모든 함수 확인 (subscriber_number 관련)
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
    routine_definition LIKE '%subscriber_number%' OR
    routine_definition LIKE '%registration_source%' OR
    routine_name LIKE '%participant%' OR
    routine_name LIKE '%subscriber%'
)
ORDER BY routine_name;

-- 3. 모든 public 함수 목록
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 4. event_participants 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'event_participants'
ORDER BY ordinal_position;
