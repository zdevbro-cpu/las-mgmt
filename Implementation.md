# 🎯 LAS 매장관리 시스템: 계약근무 & 고유번호 추가 가이드

## 📋 TODO 체크리스트

### ✅ Phase 1: 계약근무 사용자 타입 추가
- [x] 1-1. roles.js에 CONTRACT_WORKER 추가
- [x] 1-2. 계약근무 권한 함수 정의
- [x] 1-3. Signup.jsx에 계약근무 라디오 버튼 추가

### ✅ Phase 2: Dashboard 권한 조정  
- [x] 2-1. Dashboard.jsx - 계약근무 메뉴 제한 (근무일지/판매관리/내정보만)
- [x] 2-2. AdminDashboard.jsx - 지점관리자에게 이벤트 버튼 추가

### 🔄 Phase 3: 고유번호 생성 시스템
- [x] 3-1. 고유번호 생성 로직 설계 (roles.js에 포함)
- [ ] 3-2. Supabase users 테이블에 referral_code 컬럼 추가 (SQL 실행 필요)
- [ ] 3-3. 회원가입/승인 시 자동 발급 (App.jsx 수정 필요)

### 🔄 Phase 4: 이벤트 대시보드 권한
- [x] 4-1. AdminDashboard에 이벤트 버튼 추가 (지점관리자 조건부)
- [x] 4-2. roles.js에 canAccessEventDashboard() 함수 추가
- [ ] 4-3. AdminEvent 컴포넌트에서 지점별 필터링 구현 (컴포넌트 수정 필요)

### ⚠️ Phase 5: App.jsx 검토
- [ ] 5-1. 현재 라우팅 구조 확인
- [ ] 5-2. 고유번호 자동 발급 로직 추가
- [ ] 5-3. AdminEvent 라우팅 권한 체크 추가

---

## 📦 제공된 파일

### 1. roles.js
- **경로**: `src/constants/roles.js`
- **변경사항**:
  - `CONTRACT_WORKER: '계약근무'` 추가
  - `isContractWorker()` 함수 추가
  - `canGetSalesCommission()` 함수 추가 (계약근무 제외)
  - `canAccessEventDashboard()` 함수 추가 (지점관리자+)
  - `generateReferralCode()` 함수 추가
  - 권한 레벨 재조정 (0~5)

### 2. Signup.jsx
- **경로**: `src/pages/Signup.jsx`
- **변경사항**:
  - 구분 라디오 버튼을 2x2 그리드로 변경
  - 계약근무 옵션 추가
  - 기본값: 모니터링요원

### 3. Dashboard.jsx
- **경로**: `src/pages/Dashboard.jsx`
- **변경사항**:
  - `isContractWorker()` import 추가
  - 계약근무 전용 메뉴 구현 (근무일지+판매관리만)
  - 매장관리 배너 숨김 (모니터링요원+계약근무)

### 4. AdminDashboard.jsx
- **경로**: `src/pages/AdminDashboard.jsx`
- **변경사항**:
  - `isBranchManager()` import 추가
  - 이벤트 참가자 관리 버튼 추가 (지점관리자 조건부)
  - 빨간색 버튼으로 구분 (#dc2626)

### 5. supabase_referral_code.sql
- **경로**: Supabase SQL Editor에서 직접 실행
- **내용**:
  - users 테이블에 referral_code 컬럼 추가
  - event_participants 테이블에 referrer_code 컬럼 추가
  - 인덱스 생성

---

## 🚀 적용 순서

### Step 1: 파일 교체
```bash
# src/constants/roles.js 교체
cp roles.js src/constants/roles.js

# src/pages/Signup.jsx 교체
cp Signup.jsx src/pages/Signup.jsx

# src/pages/Dashboard.jsx 교체
cp Dashboard.jsx src/pages/Dashboard.jsx

# src/pages/AdminDashboard.jsx 교체
cp AdminDashboard.jsx src/pages/AdminDashboard.jsx
```

### Step 2: Supabase 테이블 수정
```
1. Supabase Dashboard 로그인
2. SQL Editor 열기
3. supabase_referral_code.sql 내용 복사
4. Run 실행
5. Table Editor에서 users 테이블 확인
   - referral_code 컬럼 존재 확인
```

### Step 3: 테스트
```bash
npm run dev
```

#### 테스트 시나리오 A: 계약근무 가입
```
1. 직원가입 페이지 접속
2. 구분에서 "계약근무" 선택
3. 가입 완료
4. 관리자 승인
5. 로그인 후 Dashboard 확인
   ✅ 근무일지 버튼 표시
   ✅ 판매관리 버튼 표시
   ✅ 내정보관리 버튼 표시
   ❌ 주문목록관리 버튼 숨김
   ❌ 구매이력 버튼 숨김
   ❌ 매장관리 배너 숨김
```

#### 테스트 시나리오 B: 지점관리자 이벤트 접근
```
1. 지점관리자 계정으로 로그인
2. 매장관리 클릭
3. AdminDashboard에서 확인
   ✅ 이벤트 참가자 관리 버튼 표시 (빨간색)
4. 버튼 클릭
5. AdminEvent 페이지 로드 확인
```

---

## 🔧 추가 구현 필요 사항

### 1. App.jsx 수정 (고유번호 자동 발급)

**위치**: 사용자 승인 시점
```javascript
import { generateReferralCode } from './constants/roles'

// 사용자 승인 함수에서
const handleApproveUser = async (userId) => {
  // ... 기존 코드 ...
  
  // 기존 고유번호 목록 가져오기
  const { data: existingUsers } = await supabase
    .from('users')
    .select('referral_code')
    .not('referral_code', 'is', null)
  
  const existingCodes = existingUsers.map(u => u.referral_code)
  
  // 새 고유번호 생성
  const newCode = generateReferralCode(user, existingCodes)
  
  // 사용자 업데이트
  await supabase
    .from('users')
    .update({
      status: 'approved',
      referral_code: newCode,
      approved_at: new Date().toISOString()
    })
    .eq('id', userId)
}
```

### 2. AdminEvent 컴포넌트 수정 (지점별 필터링)

**위치**: AdminEvent.jsx
```javascript
import { isSystemAdmin, canAccessEventDashboard } from '../constants/roles'

export default function AdminEvent({ user }) {
  const [participants, setParticipants] = useState([])
  
  useEffect(() => {
    loadParticipants()
  }, [])
  
  const loadParticipants = async () => {
    let query = supabase
      .from('event_participants')
      .select(`
        *,
        referrer:users!event_participants_referrer_code_fkey(
          name,
          branch,
          user_type
        )
      `)
    
    // 시스템관리자가 아니면 자기 지점만
    if (!isSystemAdmin(user)) {
      // 자기 지점 소속 직원들의 referral_code 가져오기
      const { data: branchUsers } = await supabase
        .from('users')
        .select('referral_code')
        .eq('branch', user.branch)
      
      const branchCodes = branchUsers.map(u => u.referral_code).filter(Boolean)
      
      query = query.in('referrer_code', branchCodes)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('참가자 조회 오류:', error)
      return
    }
    
    setParticipants(data || [])
  }
  
  // ... 나머지 코드 ...
}
```

### 3. MyInfo 컴포넌트에 고유번호 표시

**위치**: MyInfo.jsx
```javascript
// 읽기 전용 필드 추가
<div>
  <label>고유번호</label>
  <input
    type="text"
    value={user?.referral_code || '미발급'}
    readOnly
    className="bg-gray-50"
  />
  <p className="text-xs text-gray-500">
    이벤트 참여자 모집 시 사용하는 고유번호입니다
  </p>
</div>
```

---

## 🎯 권한 체계 요약

| 사용자 타입 | 레벨 | 근무일지 | 판매관리 | 매장관리 | 이벤트 | 고유번호 | 수당 |
|------------|------|---------|---------|---------|--------|---------|-----|
| 모니터링요원 | 0 | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 계약근무 | 1 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 점주 | 2 | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| 점장 | 3 | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| 지점관리자 | 4 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| 시스템관리자 | 5 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

---

## 📊 고유번호 형식

### 형식
```
[지점코드(2자리)]-[타입(1자리)]-[일련번호(4자리)]
```

### 예시
```
SC-M-0001  (서초점-모니터링요원-0001)
SC-C-0001  (서초점-계약근무-0001)
SC-O-0001  (서초점-점주-0001)
SC-S-0001  (서초점-점장-0001)
GN-M-0001  (강남점-모니터링요원-0001)
```

### 타입 코드
- M: 모니터링요원 (Monitoring agent)
- C: 계약근무 (Contract worker)
- O: 점주 (Owner)
- S: 점장 (Store manager)

---

## ⚠️ 주의사항

### 1. 계약근무 수당 처리
- 계약근무는 판매 수당이 **없음**
- 계약근무 시간의 판매 수당은 동일 시간 근무한 점장에게 배분
- **시스템에는 수당 배분 로직이 없음** (수동 처리)

### 2. 지점관리자 이벤트 접근
- 지점관리자는 **자기 지점 직원이 모집한 참가자만** 조회
- 시스템관리자는 **전체 참가자** 조회

### 3. 고유번호 발급
- 사용자 **승인 시점**에 자동 발급
- 중복 방지를 위해 기존 코드 체크 필수
- 발급 후 수정 불가 (UNIQUE 제약)

---

## 🐛 문제 해결

### Q1: 계약근무로 가입했는데 전체 메뉴가 보여요
**A**: roles.js import 확인
```javascript
import { isContractWorker } from '../constants/roles'
```

### Q2: 지점관리자인데 이벤트 버튼이 안 보여요
**A**: user.user_type 확인
```javascript
console.log('User type:', user.user_type)
console.log('Can access event:', canAccessEventDashboard(user))
```

### Q3: 고유번호가 생성되지 않아요
**A**: 
1. Supabase SQL 실행 확인
2. App.jsx에 발급 로직 추가 확인
3. 콘솔에서 에러 메시지 확인

---

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 브라우저 콘솔 (F12)
2. Supabase Dashboard > Table Editor
3. Network 탭 (API 호출 확인)

---

## ✅ 최종 체크리스트

배포 전 확인:
- [ ] roles.js 교체 완료
- [ ] Signup.jsx 교체 완료
- [ ] Dashboard.jsx 교체 완료
- [ ] AdminDashboard.jsx 교체 완료
- [ ] Supabase SQL 실행 완료
- [ ] App.jsx 고유번호 발급 로직 추가
- [ ] AdminEvent 지점 필터링 구현
- [ ] 계약근무 가입 테스트 완료
- [ ] 지점관리자 이벤트 접근 테스트 완료
- [ ] Git commit & push 완료

---

구현 완료! 🎉