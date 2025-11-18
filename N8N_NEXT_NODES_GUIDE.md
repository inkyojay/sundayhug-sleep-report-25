# n8n 다음 노드 설정 가이드

## ✅ 현재 완료된 노드

1. ✅ Tally Trigger
2. ✅ HTTP Request (분석 API) - `/api/analyze-from-url`

---

## 📋 다음 노드 설정

### 3단계: Code 노드 (analysisId 추출)

**목적**: 분석 API 응답에서 `analysisId` 추출

**노드 추가:**
- 노드 타입: `Code`
- 노드 이름: `Extract analysisId`

**코드:**
```javascript
// 이전 노드(HTTP Request)에서 응답 받기
const response = $input.first().json;

// analysisId 추출
const analysisId = response.analysisId || response.data?.analysisId;

if (!analysisId) {
  throw new Error('analysisId를 찾을 수 없습니다. 응답: ' + JSON.stringify(response));
}

console.log('✅ analysisId 추출:', analysisId);

return {
  json: {
    analysisId: analysisId,
    // 원본 응답도 함께 전달 (나중에 필요할 수 있음)
    originalResponse: response
  }
};
```

**설정:**
- Mode: `Run Once for All Items` (기본값)

---

### 4단계: HTTP Request (슬라이드 조회)

**목적**: 생성된 슬라이드 URL 배열 가져오기

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

### 5단계: Code 노드 (URL 배열 → 개별 아이템)

**목적**: 슬라이드 URL 배열을 개별 아이템으로 변환

**노드 추가:**
- 노드 타입: `Code`
- 노드 이름: `Convert URLs to Items`

**코드:**
```javascript
// 이전 노드(HTTP Request)에서 응답 받기
const response = $input.first().json;

// 응답 검증
if (!response.success || !response.data || !response.data.slides) {
  throw new Error('슬라이드 데이터를 찾을 수 없습니다. 응답: ' + JSON.stringify(response));
}

const slidesData = response.data;
const slideUrls = slidesData.slides; // URL 배열

console.log(`📊 슬라이드 개수: ${slideUrls.length}`);
console.log(`📸 인스타그램 ID: ${slidesData.instagramId}`);
console.log(`🆔 분석 ID: ${slidesData.analysisId}`);

// 각 URL을 개별 아이템으로 변환
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

console.log(`✅ ${items.length}개의 아이템 생성 완료`);

return items;
```

**설정:**
- Mode: `Run Once for All Items` (기본값)

**출력:**
- 각 슬라이드 URL이 개별 아이템으로 변환됨
- 각 아이템에 `slideUrl`, `slideIndex`, `totalSlides` 등 포함

---

### 6단계: Loop Over Items

**목적**: 각 슬라이드를 개별적으로 처리

**노드 추가:**
- 노드 타입: `Loop Over Items`
- 노드 이름: `Loop Slides`

**설정:**
- 기본 설정 사용 (추가 설정 불필요)

**동작:**
- 이전 노드에서 생성된 각 아이템을 하나씩 처리
- 다음 노드가 각 슬라이드마다 실행됨

---

### 7단계: HTTP Request (이미지 다운로드)

**목적**: Storage URL에서 이미지 다운로드 (View/Download 가능하게)

**노드 추가:**
- 노드 타입: `HTTP Request`
- 노드 이름: `Download Slide Image`

**설정:**

**Parameters 탭:**
- Method: `GET`
- URL: `{{ $json.slideUrl }}`
- Authentication: `None`
- Send Body: `Off`

**Settings 탭:**
- Response Format: `File` 또는 `Binary` ← **중요!**

**설정 확인:**
- Response Format이 `File` 또는 `Binary`로 설정되어 있어야 View/Download 버튼이 작동합니다!

**출력:**
- 각 슬라이드 이미지가 바이너리 데이터로 다운로드됨
- n8n에서 View 버튼으로 이미지 확인 가능
- Download 버튼으로 파일 다운로드 가능

---

## ✅ 완성된 워크플로우 구조

```
1. Tally Trigger
   ↓
2. HTTP Request (분석 API)
   - POST /api/analyze-from-url
   ↓
3. Code 노드 (analysisId 추출)
   - Extract analysisId
   ↓
4. HTTP Request (슬라이드 조회)
   - GET /api/analysis/{analysisId}/slides
   ↓
5. Code 노드 (URL 배열 → 개별 아이템)
   - Convert URLs to Items
   ↓
6. Loop Over Items
   - Loop Slides
   ↓
7. HTTP Request (이미지 다운로드)
   - GET {slideUrl}
   - Response Format: File
   ↓
8. 다음 노드 (Instagram DM 전송 등)
```

---

## 🧪 테스트 방법

1. **각 노드 실행**
   - 노드를 하나씩 실행해서 출력 확인

2. **3단계 확인**
   - `analysisId`가 올바르게 추출되는지 확인

3. **4단계 확인**
   - 슬라이드 URL 배열이 반환되는지 확인
   - `isUrlArray: true` 확인

4. **5단계 확인**
   - 개별 아이템이 생성되는지 확인
   - 각 아이템에 `slideUrl`이 있는지 확인

5. **7단계 확인**
   - View 버튼 클릭 → 이미지 확인
   - Download 버튼 클릭 → 파일 다운로드

---

## 🐛 문제 해결

### 문제 1: analysisId를 찾을 수 없음

**확인:**
- 2단계 HTTP Request의 응답 확인
- `analysisId` 필드가 있는지 확인

**해결:**
- 응답 구조에 맞게 코드 수정
- `response.analysisId` 또는 `response.data.analysisId` 확인

### 문제 2: 슬라이드가 없음

**확인:**
- 슬라이드가 생성되었는지 확인
- 슬라이드 생성 API를 먼저 호출해야 할 수도 있음

**해결:**
- 슬라이드 생성 API 호출 추가:
  ```
  POST /api/analysis/{analysisId}/generate-slides
  ```

### 문제 3: View/Download 작동 안 함

**확인:**
- 7단계 HTTP Request의 Response Format 확인
- `File` 또는 `Binary`로 설정되어 있는지 확인

**해결:**
- Response Format을 `File` 또는 `Binary`로 변경

---

## 📝 참고

- 각 노드의 출력을 확인하면서 진행하세요
- 에러가 발생하면 해당 노드의 입력/출력을 확인하세요
- `N8N_STORAGE_URL_GUIDE.md` 파일도 참고하세요

---

위 순서대로 노드를 추가하고 설정하세요! 문제가 있으면 알려주세요. 🚀

