# 신청인 코드 중복 문제 해결 가이드

## 📋 실행 순서

### 1️⃣ 조사 단계 (선택사항)

먼저 현재 상황을 파악하고 싶다면 아래 쿼리를 실행하세요:

#### `check_triggers_and_functions.sql`
- DB 트리거 및 함수 확인
- subscriber_number 자동 생성 로직 파악

#### `check_duplicate_codes.sql`
- 현재 중복 코드 현황 확인
- 패턴 분석

---

### 2️⃣ 수정 단계 (필수)

#### `fix_duplicate_codes.sql` 실행

**⚠️ 중요: 반드시 순서대로 실행하세요!**

```
1단계: 백업 테이블 생성 ✅ 필수!
2단계: 중복 코드 현황 확인
3단계: LASLAS → LAS 수정 실행
4단계: 수정 결과 확인
5단계: 중복 subscriber_number 확인
```

---

## 🔧 Supabase에서 실행하는 방법

### 방법 1: SQL Editor 사용 (권장)

1. Supabase Dashboard 접속
   - https://supabase.com/dashboard/project/sgxnxbhbyvrmgrzhosyh/editor

2. 좌측 메뉴에서 **SQL Editor** 클릭

3. **New Query** 버튼 클릭

4. `fix_duplicate_codes.sql` 파일 내용을 복사하여 붙여넣기

5. **각 단계별로 선택하여 실행**
   - 1단계 쿼리만 선택 → Run 클릭
   - 결과 확인 후 2단계 실행
   - 순서대로 5단계까지 실행

### 방법 2: 파일 업로드

1. SQL Editor에서 **Import** 버튼 클릭
2. `fix_duplicate_codes.sql` 파일 선택
3. 각 단계별로 실행

---

## ✅ 실행 체크리스트

- [ ] 1단계: 백업 테이블 생성 완료
- [ ] 백업 테이블 행 개수 확인 (원본과 동일해야 함)
- [ ] 2단계: 중복 코드 현황 확인 (LASLAS 패턴 개수 확인)
- [ ] 3단계: UPDATE 쿼리 실행 (수정된 행 개수 확인)
- [ ] 4단계: LASLAS 패턴이 0개인지 확인
- [ ] 5단계: 중복 subscriber_number가 없는지 확인

---

## 🚨 문제 발생 시 롤백 방법

만약 수정 후 문제가 발생하면:

```sql
-- 모든 데이터를 백업으로 복구
TRUNCATE TABLE event_participants;
INSERT INTO event_participants 
SELECT * FROM event_participants_backup_20251120;
```

---

## 📊 예상 결과

### 수정 전
```
subscriber_number: LASLAS-A010
subscriber_number: LASLAS-A011
subscriber_number: LAS1011-A012 (정상)
```

### 수정 후
```
subscriber_number: LAS-A010 ✅
subscriber_number: LAS-A011 ✅
subscriber_number: LAS1011-A012 ✅
```

---

## 🔍 추가 조사 필요 사항

수정 완료 후에도 **새로운 참가자 등록 시 중복이 계속 발생**한다면:

1. `check_triggers_and_functions.sql` 실행
2. 트리거/함수 코드 확인
3. 코드 생성 로직 수정 필요

---

## 💡 참고사항

- **subscriber_number 형식**: `추천인코드-연번`
  - 예: `LAS1011-A010` (추천인 LAS1011, 연번 A010)
- **referrer_code**: 추천인의 고유코드 (예: LAS1011)
- 중복 발생 원인: 추천인 코드가 이미 "LAS"로 시작하는데, 코드 생성 시 다시 "LAS"를 붙이는 로직 추정
