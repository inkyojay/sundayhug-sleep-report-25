# 슬라이드 변환 Code 노드 코드 (최종)

## ✅ 이전 노드 Output 구조 확인

```
upload
  success: true
  data
    analysisId: "849d6cf3-e346-4ce2-97ce-9a66c875605e"
    slides: [5개]
      slides[0]: "base64..."
      slides[1]: "base64..."
      ...
    slideCount: 5
    instagramId: "2222"
    phoneNumber: "+821051555837"
```

이 구조에 맞춘 코드입니다.

---

## 🔧 Code 노드 코드 (복사해서 사용)

```javascript
const response = $input.first().json;

console.log('=== 슬라이드 변환 시작 ===');
console.log('응답 구조:', {
  success: response.success,
  hasData: !!response.data,
  hasSlides: !!response.data?.slides,
  slideCount: response.data?.slides?.length
});

// 1. 응답 검증
if (!response.success) {
  throw new Error('슬라이드 조회 API가 실패했습니다.');
}

if (!response.data || !response.data.slides) {
  throw new Error('슬라이드 데이터를 찾을 수 없습니다.');
}

const slidesData = response.data;
const slides = slidesData.slides;

if (!Array.isArray(slides) || slides.length === 0) {
  throw new Error('slides 배열이 비어있거나 유효하지 않습니다.');
}

console.log(`📊 슬라이드 개수: ${slides.length}`);

// 2. 각 슬라이드를 변환
const items = [];

for (let index = 0; index < slides.length; index++) {
  const base64String = slides[index];
  
  try {
    console.log(`처리 중: 슬라이드 ${index + 1}/${slides.length}`);
    
    // Base64 문자열 검증
    if (!base64String || typeof base64String !== 'string' || base64String.length < 100) {
      throw new Error(`슬라이드 ${index + 1}의 Base64 데이터가 유효하지 않습니다.`);
    }
    
    // Base64 → Buffer 변환
    const buffer = Buffer.from(base64String, 'base64');
    
    if (buffer.length === 0) {
      throw new Error(`슬라이드 ${index + 1}의 Buffer가 비어있습니다.`);
    }
    
    console.log(`✅ 슬라이드 ${index + 1} 변환 완료 (${buffer.length} bytes)`);
    
    // n8n 바이너리 형식으로 반환
    items.push({
      json: {
        slideIndex: index + 1,
        totalSlides: slides.length,
        instagramId: slidesData.instagramId || null,
        analysisId: slidesData.analysisId || null,
        phoneNumber: slidesData.phoneNumber || null,
        fileName: `수면분석리포트_${index + 1}.png`
      },
      binary: {
        data: {
          data: buffer,
          mimeType: 'image/png',
          fileName: `수면분석리포트_${index + 1}.png`
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ 슬라이드 ${index + 1} 변환 실패:`, error.message);
    throw error;
  }
}

console.log(`✅ 총 ${items.length}개의 슬라이드 아이템 생성 완료`);

// 배열 반환 → n8n이 자동으로 각 아이템 처리
return items;
```

---

## ✅ 확인 사항

### 1. Code 노드 실행
- Execute step 클릭
- Console 로그 확인:
  - `📊 슬라이드 개수: 5`
  - `✅ 슬라이드 1 변환 완료`
  - `✅ 총 5개의 슬라이드 아이템 생성 완료`

### 2. Output 확인
- Output에서 "5 items" 확인
- 각 아이템 클릭:
  - `json.slideIndex`: 1, 2, 3, 4, 5
  - `json.instagramId`: "2222"
  - `json.analysisId`: "849d6cf3-e346-4ce2-97ce-9a66c875605e"
  - "Binary" 탭에 바이너리 데이터 확인

### 3. View/Download 테스트
- 각 아이템의 View 버튼 클릭 → 이미지가 보여야 함
- Download 버튼 클릭 → PNG 파일이 다운로드되어야 함

---

## 🎯 예상 결과

Code 노드 실행 후:
- **5개의 아이템** 생성됨
- 각 아이템에:
  - `json`: 슬라이드 정보 (slideIndex, instagramId 등)
  - `binary.data`: 이미지 데이터 (View/Download 가능)

---

위 코드를 그대로 복사해서 사용하세요! 문제가 있으면 알려주세요.

