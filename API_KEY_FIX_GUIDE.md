# 🔐 API 키 유출 문제 해결 가이드

## 🚨 문제 상황

**에러 메시지:**
```
"Your API key was reported as leaked. Please use another API key."
에러 코드: 403
```

**원인:**
- API 키가 GitHub 저장소의 문서 파일에 하드코딩되어 공개됨
- Google이 이를 감지하여 키를 차단함

---

## ✅ 해결 방법

### 1단계: 새 Gemini API 키 생성

1. **Google AI Studio 접속**
   - https://makersuite.google.com/app/apikey 접속
   - 또는 https://aistudio.google.com/app/apikey

2. **새 API 키 생성**
   - **Create API Key** 클릭
   - 프로젝트 선택 (또는 새로 생성)
   - API 키 복사 (한 번만 표시되므로 반드시 복사!)

3. **기존 API 키 삭제 (선택사항)**
   - 유출된 키는 더 이상 사용할 수 없으므로 삭제 권장

---

### 2단계: Railway 환경 변수 업데이트

1. **Railway 대시보드 접속**
   - https://railway.app 접속
   - 프로젝트 선택: `sundayhug-sleep-report-25-production`

2. **환경 변수 수정**
   - **Variables** 탭 클릭
   - `GEMINI_API_KEY` 찾기
   - **Edit** 클릭 (또는 삭제 후 새로 생성)
   - 새 API 키 입력 (앞뒤 공백, 따옴표 없이!)
   - **Save** 클릭

3. **자동 재배포 대기**
   - Railway가 자동으로 재배포합니다 (1-2분 소요)
   - 배포 완료 후 테스트

---

### 3단계: GitHub에 변경사항 푸시

문서에서 API 키를 제거했으므로, 변경사항을 푸시하세요:

```bash
git add .
git commit -m "fix: 문서에서 API 키 제거 및 마스킹"
git push
```

---

## 🔒 보안 주의사항

### ✅ 해야 할 것
- ✅ API 키는 **환경 변수**로만 관리
- ✅ `.env` 파일은 `.gitignore`에 포함 (이미 설정됨)
- ✅ 문서에는 플레이스홀더만 사용 (`YOUR_NEW_GEMINI_API_KEY`)

### ❌ 하지 말아야 할 것
- ❌ 코드에 API 키 하드코딩
- ❌ 문서에 실제 API 키 작성
- ❌ GitHub에 `.env` 파일 커밋
- ❌ 공개 채팅/포럼에 API 키 공유

---

## 📋 확인 사항

### Railway 로그 확인

배포 후 Railway 로그에서 다음을 확인:

1. **서버 시작 로그:**
   ```
   🔑 API 키 상태: {
     hasGEMINI_API_KEY: true,
     apiKeyLength: 39,
     apiKeyPrefix: 'AIzaSy...'
   }
   ```

2. **헬스 체크:**
   ```
   GET /api/health
   {
     "geminiConfigured": true
   }
   ```

3. **분석 API 테스트:**
   - n8n에서 다시 테스트
   - 에러가 발생하지 않아야 함

---

## 🎯 다음 단계

1. ✅ 새 API 키 생성
2. ✅ Railway 환경 변수 업데이트
3. ✅ GitHub에 변경사항 푸시
4. ✅ Railway 재배포 완료 대기
5. ✅ n8n에서 API 테스트

---

## 💡 참고사항

- API 키는 **절대** 공개 저장소에 커밋하지 마세요
- 문서에는 항상 플레이스홀더를 사용하세요
- 환경 변수는 Railway 대시보드에서만 관리하세요
- API 키가 유출되면 즉시 삭제하고 새로 생성하세요

