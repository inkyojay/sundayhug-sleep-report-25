# n8n 슬라이드 생성 및 조회 가이드

## ✅ 완료된 기능

1. ✅ 분석 API (`/api/analyze-from-url`) - 자동으로 슬라이드 생성
2. ✅ 슬라이드 생성 API (`/api/analysis/:id/generate-slides`) - 별도 슬라이드 생성
3. ✅ 슬라이드 조회 API (`/api/analysis/:id/slides`) - 슬라이드 조회

---

## 📋 워크플로우 구조

### 옵션 1: 자동 슬라이드 생성 (권장)

```
1. Tally Trigger
   ↓
2. HTTP Request (분석 API)
   - POST /api/analyze-from-url
   - Body: { imageUrl, birthDate, phoneNumber, instagramId }
   - Output: { success, data, analysisId }
   ↓
3. Code 노드 (analysisId 추출)
   - Input: 분석 API 응답
   - Output: { analysisId, instagramId, ... }
   ↓
4. HTTP Request (슬라이드 조회)
   - GET /api/analysis/{{ $json.analysisId }}/slides
   - Output: { success, data: { slides: [...], instagramId, ... } }
   ↓
5. Code 노드 (슬라이드 변환)
   - Base64 배열 → 바이너리 배열 변환
   ↓
6. Loop Over Items
   ↓
7. 다음 노드 (DM 전송 등)
```

### 옵션 2: 별도 슬라이드 생성

슬라이드가 생성되지 않은 경우:

```
1. HTTP Request (분석 API)
   - POST /api/analyze-from-url
   ↓
2. Code 노드 (analysisId 추출)
   ↓
3. HTTP Request (슬라이드 생성)
   - POST /api/analysis/{{ $json.analysisId }}/generate-slides
   - Output: { success, data: { slideCount, ... } }
   ↓
4. HTTP Request (슬라이드 조회)
   - GET /api/analysis/{{ $json.analysisId }}/slides
   ↓
5. Code 노드 (슬라이드 변환)
   ↓
6. Loop Over Items
```

---

## 🔧 각 노드 설정

### 1. HTTP Request - 분석 API

**Method**: `POST`  
**URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze-from-url`

**Body (JSON)**:
```json
{
  "imageUrl": "{{ $json.question_4rR8Rk }}",
  "birthDate": "{{ $json.question_VJaPlj }}",
  "phoneNumber": "{{ $json.question_PON9E1 }}",
  "instagramId": "{{ $json.question_EWGl1l }}"
}
```

**Response Format**: `JSON`

**예상 응답**:
```json
{
  "success": true,
  "data": {
    "summary": "...",
    "feedbackItems": [...],
    "references": [...],
    "phoneNumber": "+821051555837",
    "instagramId": "2222"
  },
  "analysisId": "uuid-here"
}
```

---

### 2. Code 노드 - analysisId 추출

**코드**:
```javascript
const item = $input.first();
const analysisId = item.json.data?.analysisId || item.json.analysisId;

if (!analysisId) {
  throw new Error('analysisId를 찾을 수 없습니다.');
}

return {
  json: {
    ...item.json,
    analysisId: analysisId
  }
};
```

---

### 3. HTTP Request - 슬라이드 조회

**Method**: `GET`  
**URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{{ $json.analysisId }}/slides`

**Response Format**: `JSON`

**예상 응답**:
```json
{
  "success": true,
  "data": {
    "analysisId": "uuid",
    "slides": ["base64...", "base64..."],
    "slideCount": 5,
    "instagramId": "2222",
    "phoneNumber": "+821051555837"
  }
}
```

---

### 4. Code 노드 - 슬라이드 변환

**코드**:
```javascript
const response = $input.first().json;

if (!response.success || !response.data || !response.data.slides) {
  throw new Error('슬라이드 데이터를 찾을 수 없습니다.');
}

const slidesData = response.data;
const slides = slidesData.slides;

const items = slides.map((base64String, index) => {
  const buffer = Buffer.from(base64String, 'base64');
  
  return {
    json: {
      slideIndex: index + 1,
      totalSlides: slides.length,
      instagramId: slidesData.instagramId,
      analysisId: slidesData.analysisId,
      fileName: `수면분석리포트_${index + 1}.png`
    },
    binary: {
      data: {
        data: buffer,
        mimeType: 'image/png',
        fileName: `수면분석리포트_${index + 1}.png`
      }
    }
  };
});

return items;
```

---

### 5. (선택) HTTP Request - 슬라이드 생성

슬라이드가 없는 경우에만 사용:

**Method**: `POST`  
**URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{{ $json.analysisId }}/generate-slides`

**Response Format**: `JSON`

**예상 응답**:
```json
{
  "success": true,
  "data": {
    "analysisId": "uuid",
    "slideCount": 5,
    "message": "슬라이드가 성공적으로 생성되었습니다."
  }
}
```

---

## ⚠️ 중요 사항

### 슬라이드 생성 시간

- 슬라이드 생성은 약 5-10초 소요될 수 있습니다
- 많은 피드백 항목이 있으면 더 오래 걸릴 수 있습니다

### 에러 처리

슬라이드가 없는 경우:
- `GET /api/analysis/:id/slides`는 `404` 에러 반환
- 이 경우 `POST /api/analysis/:id/generate-slides`를 호출하여 슬라이드 생성

### 슬라이드 개수

슬라이드는 다음으로 구성됩니다:
1. 인트로 슬라이드 (1개)
2. 분석 이미지 슬라이드 (1개)
3. 종합 요약 슬라이드 (1개)
4. 피드백 항목 슬라이드 (피드백 항목 수 / 2, 올림)

예: 피드백 항목이 4개면 → 총 5개 슬라이드 (1+1+1+2)

---

## 🎯 다음 단계

슬라이드 변환 후:
1. **Loop Over Items** 노드로 각 슬라이드 처리
2. **Instagram DM** 노드로 전송 (사용자가 직접 구성)
3. 또는 다른 전송 방법 사용

---

## 📝 테스트 방법

1. **분석 API 테스트**
   - Tally 폼 제출
   - 분석 API 응답 확인
   - `analysisId` 확인

2. **슬라이드 조회 테스트**
   - `GET /api/analysis/{analysisId}/slides` 호출
   - 슬라이드 개수 확인

3. **슬라이드 변환 테스트**
   - Code 노드에서 바이너리 데이터 확인
   - 이미지가 올바르게 변환되었는지 확인

---

## 💡 팁

- 슬라이드는 자동으로 생성되므로, 대부분의 경우 슬라이드 조회만 하면 됩니다
- 슬라이드 생성이 실패해도 분석 결과는 저장되므로, 나중에 다시 생성할 수 있습니다
- 슬라이드는 Base64 문자열 배열로 저장되므로, 조회 후 바이너리로 변환해야 합니다

