
-- 1. 먼저 중복된 데이터를 정리해야 UNIQUE 제약 조건을 걸 수 있습니다.
-- email이 중복된 경우, auth_uid가 있는 레코드를 우선하고 가장 최근 데이터를 남깁니다.
WITH duplicates AS (
    SELECT id, 
           ROW_NUMBER() OVER (
               PARTITION BY email 
               ORDER BY (auth_uid IS NOT NULL) DESC, created_at DESC
           ) as row_num
    FROM users
    WHERE email IS NOT NULL
)
DELETE FROM users
WHERE id IN (SELECT id FROM duplicates WHERE row_num > 1);

-- 2. auth_uid가 중복된 경우 정리
WITH auth_duplicates AS (
    SELECT id, 
           ROW_NUMBER() OVER (
               PARTITION BY auth_uid 
               ORDER BY created_at DESC
           ) as row_num
    FROM users
    WHERE auth_uid IS NOT NULL
)
DELETE FROM users
WHERE id IN (SELECT id FROM auth_duplicates WHERE row_num > 1);

-- 3. UNIQUE 제약 조건 추가 (중복 방지)
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE users ADD CONSTRAINT users_auth_uid_key UNIQUE (auth_uid);

-- 4. 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON users(auth_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
