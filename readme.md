# LAS 매장관리 시스템

LAS Book의 매장 운영 및 관리를 위한 통합 관리 시스템입니다.

## 🚀 기술 스택

### Frontend
- **React** 18.3.1
- **React Router DOM** 6.28.0
- **Vite** 5.4.21 (빌드 도구)
- **Lucide React** 0.263.1 (아이콘)
- **Tailwind CSS** (스타일링)

### Backend & Database
- **Supabase** 2.39.0
  - PostgreSQL (Database)
  - Authentication (인증)
  - Row Level Security (보안)

### 개발 환경
- **Node.js** 22.x
- **npm** 10.x

### 주요 라이브러리
- **qrcode** 1.5.4 (QR 코드 생성)
- **qrcode.react** 4.2.0 (React QR 컴포넌트)

## 📁 프로젝트 구조

```
las-mgmt/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── Admin/          # 관리자 전용 컴포넌트
│   │   │   ├── AdminEventDashboard.jsx
│   │   │   ├── AdminEventMenu.jsx
│   │   │   └── AdminEventManager.jsx
│   │   ├── event/          # 이벤트 관련 컴포넌트
│   │   ├── AdminDashboard.jsx      # 매장관리 메인
│   │   ├── AdminWorkDiary.jsx      # 근무일지 관리
│   │   ├── Dashboard.jsx           # 직원 대시보드
│   │   ├── Login.jsx               # 로그인
│   │   └── ...
│   ├── constants/          # 상수 정의
│   │   └── roles.js       # 권한 관리
│   ├── lib/               # 유틸리티
│   │   └── supabase.js    # Supabase 클라이언트
│   ├── App.jsx            # 메인 앱 컴포넌트
│   └── main.jsx           # 진입점
├── public/
│   └── images/            # 이미지 리소스
├── .nvmrc                 # Node 버전 고정
├── vite.config.js         # Vite 설정
└── package.json           # 의존성 관리
```

## 🛠️ 설치 및 실행

### 1. 저장소 클론

```bash
git clone https://github.com/zdevbro-cpu/las-mgmt.git
cd las-mgmt
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 개발 서버 실행

```bash
npm run dev
```

개발 서버: http://localhost:5173

### 5. 프로덕션 빌드

```bash
npm run build
```

### 6. 빌드 미리보기

```bash
npm run preview
```

미리보기 서버: http://localhost:4173

## 🌐 배포

- **플랫폼**: Vercel
- **자동 배포**: main 브랜치에 push 시 자동 배포
- **Node 버전**: 22.x (`.nvmrc`로 고정)

## 👥 사용자 역할

### 시스템 관리자
- 모든 지점 관리
- 이벤트 템플릿 관리
- 전체 시스템 설정

### 지점 관리자
- 해당 지점 직원 관리
- 근무일지 관리
- 구매 고객 조회
- 이벤트 대시보드

### 직원
- 근무일지 작성
- 판매 관리
- 배송 목록
- 구매 이력 조회

## ✨ 주요 기능

### 근무 관리
- 근무일지 작성 및 조회
- 총 근무시간 자동 계산
- 지점별/기간별 검색

### 직원 관리
- 직원 정보 등록/수정
- 권한 관리 (지점관리자/직원)
- 지점별 직원 관리

### 고객 관리
- 구매 고객 정보 관리
- 구매 이력 조회
- 배송 현황 관리

### 이벤트 관리
- 이벤트 랜딩 페이지
- 이벤트 참가자 관리
- 이벤트 템플릿 관리 (시스템 관리자)

### QR 코드
- 개인 QR 코드 생성
- QR 페이지 커스터마이징
- QR 코드 다운로드

## 🔧 중요 설정

### Vite 설정 (vite.config.js)

```javascript
{
  ssr: {
    noExternal: [
      '@supabase/supabase-js',
      '@supabase/storage-js',
      '@supabase/postgrest-js',
      '@supabase/realtime-js',
      '@supabase/gotrue-js'
    ]
  }
}
```

**이유**: Supabase 패키지들을 SSR 번들에 포함시켜 모듈 해석 오류 방지

### 패키지 버전 고정

- **Supabase 2.39.0**: Node 22 호환성, storage-js 안정성
- **lucide-react 0.263.1**: Vite 빌드 호환성

## 📝 최근 업데이트 (2025-10-24)

### 추가된 기능
- ✅ 근무일지 관리: 총 근무시간 표시
- ✅ AdminEventMenu 컴포넌트 추가
- ✅ 색상 톤다운 적용 (일관성 있는 UI)

### 수정된 문제
- ✅ Vercel 배포 오류 해결
- ✅ Supabase storage-js 모듈 오류 수정
- ✅ lucide-react 빌드 오류 해결
- ✅ AdminDashboard 파일 복구
- ✅ HeroPage 렌더링 문제 우회

### 기술적 개선
- ✅ vite.config.js: ssr.noExternal 설정
- ✅ Node.js 22.x 버전 고정
- ✅ 패키지 버전 안정화

## 🐛 트러블슈팅

### Supabase 연결 오류
```bash
# .env 파일 확인
# VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY 확인
```

### 빌드 오류
```bash
# 캐시 삭제 후 재빌드
rm -rf node_modules .vite dist
npm install
npm run build
```

### Vercel 배포 실패
```bash
# package.json의 버전이 정확히 고정되어 있는지 확인
# "^" 기호 없이 정확한 버전 명시
```

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.

## 📄 라이선스

이 프로젝트는 LAS Book의 내부 시스템입니다.

---

**Last Updated**: 2025-10-24
**Version**: 1.1.0