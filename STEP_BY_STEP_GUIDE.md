# 단계별 실행 가이드

## 📋 전체 작업 흐름

1. ✅ 환경 변수 설정
2. ✅ 로컬 개발 서버 실행 및 테스트
3. ✅ 배포 준비
4. ✅ 실제 배포
5. ✅ n8n 연동 설정

---

## 1단계: 환경 변수 설정

### 현재 상태 확인
`.env.local` 파일이 이미 존재합니다. 다음 내용을 확인하고 수정하세요.

### 해야 할 일

1. **Gemini API 키 확인**
   - Google AI Studio (https://aistudio.google.com/) 접속
   - API 키 생성 또는 기존 키 확인
   - `.env.local` 파일의 `GEMINI_API_KEY` 값을 실제 키로 변경

2. **Supabase 환경 변수 추가**
   - `.env.local` 파일에 다음 두 줄 추가:

```env
VITE_SUPABASE_URL=https://ugzwgegkvxcczwiottej.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnendnZWdrdnhjY3p3aW90dGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTI2NzAsImV4cCI6MjA3NzI4ODY3MH0._ezV2r8kAvjIlovx6U_L0XzW9nWtSR0MY-RpMISPK38
```

### 최종 `.env.local` 파일 모습

```env
GEMINI_API_KEY=여기에_실제_Gemini_API_키_입력
VITE_SUPABASE_URL=https://ugzwgegkvxcczwiottej.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnendnZWdrdnhjY3p3aW90dGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTI2NzAsImV4cCI6MjA3NzI4ODY3MH0._ezV2r8kAvjIlovx6U_L0XzW9nWtSR0MY-RpMISPK38
```

**⚠️ 중요**: 
- `.env.local` 파일은 절대 Git에 커밋하지 마세요 (이미 .gitignore에 포함되어 있어야 함)
- 실제 API 키는 공개하지 마세요

---

## 2단계: 로컬 개발 서버 실행 및 테스트

### 해야 할 일

1. **의존성 설치 확인**
   ```bash
   npm install
   ```
   (이미 설치되어 있다면 생략 가능)

2. **개발 서버 실행**
   ```bash
   npm run dev
   ```

3. **브라우저에서 확인**
   - 터미널에 표시된 URL로 접속 (보통 `http://localhost:3000`)
   - 앱이 정상적으로 로드되는지 확인

4. **기능 테스트**
   - ✅ 이미지 업로드 (드래그 앤 드롭 또는 클릭)
   - ✅ 아기 생년월일 입력
   - ✅ "수면 환경 분석하기" 버튼 클릭
   - ✅ 분석 결과 표시 확인
   - ✅ "데이터 저장 완료" 메시지 확인 (Supabase 저장 확인)
   - ✅ "리포트 다운로드" 버튼으로 PDF 생성 확인

### 예상 결과

- 분석이 완료되면 이미지에 핀(번호)이 표시됨
- 오른쪽에 분석 리포트가 표시됨
- "✓ 데이터 저장 완료 (ID: ...)" 메시지가 나타남
- Supabase 데이터베이스에 데이터가 저장됨

### 문제 해결

**문제**: "분석은 완료되었지만 데이터 저장에 실패했습니다"
- **원인**: Supabase 환경 변수가 잘못되었거나 네트워크 문제
- **해결**: `.env.local` 파일의 Supabase 변수 확인

**문제**: "AI 분석에 실패했습니다"
- **원인**: Gemini API 키가 잘못되었거나 할당량 초과
- **해결**: Google AI Studio에서 API 키 확인 및 할당량 확인

---

## 3단계: 배포 준비

### 배포 전 체크리스트

- [ ] 로컬에서 정상 작동 확인
- [ ] `.env.local` 파일의 모든 환경 변수 확인
- [ ] `npm run build` 명령어로 빌드 테스트
- [ ] 빌드된 파일이 `dist` 폴더에 생성되는지 확인

### 빌드 테스트

```bash
npm run build
```

빌드가 성공하면 `dist` 폴더가 생성됩니다.

```bash
npm run preview
```

프로덕션 빌드를 로컬에서 미리 볼 수 있습니다.

---

## 4단계: 실제 배포

### 옵션 A: Vercel 배포 (가장 쉬움, 권장)

#### 1. Vercel 계정 생성
- https://vercel.com 접속
- GitHub 계정으로 로그인

#### 2. 프로젝트 배포
- Vercel 대시보드 → "Add New Project"
- GitHub 저장소 선택 (또는 로컬 폴더 업로드)
- 프로젝트 설정:
  - **Framework Preset**: Vite
  - **Root Directory**: ./
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`

#### 3. 환경 변수 설정
Vercel 대시보드 → 프로젝트 → Settings → Environment Variables에서:
- `GEMINI_API_KEY` = 실제 Gemini API 키
- `VITE_SUPABASE_URL` = `https://ugzwgegkvxcczwiottej.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = Supabase Anon Key

#### 4. 배포 완료
- "Deploy" 버튼 클릭
- 배포 완료 후 제공되는 URL로 접속하여 테스트

---

### 옵션 B: Netlify 배포

#### 1. Netlify 계정 생성
- https://netlify.com 접속
- GitHub 계정으로 로그인

#### 2. 프로젝트 배포
- "Add new site" → "Import an existing project"
- GitHub 저장소 선택
- 빌드 설정:
  - **Build command**: `npm run build`
  - **Publish directory**: `dist`

#### 3. 환경 변수 설정
Netlify 대시보드 → Site settings → Environment variables에서 동일하게 설정

---

### 옵션 C: GitHub Pages 배포

자세한 내용은 `DEPLOYMENT_GUIDE.md` 파일 참고

---

## 5단계: n8n 연동 설정

### n8n이란?
n8n은 워크플로우 자동화 도구입니다. API를 호출하여 데이터를 가져오고, 처리하고, 다른 서비스로 전송할 수 있습니다.

### 해야 할 일

#### 1. n8n 설치 (로컬 또는 클라우드)
- **로컬**: `npx n8n` 또는 Docker 사용
- **클라우드**: https://n8n.io 에서 계정 생성

#### 2. HTTP Request 노드 생성
- n8n 워크플로우에서 "HTTP Request" 노드 추가
- 설정:
  - **Method**: GET
  - **URL**: `https://ugzwgegkvxcczwiottej.supabase.co/functions/v1/sleep-analysis-api/sleep-analyses`
  - **Authentication**: Header Auth
    - **Name**: `apikey`
    - **Value**: Supabase Anon Key
  - **Additional Header**:
    - **Name**: `Authorization`
    - **Value**: `Bearer [Supabase Anon Key]`

#### 3. 워크플로우 예시

**예시 1: 일일 분석 리포트 생성**
```
Schedule Trigger (매일 오전 9시)
  → HTTP Request (GET /sleep-analyses/stats)
  → Code (데이터 포맷팅)
  → Email (리포트 전송)
```

**예시 2: 고위험 분석 결과 알림**
```
Schedule Trigger (매 1시간)
  → HTTP Request (GET /sleep-analyses?limit=100)
  → Filter (risk_level = "High")
  → Slack (고위험 항목 알림)
```

### API 엔드포인트 목록

자세한 내용은 `API_DOCUMENTATION.md` 파일 참고:

1. **분석 결과 목록**: `GET /sleep-analyses`
2. **특정 분석 조회**: `GET /sleep-analyses/:id`
3. **통계 정보**: `GET /sleep-analyses/stats`

---

## 📝 체크리스트

### 개발 단계
- [ ] 1단계: 환경 변수 설정 완료
- [ ] 2단계: 로컬 테스트 완료
- [ ] 3단계: 빌드 테스트 완료

### 배포 단계
- [ ] 4단계: 배포 플랫폼 선택 (Vercel/Netlify/GitHub Pages)
- [ ] 4단계: 배포 완료 및 테스트

### 연동 단계
- [ ] 5단계: n8n 설치/접속
- [ ] 5단계: n8n 워크플로우 생성 및 테스트

---

## 🆘 문제 해결

### 환경 변수 관련
- `.env.local` 파일이 제대로 읽히지 않으면 서버 재시작
- Vite는 환경 변수 변경 시 서버 재시작 필요

### Supabase 관련
- Supabase 대시보드에서 테이블이 생성되었는지 확인
- RLS 정책이 올바르게 설정되었는지 확인

### API 관련
- Supabase Edge Function이 활성화되어 있는지 확인
- API 호출 시 CORS 오류가 발생하면 헤더 확인

---

## 📚 참고 문서

- `API_DOCUMENTATION.md`: API 사용 가이드
- `DEPLOYMENT_GUIDE.md`: 상세 배포 가이드
- `IMPLEMENTATION_SUMMARY.md`: 구현 요약

---

## 다음 단계

현재 **1단계**부터 시작하세요:
1. `.env.local` 파일 수정 (Gemini API 키 + Supabase 변수 추가)
2. `npm run dev` 실행
3. 브라우저에서 테스트

각 단계가 완료되면 다음 단계로 진행하세요!

