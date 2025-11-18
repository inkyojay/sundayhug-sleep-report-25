# Railway 에러 디버깅 가이드

## 🔍 현재 상황
- 로컬 테스트: 실패
- GitHub 배포: 완료
- Railway 배포: 진행 중

---

## 📋 Railway 로그 확인 방법

### 1단계: Railway 대시보드 접속
1. https://railway.app 접속
2. 프로젝트 선택: `sundayhug-sleep-report-25-production`

### 2단계: 로그 확인
1. **Deployments** 탭 클릭
2. 최신 배포 클릭
3. **View Logs** 클릭 (또는 오른쪽 상단의 로그 아이콘)

### 3단계: 확인할 로그 내용

#### ✅ 정상 작동 시 나타나는 로그:
```
🔑 API 키 상태: {
  hasGEMINI_API_KEY: true,
  hasAPI_KEY: false,
  apiKeyLength: 39,
  apiKeyPrefix: 'AIzaSyCFsq...'
}
✅ Server running at http://0.0.0.0:3000/
```

#### ❌ 문제 발생 시 나타나는 로그:

**케이스 1: API 키가 없을 때**
```
🔑 API 키 상태: {
  hasGEMINI_API_KEY: false,
  hasAPI_KEY: false,
  apiKeyLength: 0,
  apiKeyPrefix: '없음'
}
⚠️  GEMINI_API_KEY가 설정되지 않았습니다.
```

**케이스 2: Gemini API 호출 실패 시**
```
📥 이미지 URL 분석 요청 받음
  - API 키 상태: { hasApiKey: true, apiKeyLength: 39 }
❌ Error analyzing image with Gemini: [에러 객체]
📋 Error details: {
  message: "...",
  code: "...",
  status: 401 또는 403
}
🚨 API 키 인증 실패 - API 키 상태: {
  hasApiKey: true,
  apiKeyLength: 39,
  apiKeyPrefix: 'AIzaSyCFsqf1907h...'
}
```

---

## 🔧 문제 해결 방법

### 문제 1: API 키가 설정되지 않음

**증상:**
- 로그에 `apiKeyLength: 0` 표시
- `⚠️  GEMINI_API_KEY가 설정되지 않았습니다.` 경고

**해결:**
1. Railway 프로젝트 → **Variables** 탭
2. **New Variable** 클릭
3. 다음 입력:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `AIzaSyCFsqf1907hg8yTxyw-RcDp2dseHnuJawg`
4. **Add** 클릭
5. 서버 자동 재배포 대기 (1-2분)

---

### 문제 2: API 키는 있지만 인증 실패

**증상:**
- 로그에 `apiKeyLength: 39` 표시 (정상)
- 하지만 Gemini API 호출 시 `401` 또는 `403` 에러

**가능한 원인:**
1. **API 키가 잘못됨**
   - Railway Variables에서 API 키 값 확인
   - 앞뒤 공백이나 따옴표가 있는지 확인
   - API 키가 만료되었거나 비활성화됨

2. **API 키 권한 문제**
   - Google Cloud Console에서 API 키 권한 확인
   - Gemini API가 활성화되어 있는지 확인

**해결:**
1. Railway Variables에서 `GEMINI_API_KEY` 값 확인
2. 값이 올바른지 확인 (앞뒤 공백 제거)
3. Google Cloud Console에서 API 키 상태 확인
4. 필요시 새 API 키 생성 및 Railway에 업데이트

---

### 문제 3: 이미지 다운로드 실패

**증상:**
- 로그에 `이미지 다운로드 실패: 403` 또는 `404` 표시

**원인:**
- Tally 이미지 URL의 access token이 만료됨
- 이미지 URL이 유효하지 않음

**해결:**
- Tally에서 새로 이미지를 업로드하여 테스트
- 또는 이미지 URL이 유효한지 확인

---

## 📊 로그에서 확인할 핵심 정보

배포 후 Railway 로그에서 다음 정보를 확인하세요:

1. **서버 시작 로그**
   ```
   🔑 API 키 상태: {...}
   ✅ Server running at http://0.0.0.0:3000/
   ```

2. **API 요청 로그** (n8n에서 호출 시)
   ```
   📥 이미지 URL 분석 요청 받음
   ```

3. **에러 로그** (문제 발생 시)
   ```
   ❌ Error analyzing image with Gemini: ...
   📋 Error details: {...}
   🔍 에러 분석: {...}
   ```

---

## 🚀 다음 단계

1. **Railway 로그 확인**
   - 위의 로그 내용을 확인하여 문제 원인 파악

2. **문제 해결**
   - 위의 해결 방법에 따라 수정

3. **재테스트**
   - n8n에서 다시 API 호출 테스트

4. **로그 공유**
   - 문제가 계속되면 Railway 로그 전체를 공유해주세요

---

## 💡 참고사항

- Railway는 환경 변수를 변경하면 자동으로 재배포합니다
- 배포 완료까지 1-2분 소요됩니다
- 로그는 실시간으로 업데이트됩니다
- 로그를 보려면 배포가 완료된 후 확인하세요

