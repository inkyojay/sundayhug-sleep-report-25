# Railway API 키 인증 문제 해결 가이드

## 🔴 문제: 헬스 체크는 되는데 분석만 실패

URL은 올바른데 "API 키 인증에 실패했습니다" 에러가 발생합니다.

---

## 🔍 문제 진단

### 1단계: Railway 로그 확인

1. **Railway 대시보드 접속**
   - https://railway.app
   - 프로젝트: `sundayhug-sleep-report-25-production`

2. **로그 확인**
   - **Deployments** 탭 → 최신 배포 클릭
   - **View Logs** 클릭
   - 다음 메시지 확인:
     - `⚠️ GEMINI_API_KEY가 설정되지 않았습니다` → 환경 변수 미설정
     - `API key authentication failed` → Gemini API 키 문제
     - 기타 에러 메시지

### 2단계: 환경 변수 재확인

1. **Variables 탭 확인**
   - `GEMINI_API_KEY`가 있는지 확인
   - 값이 올바른지 확인: `AIzaSyCFsqf1907hg8yTxyw-RcDp2dseHnuJawg`

2. **환경 변수가 있다면**
   - **Edit** 클릭하여 값 확인
   - 앞뒤 공백이 없는지 확인
   - 따옴표가 포함되지 않았는지 확인

### 3단계: 서버 재배포

환경 변수를 수정했다면:

1. **Deployments** 탭
2. **Redeploy** 클릭
3. 배포 완료 대기 (1-2분)

---

## 🔧 추가 확인 사항

### 확인 1: 헬스 체크 응답 확인

n8n에서 헬스 체크 API 호출:

**HTTP Request 노드**:
- Method: `GET`
- URL: `https://sundayhug-sleep-report-25-production.up.railway.app/api/health`

**응답 확인**:
```json
{
  "success": true,
  "message": "API is running",
  "geminiConfigured": true  ← 이게 false면 문제!
}
```

만약 `geminiConfigured: false`라면:
- Railway에 `GEMINI_API_KEY`가 설정되지 않았거나
- 서버가 재배포되지 않았습니다

### 확인 2: 서버 코드 로그 확인

서버가 시작될 때 다음 로그가 나와야 합니다:
- ✅ 정상: 로그에 경고 없음
- ❌ 문제: `⚠️ GEMINI_API_KEY가 설정되지 않았습니다`

---

## 🚀 해결 방법

### 방법 1: 환경 변수 재설정

1. Railway → Variables 탭
2. `GEMINI_API_KEY` 삭제 (있다면)
3. **New Variable** 클릭
4. Key: `GEMINI_API_KEY`
5. Value: `AIzaSyCFsqf1907hg8yTxyw-RcDp2dseHnuJawg`
6. **Add** 클릭
7. **Redeploy** 클릭

### 방법 2: 서버 재배포

환경 변수가 올바르게 설정되어 있다면:

1. **Deployments** 탭
2. **Redeploy** 클릭
3. 배포 완료 대기
4. 다시 테스트

### 방법 3: API 키 확인

Gemini API 키가 유효한지 확인:

1. Google AI Studio (https://makersuite.google.com/app/apikey) 접속
2. API 키가 활성화되어 있는지 확인
3. 필요시 새 API 키 생성

---

## 📋 체크리스트

- [ ] Railway 로그에서 에러 메시지 확인
- [ ] `GEMINI_API_KEY` 환경 변수가 설정되어 있는지 확인
- [ ] 환경 변수 값이 올바른지 확인 (공백, 따옴표 없음)
- [ ] 서버 재배포 완료
- [ ] 헬스 체크에서 `geminiConfigured: true` 확인
- [ ] 분석 API 다시 테스트

---

## 🔍 디버깅

### Railway 로그에서 확인할 내용

1. **서버 시작 시**:
   ```
   ✅ Server running at http://0.0.0.0:3000/
   ```
   이 메시지가 있으면 서버는 정상 시작됨

2. **API 키 관련**:
   ```
   ⚠️ GEMINI_API_KEY가 설정되지 않았습니다
   ```
   이 메시지가 있으면 환경 변수 미설정

3. **Gemini API 호출 시**:
   ```
   API key authentication failed
   ```
   이 메시지가 있으면 API 키가 잘못되었거나 만료됨

---

## 💡 추가 팁

### 환경 변수 이름 확인

서버 코드는 다음 순서로 확인합니다:
1. `GEMINI_API_KEY`
2. `API_KEY`

둘 중 하나만 설정하면 됩니다. `GEMINI_API_KEY`를 권장합니다.

### 환경 변수 값 형식

- ✅ 올바름: `AIzaSyCFsqf1907hg8yTxyw-RcDp2dseHnuJawg`
- ❌ 잘못됨: `"AIzaSyCFsqf1907hg8yTxyw-RcDp2dseHnuJawg"` (따옴표 포함)
- ❌ 잘못됨: ` AIzaSyCFsqf1907hg8yTxyw-RcDp2dseHnuJawg ` (공백 포함)

---

먼저 Railway 로그를 확인하여 정확한 에러 메시지를 확인하세요. 로그 내용을 알려주시면 더 정확한 해결책을 제시하겠습니다!

