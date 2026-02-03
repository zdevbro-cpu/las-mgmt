# 이벤트 대시보드 추천인 Top12 문제 진단 보고서

**진단 일시**: 2026-02-02  
**진단 대상**: 이벤트 대시보드의 추천인 Top 12 카운트 미표시 문제  
**진단 방법**: 데이터베이스 직접 조회 및 코드 분석

---

## 🔴 핵심 문제 확인

### ❌ **Supabase 1000행 제한으로 인한 데이터 누락**

#### 현재 상황:
- **전체 참가자**: 8,944명
- **추천인 코드 있는 참가자**: 8,939명
- **실제 조회되는 데이터**: 1,000명만 조회됨
- **누락된 데이터**: **7,939명 (88.8%)**

#### 문제 발생 위치:
**파일**: `src/components/Admin/AdminEventDashboard.jsx`  
**라인**: 342-371

```javascript
// 현재 코드 (문제 있음)
let referrerStatsQuery = supabase
  .from('event_participants')
  .select('referrer_name, referrer_code')
  .not('referrer_code', 'is', null)

// ... 필터링 ...

const { data: referrerStats, error: referrerError } = await referrerStatsQuery
// ⚠️ 페이지네이션 미적용 → 최대 1000개만 반환
```

---

## 📊 실제 Top 12 추천인 (전체 데이터 기준)

진단 스크립트로 **전체 8,939명의 데이터를 페이지네이션으로 조회**한 결과:

| 순위 | 추천인명 | 추천인코드 | 카운트 |
|------|----------|-----------|--------|
| 🥇 1위 | - | LAS1174 | **712명** |
| 🥈 2위 | - | LAS1095 | **537명** |
| 🥉 3위 | - | LAS3002 | **402명** |
| 4위 | 김정선 | LAS1037 | **367명** |
| 5위 | - | LAS5001 | **339명** |
| 6위 | - | LAS1006 | **261명** |
| 7위 | - | LAS1133 | **213명** |
| 8위 | - | LAS1107 | **190명** |
| 9위 | - | LAS1164 | **180명** |
| 10위 | - | LAS5056 | **176명** |
| 11위 | - | LAS1192 | **173명** |
| 12위 | - | LAS1110 | **173명** |

> **참고**: 추천인명이 '-'로 표시된 경우는 `event_participants` 테이블의 `referrer_name` 컬럼이 NULL이기 때문입니다. `users` 테이블과는 정상적으로 매칭됩니다.

---

## 🔍 원인 분석

### 1. **페이지네이션 미적용** (핵심 원인)

**Line 342-371**: `referrerStatsQuery`에 페이지네이션 로직이 없음

- Supabase는 기본적으로 **최대 1000개 행**만 반환
- 참가자가 8,939명이므로 **7,939명(88.8%)의 데이터가 누락**
- 누락된 데이터에는 최근 참가자 및 신규 추천인이 포함됨
- 결과적으로 **일부 직원의 카운트가 0으로 표시되거나 Top 12에서 누락**

### 2. **재현 시나리오**

1. 사용자가 이벤트 대시보드에 접속
2. `loadData()` 함수 실행 (Line 237)
3. `referrerStatsQuery` 실행 → **1000명만 조회**
4. Top 12 계산 시 **누락된 7,939명은 집계되지 않음**
5. 최근에 추천을 시작한 직원이나 오래된 데이터의 추천인이 **누락**
6. 숫자가 업데이트되지 않는 것처럼 보임

### 3. **대조: 정상 동작하는 코드**

같은 파일의 **Line 427-441**에서는 `branchStatsQuery`에 **페이지네이션이 정상 적용**되어 있음:

```javascript
// 정상 코드 (Line 427-441)
while (true) {
  const { data: pageData, error: pageError } = await branchStatsQuery
    .range(from, from + pageSize - 1)
  
  if (pageError) throw pageError
  if (!pageData || pageData.length === 0) break
  
  allBranchParticipants = allBranchParticipants.concat(pageData)
  
  if (pageData.length < pageSize) break
  from += pageSize
}
```

---

## 📋 추가 확인 사항

### ✅ 정상 항목:
- **users 테이블 매칭**: 모든 추천인 코드가 users 테이블과 정상 매칭됨
- **고유 추천인 수**: 147명의 직원이 추천 활동 중
- **데이터 무결성**: 중복이나 손상된 데이터 없음

### ⚠️ 주의 항목:
- **referrer_name NULL**: 상위 랭킹 중 다수가 `referrer_name`이 NULL
  - `event_participants` 테이블의 `referrer_name` 컬럼이 초기에 제대로 저장되지 않았을 가능성
  - 하지만 `referrer_code`로 `users` 테이블과 매칭은 정상적으로 됨
  - UI에서 표시할 때 `users` 테이블의 `name`을 사용하면 됨

---

## 💡 해결 방법 (수정하지 않고 제시만)

### 수정이 필요한 위치:
**파일**: `src/components/Admin/AdminEventDashboard.jsx`  
**함수**: `loadData()` (Line 237-492)  
**대상**: Line 342-371의 `referrerStatsQuery` 부분

### 수정 방법:
Line 427-441의 `branchStatsQuery` 패턴을 그대로 적용하면 됨:

```javascript
// Line 371을 삭제하고 아래 패턴으로 변경
let allReferrerData = []
let from = 0
const pageSize = 1000

while (true) {
  const { data: pageData, error: pageError } = await referrerStatsQuery
    .range(from, from + pageSize - 1)
  
  if (pageError) throw pageError
  if (!pageData || pageData.length === 0) break
  
  allReferrerData = allReferrerData.concat(pageData)
  
  if (pageData.length < pageSize) break
  from += pageSize
}

const referrerStats = allReferrerData
```

그 후 기존 로직(Line 378-413)은 그대로 사용하면 됨.

---

## 📈 예상 효과 (수정 후)

수정 완료 시:
- ✅ **전체 8,939명의 데이터가 정상 집계**됨
- ✅ **모든 직원의 카운트가 정확하게 표시**됨
- ✅ **실시간 업데이트가 정상 동작**함
- ✅ **Top 12 순위가 정확하게 표시**됨

---

## 🎯 결론

### 문제 요약:
**이벤트 대시보드의 추천인 Top12 숫자가 업데이트되지 않고 일부 직원의 카운트가 보이지 않는 현상**은 **Supabase의 1000행 제한**과 **페이지네이션 미적용**이 원인입니다.

### 핵심 원인:
- 전체 8,939명 중 1,000명만 조회
- 7,939명(88.8%)의 데이터 누락
- 누락된 데이터에 최근 참가자 및 신규 추천인 포함

### 수정 위치:
- **파일**: `src/components/Admin/AdminEventDashboard.jsx`
- **라인**: 342-371
- **방법**: Line 427-441의 페이지네이션 패턴 적용

---

**진단 완료일**: 2026-02-02  
**진단 도구**: `sql/run_diagnosis.js`
