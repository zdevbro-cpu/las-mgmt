-- event_participants 테이블에 deleted_at 컬럼 추가
ALTER TABLE event_participants
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 기존 데이터에 deleted_at이 없으면 NULL 처리 (이미 되어 있음)
-- RLS 정책이 있다면 (Row Level Security), 일반 조회 시 deleted_at IS NULL인 것만 보여주는 정책을 추가할 수 있으나,
-- 여기서는 애플리케이션 레벨(쿼리)에서 처리하는 것이 안전.
