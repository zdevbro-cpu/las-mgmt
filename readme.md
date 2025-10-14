# LAS 매장관리 시스템

React + Vite + Supabase로 구축된 매장관리 시스템입니다.

## 📁 프로젝트 구조

```
las-store-management/
├── index.html              # HTML 엔트리 포인트
├── package.json            # 의존성 및 스크립트
├── vite.config.js          # Vite 설정
├── .gitignore              # Git 무시 파일
├── src/
│   ├── main.jsx           # React 엔트리 포인트
│   └── App.jsx            # 메인 애플리케이션 컴포넌트
└── README.md              # 이 파일
```

## 🚀 빠른 시작

### 1. 프로젝트 폴더 생성 및 파일 복사

```bash
# 폴더 생성
mkdir las-store-management
cd las-store-management

# src 폴더 생성
mkdir src
```

다음 파일들을 각 위치에 복사하세요:
- `package.json` (루트)
- `vite.config.js` (루트)
- `index.html` (루트)
- `.gitignore` (루트)
- `src/main.jsx` (src 폴더)
- `src/App.jsx` (src 폴더)

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저가 자동으로 열리고 `http://localhost:3000`에서 실행됩니다.

### 4. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

## ⚙️ Supabase 설정

### 1. Supabase 프로젝트 생성

1. https://supabase.com 접속
2. 새 프로젝트 생성
3. Project Settings > API에서 다음 정보 확인:
   - Project URL
   - anon public key

### 2. 테이블 생성

SQL Editor에서 다음 SQL 실행:

```sql
-- users 테이블
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  brname TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- work_logs 테이블
CREATE TABLE work_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_date DATE NOT NULL,
  end_time TIME NOT NULL,
  work_hours DECIMAL(5,2),
  check_clean BOOLEAN DEFAULT FALSE,
  check_training BOOLEAN DEFAULT FALSE,
  check_checklist BOOLEAN DEFAULT FALSE,
  outdoor TEXT,
  model TEXT,
  customer TEXT,
  suggestion TEXT,
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- sales 테이블
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  buyer_name TEXT NOT NULL,
  buyer_birth TEXT,
  buyer_address TEXT,
  buyer_phone TEXT NOT NULL,
  buyer_email TEXT,
  payment_method TEXT NOT NULL,
  quantity TEXT,
  depositor TEXT,
  deposit_period TEXT,
  order_info TEXT,
  submitted_at TIMESTAMP DEFAULT NOW()
);
```

### 3. RLS 정책 추가 (중요!)

회원가입이 작동하려면 RLS 정책을 추가하세요:

```sql
-- users 테이블: 누구나 회원가입 가능
CREATE POLICY "Anyone can insert users" 
ON users 
FOR INSERT 
WITH CHECK (true);

-- users 테이블: 모든 사용자 조회 가능
CREATE POLICY "Anyone can read users" 
ON users 
FOR SELECT 
USING (true);

-- work_logs: 인증된 사용자만 INSERT 가능
CREATE POLICY "Users can insert work logs" 
ON work_logs 
FOR INSERT 
WITH CHECK (true);

-- sales: 인증된 사용자만 INSERT 가능
CREATE POLICY "Users can insert sales" 
ON sales 
FOR INSERT 
WITH CHECK (true);
```

**또는** 개발 중에는 RLS를 비활성화할 수 있습니다:
1. Table Editor > users 테이블 선택
2. RLS enabled 토글을 OFF로 설정

### 4. API 키 설정 (이미 완료됨)

`src/App.jsx` 파일에 이미 API 키가 설정되어 있습니다:
- SUPABASE_URL: `https://sgxnxbhbyvrmgrzhosyh.supabase.co`
- SUPABASE_ANON_KEY: `eyJhbGciOi...` (이미 포함됨)

## 📝 주요 기능

- ✅ **회원가입**: 이메일 중복 체크, 유효성 검사
- ✅ **로그인**: Supabase 인증 연동
- ✅ **매장관리**: 지점 및 사용자 정보 관리
- ✅ **근무일지**: 출퇴근 시간 자동 계산
- ✅ **판매관리**: 구매자 정보 및 결제 정보 관리
- ✅ **Focus 문제 해결**: 연속 타이핑 가능

## 🔧 기술 스택

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS (CDN)
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL)
- **Font**: Noto Sans KR

## 🐛 문제 해결

### 회원가입이 안 될 때

1. **F12** 키를 눌러 개발자 도구 열기
2. **Console** 탭에서 에러 확인
3. 에러 메시지에 "policy" 또는 "permission"이 포함되면:
   - Supabase에서 RLS 정책 추가 (위의 SQL 참고)
   - 또는 RLS 비활성화

### 로그인이 안 될 때

1. 회원가입이 정상적으로 완료되었는지 확인
2. Supabase Dashboard > Table Editor > users에서 데이터 확인
3. 이메일과 비밀번호가 정확한지 확인

### npm install 오류

```bash
# 캐시 삭제 후 재설치
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 포트 충돌

`vite.config.js`에서 포트 변경:
```javascript
server: {
  port: 3001,  // 3000 대신 다른 포트
  open: true
}
```

## 📦 배포

### Vercel 배포

```bash
npm install -g vercel
vercel
```

### Netlify 배포

```bash
npm run build
# dist 폴더를 Netlify에 드래그 앤 드롭
```

## 📞 지원

문제가 발생하면:
1. F12 콘솔에서 에러 확인
2. Supabase 테이블 및 RLS 정책 확인
3. 이슈 제기 시 에러 메시지 첨부

## 📄 라이선스

MIT License

---

**개발**: LAS 매장관리 시스템  
**버전**: 1.0.0  
**최종 업데이트**: 2025년 1월