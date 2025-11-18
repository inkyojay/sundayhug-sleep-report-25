# Railway 환경 변수 설정 가이드

## 🔴 문제: API 키 인증 실패

에러 메시지: "API 키 인증에 실패했습니다. 서버 설정을 확인해주세요."

이 에러는 Railway에 Gemini API 키가 설정되지 않았거나 잘못 설정되었을 때 발생합니다.

---

## 🔧 해결 방법

### 1단계: Railway 환경 변수 확인

1. **Railway 대시보드 접속**
   - https://railway.app 접속
   - 프로젝트 선택: `sundayhug-sleep-report-25-production`

2. **환경 변수 확인**
   - 프로젝트 설정 → Variables 탭
   - 다음 환경 변수들이 설정되어 있는지 확인:
     - `GEMINI_API_KEY` (또는 `API_KEY`)
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

### 2단계: GEMINI_API_KEY 설정

**환경 변수가 없는 경우:**

1. Railway 프로젝트 → Variables 탭
2. **New Variable** 클릭
3. 다음 정보 입력:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `AIzaSyCFsqf1907hg8yTxyw-RcDp2dseHnuJawg` (실제 API 키)
4. **Add** 클릭

**환경 변수가 있는 경우:**

1. Variables 탭에서 `GEMINI_API_KEY` 확인
2. 값이 올바른지 확인
3. 잘못되었다면 **Edit** 클릭하여 수정

### 3단계: 서버 재배포

환경 변수를 추가/수정한 후:

1. **Deployments** 탭으로 이동
2. **Redeploy** 클릭 (또는 자동 재배포 대기)
3. 배포 완료 대기 (1-2분)

---

## 📋 필수 환경 변수 목록

Railway에 다음 환경 변수들이 모두 설정되어 있어야 합니다:

| 변수 이름 | 설명 | 예시 값 |
|---------|------|---------|
| `GEMINI_API_KEY` | Google Gemini API 키 | `AIzaSyCFsqf1907hg8yTxyw-RcDp2dseHnuJawg` |
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | `https://ugzwgegkvxcczwiottej.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

---

## 🔍 확인 방법

### 방법 1: Railway 로그 확인

1. Railway 프로젝트 → **Deployments** 탭
2. 최신 배포 클릭
3. **View Logs** 클릭
4. 다음 메시지 확인:
   - ✅ 정상: 로그에 에러 없음
   - ❌ 문제: `⚠️ GEMINI_API_KEY가 설정되지 않았습니다` 메시지

### 방법 2: 헬스 체크 API 호출

n8n 또는 브라우저에서:

```
GET https://sundayhug-sleep-report-25-production.up.railway.app/api/health
```

**예상 응답**:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "geminiConfigured": true  ← 이게 true여야 함!
}
```

만약 `geminiConfigured: false`라면 API 키가 설정되지 않은 것입니다.

---

## ⚠️ 주의사항

1. **API 키 보안**
   - API 키를 GitHub에 커밋하지 마세요
   - `.env.local` 파일은 `.gitignore`에 포함되어 있어야 합니다

2. **환경 변수 이름**
   - 서버 코드는 `GEMINI_API_KEY` 또는 `API_KEY`를 확인합니다
   - Railway에서는 `GEMINI_API_KEY`를 사용하는 것을 권장합니다

3. **재배포 필요**
   - 환경 변수를 추가/수정한 후 서버를 재배포해야 합니다
   - Railway는 자동으로 재배포하지만, 수동으로 **Redeploy**를 클릭할 수도 있습니다

---

## 🚀 다음 단계

1. **Railway 환경 변수 확인 및 설정**
2. **서버 재배포**
3. **헬스 체크 API로 확인**
4. **n8n에서 다시 테스트**

환경 변수를 설정한 후 서버가 재배포되면 정상 작동할 것입니다!

