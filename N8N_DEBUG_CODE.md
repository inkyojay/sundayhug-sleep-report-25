# n8n 디버깅 코드

## 🔍 문제 진단용 Code 노드

먼저 슬라이드 조회 API의 응답을 확인하세요:

### 1단계: 슬라이드 조회 응답 확인

**Code 노드 코드**:
```javascript
const response = $input.first().json;

console.log('=== 슬라이드 조회 응답 확인 ===');
console.log('전체 응답:', JSON.stringify(response, null, 2));
console.log('success:', response.success);
console.log('data 존재:', !!response.data);
console.log('slides 존재:', !!response.data?.slides);
console.log('slides 타입:', typeof response.data?.slides);
console.log('slides 배열인가:', Array.isArray(response.data?.slides));
console.log('slides 개수:', response.data?.slides?.length);

if (response.data?.slides && response.data.slides.length > 0) {
  const firstSlide = response.data.slides[0];
  console.log('첫 번째 슬라이드 타입:', typeof firstSlide);
  console.log('첫 번째 슬라이드 길이:', firstSlide?.length);
  console.log('첫 번째 슬라이드 앞 100자:', firstSlide?.substring(0, 100));
}

return {
  json: {
    debug: {
      success: response.success,
      hasData: !!response.data,
      hasSlides: !!response.data?.slides,
      slideCount: response.data?.slides?.length || 0,
      firstSlideLength: response.data?.slides?.[0]?.length || 0,
      firstSlidePreview: response.data?.slides?.[0]?.substring(0, 50) || '없음'
    },
    originalResponse: response
  }
};
```

이 코드를 실행하여 응답 구조를 확인하세요.

---

## 🔧 수정된 슬라이드 변환 코드

응답 구조를 확인한 후, 다음 코드를 사용하세요:

```javascript
const response = $input.first().json;

// 디버깅
console.log('=== 슬라이드 변환 시작 ===');
console.log('응답 구조:', {
  success: response.success,
  hasData: !!response.data,
  hasSlides: !!response.data?.slides,
  slideCount: response.data?.slides?.length
});

if (!response.success || !response.data || !response.data.slides) {
  console.error('❌ 슬라이드 데이터 없음');
  console.error('전체 응답:', JSON.stringify(response, null, 2));
  throw new Error('슬라이드 데이터를 찾을 수 없습니다. 응답: ' + JSON.stringify(response));
}

const slidesData = response.data;
const slides = slidesData.slides;

if (!Array.isArray(slides) || slides.length === 0) {
  throw new Error('슬라이드 배열이 비어있거나 유효하지 않습니다.');
}

console.log(`📊 슬라이드 개수: ${slides.length}`);

// 각 슬라이드를 개별 아이템으로 변환
const items = [];

for (let index = 0; index < slides.length; index++) {
  const base64String = slides[index];
  
  try {
    console.log(`\n처리 중: 슬라이드 ${index + 1}/${slides.length}`);
    console.log(`- Base64 타입: ${typeof base64String}`);
    console.log(`- Base64 길이: ${base64String?.length || 0}`);
    
    if (!base64String || typeof base64String !== 'string') {
      throw new Error(`슬라이드 ${index + 1}의 Base64 데이터가 유효하지 않습니다.`);
    }
    
    // Base64 문자열을 Buffer로 변환
    const buffer = Buffer.from(base64String, 'base64');
    
    console.log(`- Buffer 길이: ${buffer.length} bytes`);
    
    if (buffer.length === 0) {
      throw new Error(`슬라이드 ${index + 1}의 Buffer가 비어있습니다.`);
    }
    
    // n8n 바이너리 형식
    const item = {
      json: {
        slideIndex: index + 1,
        totalSlides: slides.length,
        instagramId: slidesData.instagramId || null,
        analysisId: slidesData.analysisId || null,
        phoneNumber: slidesData.phoneNumber || null,
        fileName: `수면분석리포트_${index + 1}.png`,
        bufferSize: buffer.length
      },
      binary: {
        data: buffer
      }
    };
    
    items.push(item);
    console.log(`✅ 슬라이드 ${index + 1} 변환 완료`);
    
  } catch (error) {
    console.error(`❌ 슬라이드 ${index + 1} 변환 실패:`, error.message);
    throw error;
  }
}

console.log(`\n✅ 총 ${items.length}개의 슬라이드 아이템 생성 완료`);

return items;
```

---

## 🎯 단계별 확인

### 1단계: 슬라이드 조회 API 확인

슬라이드 조회 HTTP Request 노드의 Output을 확인하세요:
- `success: true`인지 확인
- `data.slides` 배열이 있는지 확인
- `slides` 배열에 Base64 문자열이 있는지 확인

### 2단계: 디버깅 코드 실행

위의 "1단계: 슬라이드 조회 응답 확인" 코드를 실행하여 응답 구조를 확인하세요.

### 3단계: 슬라이드 변환

응답 구조를 확인한 후, "수정된 슬라이드 변환 코드"를 사용하세요.

---

## ⚠️ 가능한 문제들

### 문제 1: 슬라이드가 생성되지 않음

**증상**: `slides` 배열이 비어있거나 `null`

**해결**:
- Railway 로그에서 슬라이드 생성 로그 확인
- 슬라이드 생성 API를 별도로 호출: `POST /api/analysis/{analysisId}/generate-slides`

### 문제 2: Base64 데이터가 잘못된 형식

**증상**: Buffer 변환 실패

**해결**:
- Base64 문자열이 올바른 형식인지 확인
- `data:image/png;base64,` 같은 prefix가 있는지 확인 (있다면 제거 필요)

### 문제 3: n8n 바이너리 형식 문제

**증상**: 바이너리 데이터가 표시되지 않음

**해결**:
- 위의 수정된 코드 사용
- Buffer를 직접 반환하는 형식 사용

---

먼저 1단계 디버깅 코드를 실행하여 응답 구조를 확인해주세요!

