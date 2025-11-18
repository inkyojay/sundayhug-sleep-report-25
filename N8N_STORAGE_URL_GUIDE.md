# n8n에서 Supabase Storage URL 사용 가이드

## 🎯 변경 사항

이제 슬라이드가 **Supabase Storage에 업로드**되고, **공개 URL 배열**로 반환됩니다.  
n8n에서 이 URL들을 사용해서 이미지를 다운로드하고 View/Download 할 수 있습니다.

---

## 📋 API 응답 형식

### GET `/api/analysis/:id/slides` 응답

```json
{
  "success": true,
  "data": {
    "analysisId": "849d6cf3-e346-4ce2-97ce-9a66c875605e",
    "slides": [
      "https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/sleep-analysis/slides/849d6cf3.../slide-1.png",
      "https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/sleep-analysis/slides/849d6cf3.../slide-2.png",
      "https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/sleep-analysis/slides/849d6cf3.../slide-3.png"
    ],
    "slideUrls": [
      "https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/sleep-analysis/slides/849d6cf3.../slide-1.png",
      ...
    ],
    "slideCount": 5,
    "instagramId": "@sundayhug",
    "phoneNumber": "010-1234-5678",
    "createdAt": "2024-01-15T10:30:00Z",
    "isUrlArray": true
  }
}
```

---

## 🔧 n8n 워크플로우 설정

### 방법 1: Loop Over Items 사용 (권장)

```
1. HTTP Request (슬라이드 조회)
   - GET /api/analysis/{{ $json.analysisId }}/slides
   ↓
2. Code 노드 (URL 배열 추출 및 변환)
   ↓
3. Loop Over Items
   ↓
4. HTTP Request (이미지 다운로드)
   - URL: {{ $json.slideUrl }}
   - Response Format: File
   ↓
5. 다음 노드 (DM 전송 등)
```

### Code 노드 코드 (2단계)

```javascript
// 이전 노드에서 응답 받기
const response = $input.first().json;

// 응답 검증
if (!response.success || !response.data || !response.data.slides) {
  throw new Error('슬라이드 데이터를 찾을 수 없습니다.');
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

### HTTP Request 노드 설정 (4단계)

**Method**: `GET`  
**URL**: `{{ $json.slideUrl }}`  
**Response Format**: `File` 또는 `Binary`

---

## 🎨 방법 2: Split Out 사용

```
1. HTTP Request (슬라이드 조회)
   ↓
2. Split Out
   - Fields To Split Out: `data.slides`
   ↓
3. Code 노드 (URL을 바이너리로 변환)
   ↓
4. HTTP Request (이미지 다운로드)
```

### Code 노드 코드 (3단계)

```javascript
// Split Out 후 구조: { json: { "data.slides": "https://..." } }
const slideUrl = item.json['data.slides'] || item.json.slideUrl || item.json;

if (!slideUrl || typeof slideUrl !== 'string' || !slideUrl.startsWith('http')) {
  throw new Error('유효한 슬라이드 URL이 없습니다.');
}

console.log(`📥 슬라이드 다운로드: ${slideUrl}`);

// n8n의 내장 fetch 사용
const response = await fetch(slideUrl);

if (!response.ok) {
  throw new Error(`이미지 다운로드 실패: ${response.status} ${response.statusText}`);
}

// 바이너리 데이터 가져오기
const arrayBuffer = await response.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

console.log(`✅ 슬라이드 다운로드 완료 (${buffer.length} bytes)`);

// 원본 응답에서 추가 데이터 가져오기
const originalResponse = item.json.originalResponse || {};
const slidesData = originalResponse.data || {};

return {
  json: {
    slideIndex: item.json.slideIndex || null,
    totalSlides: slidesData.slideCount || null,
    instagramId: slidesData.instagramId || null,
    analysisId: slidesData.analysisId || null,
    phoneNumber: slidesData.phoneNumber || null
  },
  binary: {
    data: {
      data: buffer,
      mimeType: 'image/png',
      fileName: `slide-${item.json.slideIndex || 'unknown'}.png`
    }
  }
};
```

---

## ✅ 장점

1. **View/Download 작동**: n8n에서 URL을 통해 이미지를 다운로드하면 View/Download 버튼이 정상 작동합니다.
2. **효율적**: Base64 변환 불필요, 직접 URL 사용
3. **안정적**: Storage에서 직접 다운로드하므로 데이터 손실 없음
4. **빠름**: Base64 인코딩/디코딩 과정 없음

---

## 🔍 테스트 방법

### 1. 슬라이드 조회 API 테스트

```bash
curl https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{analysisId}/slides
```

응답에서 `data.slides` 배열이 URL인지 확인:
- ✅ URL: `https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/...`
- ❌ Base64: `iVBORw0KGgoAAAANSUhEUgAA...` (긴 문자열)

### 2. n8n에서 테스트

1. **HTTP Request 노드** 실행 → 슬라이드 조회
2. **Code 노드** 실행 → URL 배열 확인
3. **Loop Over Items** 실행 → 각 URL 처리
4. **HTTP Request 노드** (이미지 다운로드) 실행
5. **View 버튼** 클릭 → 이미지 확인
6. **Download 버튼** 클릭 → 파일 다운로드

---

## ⚠️ 주의사항

1. **Storage 버킷 설정**: Supabase Dashboard에서 `sleep-analysis` 버킷이 **공개(Public)**로 설정되어 있어야 합니다.
2. **CORS 설정**: n8n에서 Storage URL에 접근할 수 있도록 CORS가 설정되어 있어야 합니다.
3. **하위 호환성**: 기존 Base64 데이터도 여전히 지원하지만, 새로 생성되는 슬라이드는 모두 URL입니다.

---

## 🚀 다음 단계

1. Supabase Dashboard에서 Storage 버킷 생성 및 공개 설정
2. n8n 워크플로우 업데이트
3. 테스트 실행
4. Instagram DM 전송 등 다음 단계 진행

---

위 설정으로 n8n에서 슬라이드를 정상적으로 View/Download 할 수 있습니다! 🎉

