# n8n 워크플로우 설정 확인 및 수정

## 🔍 현재 설정 확인

**HTTP Request 노드 설정:**
- Method: `POST` ✅
- URL: `https://sundayhug-sleep-report-25-production.up.railway.app` ❌ **경로 누락!**
- Body: JSON ✅
- JSON 내용: 올바름 ✅

---

## ❌ 문제점

**URL에 API 경로가 빠져있습니다!**

현재:
```
https://sundayhug-sleep-report-25-production.up.railway.app
```

올바른 URL:
```
https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze-from-url
```

---

## ✅ 수정 방법

### HTTP Request 노드 (분석 API)

1. **URL 필드 수정**
   - 현재: `https://sundayhug-sleep-report-25-production.up.railway.app`
   - 수정: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze-from-url`

2. **나머지 설정 확인**
   - Method: `POST` ✅
   - Body Content Type: `JSON` ✅
   - JSON Body:
     ```json
     {
       "imageUrl": "{{ $json.question_4rR8Rk }}",
       "birthDate": "{{ $json.question_VJaPlj }}",
       "phoneNumber": "{{ $json.question_PON9E1 }}",
       "instagramId": "{{ $json.question_EWGl1l }}"
     }
     ```
     ✅ 올바름

---

## 📋 전체 워크플로우 확인

### 1. Tally Trigger
- ✅ Tally 폼 제출 시 트리거

### 2. HTTP Request (분석 API) ← **여기 수정 필요!**
- Method: `POST`
- URL: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze-from-url` ← **경로 추가!**
- Body: JSON
- JSON:
  ```json
  {
    "imageUrl": "{{ $json.question_4rR8Rk }}",
    "birthDate": "{{ $json.question_VJaPlj }}",
    "phoneNumber": "{{ $json.question_PON9E1 }}",
    "instagramId": "{{ $json.question_EWGl1l }}"
  }
  ```

### 3. Code 노드 (analysisId 추출)
```javascript
const response = $input.first().json;
return {
  json: {
    analysisId: response.analysisId || response.data?.analysisId
  }
};
```

### 4. HTTP Request (슬라이드 조회)
- Method: `GET`
- URL: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{{ $json.analysisId }}/slides`

### 5. Code 노드 (URL 배열 → 개별 아이템)
- `N8N_STORAGE_URL_GUIDE.md` 파일의 "방법 1" 참고

### 6. Loop Over Items

### 7. HTTP Request (이미지 다운로드)
- Method: `GET`
- URL: `{{ $json.slideUrl }}`
- Response Format: `File` 또는 `Binary`

---

## ✅ 수정 후 테스트

1. **URL 수정 완료**
2. **워크플로우 저장**
3. **Tally 폼 제출 또는 수동 실행**
4. **결과 확인:**
   - 분석 API 응답에서 `analysisId` 확인
   - Supabase Storage에서 이미지 확인
   - 슬라이드 URL 확인

---

URL 경로만 추가하면 됩니다! `/api/analyze-from-url`를 URL 끝에 추가해주세요.

