# LAS 매장관리 시스템 - 구매이력 기능 구현 가이드

## 1. 필수 패키지 설치

```bash
npm install @supabase/supabase-js
npm install lucide-react
```

## 2. Supabase 설정

### 2.1 Supabase 프로젝트 생성
1. https://supabase.com 접속
2. 새 프로젝트 생성
3. SQL Editor에서 제공된 SQL 스크립트 실행

### 2.2 환경 변수 설정
프로젝트 루트에 `.env` 파일 생성:
```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. 파일 구조

```
src/
├── components/
│   ├── Dashboard.jsx (수정됨)
│   ├── PurchaseHistory.jsx (신규)
│   └── ... (기타 컴포넌트)
├── App.js (수정 필요)
└── .env (생성 필요)
```

## 4. GitHub + Vercel 배포

### 4.1 GitHub에 푸시
```bash
git add .
git commit -m "구매이력 기능 추가"
git push origin main
```

### 4.2 Vercel 배포
1. https://vercel.com 접속 및 로그인
2. "Import Project" 클릭
3. GitHub 저장소 선택
4. Environment Variables 설정:
   - `REACT_APP_SUPABASE_URL`: Supabase URL
   - `REACT_APP_SUPABASE_ANON_KEY`: Supabase Anon Key
5. "Deploy" 클릭

## 5. 기능 설명

### 5.1 Dashboard.jsx
- **구매이력** 버튼 추가
- 기존 디자인 톤앤메너 유지 (#249689 컬러)

### 5.2 PurchaseHistory.jsx
- **검색 기능**: 전화번호/이름/이메일로 검색
- **목록 표시**: 구매자 정보를 테이블 형태로 표시
- **상세 팝업**: 행 클릭 시 상세 정보 모달 표시
- **읽기 전용**: 모든 필드는 조회만 가능

### 5.3 데이터베이스 구조
```
purchases 테이블:
- id: UUID (Primary Key)
- customer_name: 고객명
- customer_phone: 전화번호
- customer_email: 이메일
- order_info: 주문 정보
- payment_method: 결제 방법
- payment_amount: 결제 금액
- branch_name: 지점명
- created_at: 생성일시
- updated_at: 수정일시
```

## 6. 주의사항

- ✅ 기존 디자인 톤앤메너 유지
- ✅ 로컬 테스트 불필요 (요청에 따라)
- ✅ Supabase DB 사용
- ✅ GitHub + Vercel 배포
- ✅ 읽기 전용 구현

## 7. 테스트 방법

1. Supabase에서 샘플 데이터 확인
2. Vercel 배포 URL 접속
3. 로그인 후 대시보드에서 "구매이력" 클릭
4. 전화번호/이름/이메일로 검색 테스트
5. 검색 결과 행 클릭하여 상세 정보 확인

## 8. 문제 해결

### 8.1 환경 변수 오류
- Vercel 대시보드에서 환경 변수 재확인
- 변수명이 정확한지 확인 (`REACT_APP_` 접두사 필수)

### 8.2 검색 결과 없음
- Supabase 테이블에 데이터가 있는지 확인
- RLS 정책이 올바르게 설정되었는지 확인

### 8.3 모달 창이 열리지 않음
- 브라우저 콘솔에서 에러 확인
- React 상태 관리 로직 확인