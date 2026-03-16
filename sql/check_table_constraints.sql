-- event_participants 테이블에 걸린 Trigger(트리거) 목록 조회
SELECT event_object_table AS table_name, trigger_name, action_statement AS trigger_action
FROM information_schema.triggers
WHERE event_object_table = 'event_participants';

-- event_participants 테이블의 Index(인덱스) 및 Unique 제약조건 확인
-- (전화번호 외에 다른 컬럼에 UNIQUE가 걸려있지 않은지 확인)
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'event_participants';
