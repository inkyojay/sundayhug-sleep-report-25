# n8n 워크플로우 다음 단계 가이드

## ✅ 현재 완료된 단계

1. ✅ Tally Trigger - 폼 제출 감지
2. ✅ 이미지 분석 API 호출 (`/api/analyze-from-url`)
3. ✅ 분석 결과 반환 및 Supabase 저장

---

## 📋 다음 단계

### 1단계: analysisId 확인

n8n에서 분석 API 응답을 확인하세요:

**예상 응답 구조:**
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
  "analysisId": "uuid-here"  ← 이게 중요!
}
```

**확인 방법:**
- HTTP Request 노드의 Output 확인
- `analysisId` 필드가 있는지 확인

---

### 2단계: 슬라이드 생성 (선택사항)

현재 `/api/analyze-from-url`는 슬라이드를 생성하지 않습니다 (`report_slides: null`).

**옵션 A: 슬라이드 없이 진행**
- 분석 결과만 인스타그램 DM으로 전송
- 텍스트 메시지로 분석 결과 전송

**옵션 B: 슬라이드 생성 API 추가 (권장)**
- 서버에 슬라이드 생성 엔드포인트 추가 필요
- 또는 프론트엔드에서 슬라이드 생성 후 업데이트

---

### 3단계: 슬라이드 조회 (슬라이드가 있는 경우)

슬라이드가 생성되어 있다면:

**HTTP Request 노드 설정:**
- **Method**: `GET`
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{{ $json.analysisId }}/slides`
- **Response Format**: `JSON`

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "analysisId": "uuid",
    "slides": ["base64...", "base64..."],
    "slideCount": 2,
    "instagramId": "2222",
    "phoneNumber": "+821051555837"
  }
}
```

---

### 4단계: 슬라이드 변환 (Code 노드)

**Code 노드 코드:**
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
      analysisId: slidesData.analysisId
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

### 5단계: 인스타그램 DM 전송

**방법 1: n8n Instagram 노드 사용**
- Instagram 노드 추가
- DM 전송 설정
- 바이너리 데이터 첨부

**방법 2: Instagram API 직접 호출**
- HTTP Request 노드로 Instagram Graph API 호출
- 메시지와 이미지 첨부

---

## 🔧 현재 워크플로우 구조

```
1. Tally Trigger
   ↓
2. HTTP Request (분석 API)
   - POST /api/analyze-from-url
   - Output: { success, data, analysisId }
   ↓
3. Code 노드 (analysisId 추출) ← 필요!
   - Input: 분석 API 응답
   - Output: { analysisId, instagramId, ... }
   ↓
4. HTTP Request (슬라이드 조회) ← 슬라이드가 있는 경우만
   - GET /api/analysis/{analysisId}/slides
   ↓
5. Code 노드 (슬라이드 변환)
   - Base64 → 바이너리 변환
   ↓
6. Loop Over Items
   ↓
7. Instagram DM 전송
```

---

## ⚠️ 중요 사항

### 슬라이드가 없는 경우

현재 `/api/analyze-from-url`는 슬라이드를 생성하지 않습니다. 

**해결 방법:**
1. **텍스트 메시지만 전송**
   - 분석 결과를 텍스트로 포맷팅
   - 인스타그램 DM으로 전송

2. **슬라이드 생성 API 추가**
   - 서버에 슬라이드 생성 엔드포인트 추가
   - 분석 후 자동으로 슬라이드 생성

---

## 📝 다음 작업

1. **analysisId 확인**
   - n8n에서 분석 API 응답 확인
   - `analysisId` 필드 확인

2. **슬라이드 생성 여부 결정**
   - 슬라이드가 필요하면 서버에 엔드포인트 추가
   - 슬라이드가 필요 없으면 텍스트 메시지만 전송

3. **인스타그램 DM 전송 설정**
   - n8n Instagram 노드 설정
   - 또는 Instagram API 직접 호출

---

## 💡 추천 워크플로우

**간단한 버전 (슬라이드 없이):**
```
Tally → 분석 API → 텍스트 포맷팅 → Instagram DM
```

**완전한 버전 (슬라이드 포함):**
```
Tally → 분석 API → 슬라이드 생성 → 슬라이드 조회 → 변환 → Instagram DM
```

어떤 방식으로 진행하시겠어요?

