-- users 테이블에 deleted_at 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- admin_users 테이블(만약 존재한다면)에도 추가 필요할 수 있음
-- 현재 프로젝트 구조상 users 테이블이 통합 관리되는 것으로 보임.
