# n8n 슬라이드 조회 및 변환 Code 노드

## 🎯 목적
서버에서 슬라이드를 조회하고, n8n에서 사용할 수 있는 바이너리 데이터로 변환

---

## 📋 워크플로우 구조

```
1. HTTP Request (슬라이드 조회)
   - GET /api/analysis/{analysisId}/slides
   ↓
2. Code 노드 (슬라이드 변환)
   ↓
3. Loop Over Items (각 슬라이드 처리)
   ↓
4. Instagram/이메일/기타 전송
```

---

## 🔧 Code 노드 코드

### 버전 1: 슬라이드를 개별 아이템으로 변환

```javascript
// 이전 노드에서 슬라이드 데이터 받기
const response = $input.first().json;

if (!response.success || !response.data || !response.data.slides) {
  throw new Error('슬라이드 데이터를 찾을 수 없습니다.');
}

const slidesData = response.data;
const slides = slidesData.slides;
const instagramId = slidesData.instagramId;
const analysisId = slidesData.analysisId;

console.log(`슬라이드 개수: ${slides.length}`);
console.log(`인스타그램 ID: ${instagramId}`);
console.log(`분석 ID: ${analysisId}`);

// 각 슬라이드를 개별 아이템으로 변환
const items = slides.map((base64String, index) => {
  try {
    // Base64 문자열을 Buffer로 변환
    const buffer = Buffer.from(base64String, 'base64');
    
    console.log(`슬라이드 ${index + 1}/${slides.length} 변환 완료 (${buffer.length} bytes)`);
    
    return {
      json: {
        slideIndex: index + 1,
        totalSlides: slides.length,
        instagramId: instagramId,
        analysisId: analysisId,
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
  } catch (error) {
    console.error(`슬라이드 ${index + 1} 변환 실패:`, error.message);
    throw new Error(`슬라이드 ${index + 1} 변환 실패: ${error.message}`);
  }
});

console.log(`✅ 총 ${items.length}개의 슬라이드 아이템 생성 완료`);

return items;
```

---

### 버전 2: 슬라이드를 단일 배열로 유지 (Loop Over Items 사용)

```javascript
// 이전 노드에서 슬라이드 데이터 받기
const response = $input.first().json;

if (!response.success || !response.data || !response.data.slides) {
  throw new Error('슬라이드 데이터를 찾을 수 없습니다.');
}

const slidesData = response.data;

// 슬라이드 배열을 그대로 전달 (Loop Over Items에서 처리)
return {
  json: {
    slides: slidesData.slides,  // Base64 문자열 배열
    slideCount: slidesData.slides.length,
    instagramId: slidesData.instagramId,
    analysisId: slidesData.analysisId,
    phoneNumber: slidesData.phoneNumber
  }
};
```

그 다음 **Loop Over Items** 노드에서 각 슬라이드를 처리:

**Loop Over Items 노드 내부 Code 노드**:
```javascript
// 현재 슬라이드 처리
const currentSlide = $input.item.json.slides[$input.item.json.slideIndex - 1];
const base64String = currentSlide;

// Base64를 Buffer로 변환
const buffer = Buffer.from(base64String, 'base64');

return {
  json: {
    slideIndex: $input.item.json.slideIndex,
    totalSlides: $input.item.json.slideCount,
    instagramId: $input.item.json.instagramId,
    analysisId: $input.item.json.analysisId
  },
  binary: {
    data: {
      data: buffer,
      mimeType: 'image/png',
      fileName: `수면분석리포트_${$input.item.json.slideIndex}.png`
    }
  }
};
```

---

## 📝 사용 예시

### 예시 1: 슬라이드를 이메일로 전송

**워크플로우**:
```
1. HTTP Request (슬라이드 조회)
   ↓
2. Code 노드 (버전 1 사용)
   ↓
3. Loop Over Items
   ↓
4. Gmail 노드 (각 슬라이드를 첨부파일로 전송)
```

**Gmail 노드 설정**:
- **To**: `{{ $json.instagramId }}@gmail.com` (또는 실제 이메일 주소)
- **Subject**: "아기 수면 환경 분석 리포트"
- **Attachments**: Binary 데이터 사용

---

### 예시 2: 슬라이드를 ZIP 파일로 묶어서 전송

**Code 노드** (ZIP 생성):
```javascript
const JSZip = require('jszip');
const zip = new JSZip();

// 이전 노드에서 슬라이드 데이터 받기
const response = $input.first().json.data;
const slides = response.slides;

// 각 슬라이드를 ZIP에 추가
for (let i = 0; i < slides.length; i++) {
  const buffer = Buffer.from(slides[i], 'base64');
  zip.file(`수면분석리포트_${i + 1}.png`, buffer);
}

// ZIP 파일 생성
const zipBuffer = await zip.generateAsync({ 
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 }
});

console.log(`ZIP 파일 생성 완료: ${zipBuffer.length} bytes`);

return {
  json: {
    instagramId: response.instagramId,
    analysisId: response.analysisId,
    fileName: '수면분석리포트.zip'
  },
  binary: {
    data: {
      data: zipBuffer,
      mimeType: 'application/zip',
      fileName: '수면분석리포트.zip'
    }
  }
};
```

**주의**: n8n에서 JSZip을 사용하려면 `n8n-nodes-base` 패키지가 필요할 수 있습니다. 또는 서버에 ZIP 생성 API를 추가하는 것이 더 나을 수 있습니다.

---

## 🔍 디버깅

### 슬라이드 데이터 확인

```javascript
const response = $input.first().json;

console.log('=== 슬라이드 데이터 확인 ===');
console.log('Success:', response.success);
console.log('Data:', JSON.stringify(response.data, null, 2));
console.log('슬라이드 개수:', response.data?.slides?.length || 0);
console.log('첫 번째 슬라이드 길이:', response.data?.slides?.[0]?.length || 0);
console.log('인스타그램 ID:', response.data?.instagramId);

return response;
```

---

## ✅ 체크리스트

- [ ] 슬라이드 조회 API가 정상 작동하는지 확인
- [ ] Code 노드에서 Base64 → Buffer 변환이 올바른지 확인
- [ ] 바이너리 데이터가 올바르게 생성되는지 확인
- [ ] Loop Over Items가 각 슬라이드를 올바르게 처리하는지 확인
- [ ] 전송 방법 (Instagram/이메일/기타) 설정

---

## 🚀 다음 단계

1. **서버 배포**: 슬라이드 조회 API 배포
2. **n8n 테스트**: 슬라이드 조회 및 변환 테스트
3. **전송 방법 선택**: Instagram DM, 이메일, 또는 다른 방법
4. **전체 워크플로우 구성**: 분석 → 슬라이드 조회 → 전송

어떤 전송 방법을 사용하시겠습니까?

