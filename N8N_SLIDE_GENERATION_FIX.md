# 슬라이드 생성 단계 추가 가이드

## 🔴 문제

**에러 메시지:**
```
슬라이드가 아직 생성되지 않았습니다.
```

**원인:**
- `/api/analyze-from-url` API는 이미지를 분석하고 저장하지만, 슬라이드를 자동으로 생성하지 않습니다.
- 슬라이드를 조회하기 전에 먼저 슬라이드를 생성해야 합니다.

---

## ✅ 해결 방법: 슬라이드 생성 단계 추가

### 수정된 워크플로우 구조

```
1. Tally Trigger ✅
   ↓
2. HTTP Request (분석 API) ✅
   - POST /api/analyze-from-url
   ↓
3. Code 노드 (analysisId 추출) ✅
   ↓
4. HTTP Request (슬라이드 생성) ← **새로 추가!**
   - POST /api/analysis/{analysisId}/generate-slides
   ↓
5. HTTP Request (슬라이드 조회) ← 기존 4단계
   - GET /api/analysis/{analysisId}/slides
   ↓
6. Code 노드 (URL → 개별 아이템)
   ↓
7. Loop Over Items
   ↓
8. HTTP Request (이미지 다운로드)
```

---

## 📋 4단계: HTTP Request (슬라이드 생성) - 새로 추가

**노드 추가:**
- 노드 타입: `HTTP Request`
- 노드 이름: `Generate Slides`

**설정:**

**Parameters 탭:**
- Method: `POST`
- URL: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{{ $json.analysisId }}/generate-slides`
- Authentication: `None`
- Send Body: `Off`

**Settings 탭:**
- Response Format: `JSON`

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "analysisId": "...",
    "slideCount": 5,
    "message": "슬라이드가 성공적으로 생성되었습니다."
  }
}
```

**설명:**
- 이 API는 분석 결과를 기반으로 슬라이드를 생성합니다.
- 슬라이드를 Storage에 업로드하고 URL을 저장합니다.
- 약 10-30초 정도 소요될 수 있습니다.

---

## 📋 5단계: HTTP Request (슬라이드 조회) - 기존 4단계

**노드 추가:**
- 노드 타입: `HTTP Request`
- 노드 이름: `Get Slides`

**설정:**

**Parameters 탭:**
- Method: `GET`
- URL: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{{ $json.analysisId }}/slides`
- Authentication: `None`
- Send Body: `Off`

**Settings 탭:**
- Response Format: `JSON`

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "analysisId": "...",
    "slides": [
      "https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/sleep-analysis/slides/.../slide-1.png",
      "https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/sleep-analysis/slides/.../slide-2.png"
    ],
    "slideCount": 5,
    "isUrlArray": true
  }
}
```

---

## 📋 6단계: Code 노드 (URL → 개별 아이템) - 기존 5단계

**노드 추가:**
- 노드 타입: `Code`
- 노드 이름: `Convert URLs to Items`

**코드:**
```javascript
const response = $input.first().json;

if (!response.success || !response.data || !response.data.slides) {
  throw new Error('슬라이드 데이터를 찾을 수 없습니다.');
}

const slidesData = response.data;
const slideUrls = slidesData.slides;

const items = slideUrls.map((url, index) => {
  return {
    json: {
      slideUrl: url,
      slideIndex: index + 1,
      totalSlides: slideUrls.length,
      instagramId: slidesData.instagramId || null,
      analysisId: slidesData.analysisId || null,
      phoneNumber: slidesData.phoneNumber || null
    }
  };
});

return items;
```

---

## 📋 7단계: Loop Over Items - 기존 6단계

**노드 추가:**
- 노드 타입: `Loop Over Items`
- 노드 이름: `Loop Slides`

---

## 📋 8단계: HTTP Request (이미지 다운로드) - 기존 7단계

**노드 추가:**
- 노드 타입: `HTTP Request`
- 노드 이름: `Download Slide Image`

**설정:**
- Method: `GET`
- URL: `{{ $json.slideUrl }}`
- Response Format: `File` 또는 `Binary` ← **중요!**

---

## ⚠️ 주의사항

### 슬라이드 생성 시간

- 슬라이드 생성은 약 10-30초 정도 소요될 수 있습니다.
- n8n에서 타임아웃이 발생할 수 있으므로, HTTP Request 노드의 타임아웃 설정을 확인하세요.

### 타임아웃 설정 (필요시)

**HTTP Request 노드 (슬라이드 생성) Settings:**
- Options → Timeout: `60000` (60초) 또는 더 길게 설정

---

## 🧪 테스트 순서

1. **3단계 실행**
   - `analysisId` 추출 확인

2. **4단계 실행** (새로 추가)
   - 슬라이드 생성 API 호출
   - `slideCount` 확인
   - 약 10-30초 대기

3. **5단계 실행**
   - 슬라이드 조회 API 호출
   - URL 배열 확인

4. **나머지 단계 실행**
   - 6단계: URL → 개별 아이템
   - 7단계: Loop Over Items
   - 8단계: 이미지 다운로드

---

## ✅ 완성된 워크플로우

```
1. Tally Trigger
   ↓
2. HTTP Request (분석 API)
   - POST /api/analyze-from-url
   ↓
3. Code 노드 (analysisId 추출)
   ↓
4. HTTP Request (슬라이드 생성) ← 추가!
   - POST /api/analysis/{analysisId}/generate-slides
   ↓
5. HTTP Request (슬라이드 조회)
   - GET /api/analysis/{analysisId}/slides
   ↓
6. Code 노드 (URL → 개별 아이템)
   ↓
7. Loop Over Items
   ↓
8. HTTP Request (이미지 다운로드)
   - GET {slideUrl}
   - Response Format: File
```

---

**중요**: 4단계(슬라이드 생성)를 추가한 후, 기존 4단계는 5단계가 됩니다. 순서를 맞춰주세요!

이제 슬라이드가 생성된 후 조회할 수 있습니다! 🚀

