# 배포 가이드

## 개요

이 가이드는 아기 수면 환경 AI 분석기 앱을 배포하는 방법을 설명합니다.

## 필수 요구사항

- Node.js 20.x 이상
- npm 또는 yarn
- Supabase 프로젝트 (이미 설정됨)
- Gemini API 키

## 환경 변수 설정

### 로컬 개발 환경

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Gemini API
GEMINI_API_KEY=AIzaSyCFsqf1907hg8yTxyw-RcDp2dseHnuJawg

# Supabase (선택사항 - 기본값이 설정되어 있음)
VITE_SUPABASE_URL=https://ugzwgegkvxcczwiottej.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnendnZWdrdnhjY3p3aW90dGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTI2NzAsImV4cCI6MjA3NzI4ODY3MH0._ezV2r8kAvjIlovx6U_L0XzW9nWtSR0MY-RpMISPK38
```

### 프로덕션 환경

배포 플랫폼에 따라 환경 변수를 설정하세요.

## 배포 옵션

### 1. Vercel 배포 (권장)

Vercel은 React 앱 배포에 최적화되어 있습니다.

#### 단계별 가이드

1. **Vercel 계정 생성 및 프로젝트 연결**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

2. **환경 변수 설정**
   - Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
   - 다음 변수 추가:
     - `GEMINI_API_KEY`
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

3. **배포**
   ```bash
   vercel --prod
   ```

#### vercel.json 설정 (선택사항)

프로젝트 루트에 `vercel.json` 파일 생성:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

### 2. Netlify 배포

Netlify도 React 앱 배포에 적합합니다.

#### 단계별 가이드

1. **Netlify 계정 생성 및 프로젝트 연결**
   - GitHub/GitLab/Bitbucket 저장소 연결
   - 또는 Netlify CLI 사용:
     ```bash
     npm i -g netlify-cli
     netlify login
     netlify init
     ```

2. **환경 변수 설정**
   - Netlify 대시보드 → Site settings → Environment variables
   - 다음 변수 추가:
     - `GEMINI_API_KEY`
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

3. **빌드 설정**
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **배포**
   ```bash
   netlify deploy --prod
   ```

#### netlify.toml 설정 (선택사항)

프로젝트 루트에 `netlify.toml` 파일 생성:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### 3. GitHub Pages 배포

GitHub Pages는 무료이지만 설정이 조금 더 복잡합니다.

#### 단계별 가이드

1. **vite.config.ts 수정**
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/', // GitHub 저장소 이름
     // ... 나머지 설정
   });
   ```

2. **GitHub Actions 워크플로우 생성**
   
   `.github/workflows/deploy.yml` 파일 생성:

   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '20'
         
         - name: Install dependencies
           run: npm ci
         
         - name: Build
           env:
             GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
             VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
             VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
           run: npm run build
         
         - name: Deploy
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

3. **GitHub Secrets 설정**
   - 저장소 → Settings → Secrets and variables → Actions
   - 다음 Secrets 추가:
     - `GEMINI_API_KEY`
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

---

### 4. Docker 배포

Docker를 사용하여 자체 서버에 배포할 수 있습니다.

#### Dockerfile 생성

프로젝트 루트에 `Dockerfile` 생성:

```dockerfile
# 빌드 단계
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 프로덕션 단계
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf 생성

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 빌드 및 실행

```bash
docker build -t sleep-analyze-app .
docker run -p 80:80 \
  -e GEMINI_API_KEY=your_key \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  sleep-analyze-app
```

---

## 빌드 최적화

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 빌드 최적화 확인

```bash
npm run preview
```

로컬에서 프로덕션 빌드를 테스트할 수 있습니다.

---

## CORS 설정

Supabase Edge Functions는 CORS를 지원하지만, 필요시 추가 설정이 가능합니다.

---

## 모니터링 및 로깅

### Supabase 로그 확인

```bash
# Supabase CLI 사용
supabase functions logs sleep-analysis-api
```

또는 Supabase 대시보드에서 확인:
- Edge Functions → sleep-analysis-api → Logs

### 애플리케이션 로그

프로덕션 환경에서는 다음을 고려하세요:
- Sentry (에러 추적)
- LogRocket (사용자 세션 기록)
- Google Analytics (사용량 분석)

---

## 트러블슈팅

### 빌드 오류

1. **환경 변수 누락**
   - 모든 필수 환경 변수가 설정되었는지 확인

2. **의존성 오류**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript 오류**
   ```bash
   npm run build
   # 오류 메시지 확인 및 수정
   ```

### 런타임 오류

1. **API 키 오류**
   - 환경 변수가 올바르게 설정되었는지 확인
   - 브라우저 콘솔에서 에러 확인

2. **Supabase 연결 오류**
   - 네트워크 연결 확인
   - Supabase 프로젝트 상태 확인

---

## 보안 고려사항

1. **API 키 보호**
   - 절대 클라이언트 코드에 하드코딩하지 마세요
   - 환경 변수 사용
   - Vercel/Netlify Secrets 사용

2. **RLS (Row Level Security)**
   - 필요시 Supabase RLS 정책 수정
   - 현재는 모든 사용자가 읽기/쓰기 가능

3. **이미지 저장**
   - Base64 이미지는 데이터베이스에 저장되지만
   - 대용량 이미지는 Supabase Storage 사용 권장

---

## 다음 단계

1. ✅ Supabase 데이터베이스 스키마 생성
2. ✅ Supabase 클라이언트 연동
3. ✅ 분석 결과 저장 로직 추가
4. ✅ API 엔드포인트 생성
5. ✅ 배포 준비 완료
6. 🔄 실제 배포 실행
7. 🔄 n8n 워크플로우 설정
8. 🔄 모니터링 설정

---

## 지원

문제가 발생하거나 질문이 있으시면 프로젝트 이슈를 생성해주세요.

