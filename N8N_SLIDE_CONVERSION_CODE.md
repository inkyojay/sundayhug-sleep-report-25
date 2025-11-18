# 슬라이드 변환 Code 노드 코드

## 📋 Code 노드 설정

**노드 이름**: "슬라이드 변환"  
**이전 노드**: HTTP Request (슬라이드 조회)

---

## 🔧 코드 (복사해서 사용)

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

if (!response.data) {
  throw new Error('응답에 data가 없습니다.');
}

if (!response.data.slides) {
  throw new Error('응답에 slides 배열이 없습니다.');
}

const slidesData = response.data;
const slides = slidesData.slides;

// 2. slides 배열 검증
if (!Array.isArray(slides)) {
  throw new Error('slides가 배열이 아닙니다. 타입: ' + typeof slides);
}

if (slides.length === 0) {
  throw new Error('slides 배열이 비어있습니다.');
}

console.log(`📊 슬라이드 개수: ${slides.length}`);

// 3. 각 슬라이드를 변환
const items = [];

for (let index = 0; index < slides.length; index++) {
  const base64String = slides[index];
  
  try {
    console.log(`\n처리 중: 슬라이드 ${index + 1}/${slides.length}`);
    
    // Base64 문자열 검증
    if (!base64String) {
      throw new Error(`슬라이드 ${index + 1}의 Base64 데이터가 없습니다.`);
    }
    
    if (typeof base64String !== 'string') {
      throw new Error(`슬라이드 ${index + 1}의 Base64 데이터가 문자열이 아닙니다. 타입: ${typeof base64String}`);
    }
    
    if (base64String.length < 100) {
      throw new Error(`슬라이드 ${index + 1}의 Base64 데이터가 너무 짧습니다. 길이: ${base64String.length}`);
    }
    
    console.log(`- Base64 길이: ${base64String.length} 문자`);
    
    // Base64 문자열을 Buffer로 변환
    let buffer;
    try {
      buffer = Buffer.from(base64String, 'base64');
    } catch (bufferError) {
      throw new Error(`Buffer 변환 실패: ${bufferError.message}`);
    }
    
    console.log(`- Buffer 길이: ${buffer.length} bytes`);
    
    if (buffer.length === 0) {
      throw new Error(`슬라이드 ${index + 1}의 Buffer가 비어있습니다.`);
    }
    
    // n8n 바이너리 형식으로 반환
    const item = {
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
          data: buffer,           // Buffer 객체 (이미지 데이터)
          mimeType: 'image/png',  // MIME 타입
          fileName: `수면분석리포트_${index + 1}.png`
        }
      }
    };
    
    items.push(item);
    console.log(`✅ 슬라이드 ${index + 1} 변환 완료`);
    
  } catch (error) {
    console.error(`❌ 슬라이드 ${index + 1} 변환 실패:`, error.message);
    throw new Error(`슬라이드 ${index + 1} 변환 실패: ${error.message}`);
  }
}

console.log(`\n✅ 총 ${items.length}개의 슬라이드 아이템 생성 완료`);

// 배열 반환 → n8n이 자동으로 각 아이템 처리
return items;
```

---

## ✅ 확인 사항

### 1. 이전 노드 확인
- HTTP Request (슬라이드 조회) 노드가 성공했는지 확인
- Output에서 `success: true` 확인
- `data.slides` 배열이 있는지 확인

### 2. Code 노드 실행
- Execute step 클릭
- Console 로그 확인:
  - `📊 슬라이드 개수: 5`
  - `✅ 슬라이드 1 변환 완료`
  - `✅ 총 5개의 슬라이드 아이템 생성 완료`

### 3. Output 확인
- Output에서 "5 items" 확인
- 각 아이템 클릭하여 확인:
  - `json.slideIndex`: 1, 2, 3, 4, 5
  - `json.fileName`: 수면분석리포트_1.png 등
  - "Binary" 탭에 바이너리 데이터 확인

### 4. View/Download 테스트
- 각 아이템의 View 버튼 클릭 → 이미지가 보여야 함
- Download 버튼 클릭 → PNG 파일이 다운로드되어야 함

---

## 🚨 문제 해결

### 문제: "슬라이드 데이터를 찾을 수 없습니다"
**원인**: 이전 노드(슬라이드 조회)의 응답 구조가 다름

**해결**: 이전 노드의 Output 확인 후 코드 수정:
```javascript
// 응답 구조가 다르면 이렇게 수정
const slides = response.data?.slides || response.slides || [];
```

### 문제: "Buffer 변환 실패"
**원인**: Base64 문자열이 유효하지 않음

**해결**: Base64 문자열 확인:
```javascript
console.log('첫 번째 Base64 앞 100자:', base64String.substring(0, 100));
```

### 문제: 바이너리 데이터가 안 보임
**원인**: 바이너리 형식이 잘못됨

**해결**: 위 코드의 바이너리 형식 사용:
```javascript
binary: {
  data: {
    data: buffer,
    mimeType: 'image/png',
    fileName: 'filename.png'
  }
}
```

---

위 코드를 그대로 복사해서 사용하세요!

