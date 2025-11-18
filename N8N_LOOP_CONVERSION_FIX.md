# n8n Loop Over Items 후 Base64 변환 수정

## 🚨 문제
- Split Out → Loop Over Items → Code 노드로 변환했는데 바이너리 데이터가 안 나옴

## 🔧 해결 방법

### Loop Over Items를 거친 후 데이터 구조

Loop Over Items를 거치면 각 아이템이 개별적으로 처리됩니다. 따라서 Code 노드에서 데이터를 올바르게 가져와야 합니다.

---

## 📋 수정된 Code 노드 코드

**Loop Over Items 다음 Code 노드**에 다음 코드를 사용하세요:

```javascript
// Loop Over Items를 거친 각 아이템 처리
const item = $input.first();

console.log('=== Base64 → 이미지 변환 (Loop 후) ===');
console.log('전체 아이템 구조:', JSON.stringify(item, null, 2));
console.log('json 타입:', typeof item.json);
console.log('json 내용:', JSON.stringify(item.json, null, 2));

// Base64 문자열 찾기
let base64String = null;

// 여러 가능한 경로 확인
if (item.json && typeof item.json === 'object') {
  // Split Out 후 구조: { "originalResponse.data.slides": "base64..." }
  if (item.json['originalResponse.data.slides']) {
    base64String = item.json['originalResponse.data.slides'];
    console.log('경로 1: originalResponse.data.slides');
  }
  // 또는 직접 slides 필드
  else if (item.json.slides) {
    base64String = item.json.slides;
    console.log('경로 2: slides');
  }
  // 또는 json 자체가 문자열
  else if (typeof item.json === 'string') {
    base64String = item.json;
    console.log('경로 3: json 자체');
  }
  // 또는 json의 첫 번째 값이 문자열
  else {
    const values = Object.values(item.json);
    if (values.length > 0 && typeof values[0] === 'string' && values[0].length > 100) {
      base64String = values[0];
      console.log('경로 4: json의 첫 번째 값');
    }
  }
} else if (typeof item.json === 'string') {
  base64String = item.json;
  console.log('경로 5: json이 직접 문자열');
}

console.log('Base64 문자열 찾음:', !!base64String);
console.log('Base64 길이:', base64String?.length || 0);

if (!base64String || typeof base64String !== 'string') {
  console.error('❌ Base64 문자열을 찾을 수 없습니다.');
  console.error('전체 아이템:', JSON.stringify(item, null, 2));
  throw new Error('Base64 문자열을 찾을 수 없습니다. 아이템 구조를 확인하세요.');
}

// Base64 문자열을 Buffer로 변환
let buffer;
try {
  buffer = Buffer.from(base64String, 'base64');
  console.log('✅ Buffer 변환 성공:', buffer.length, 'bytes');
} catch (error) {
  console.error('❌ Buffer 변환 실패:', error.message);
  throw new Error(`Buffer 변환 실패: ${error.message}`);
}

if (buffer.length === 0) {
  throw new Error('Buffer가 비어있습니다.');
}

// 메타데이터 가져오기 (원본 응답에서)
let slideIndex = null;
let totalSlides = null;
let instagramId = null;
let analysisId = null;
let phoneNumber = null;

// 원본 응답 찾기
const originalResponse = item.json.originalResponse || item.json.debug?.originalResponse || {};

if (originalResponse.data) {
  const slidesData = originalResponse.data;
  instagramId = slidesData.instagramId;
  analysisId = slidesData.analysisId;
  phoneNumber = slidesData.phoneNumber;
  totalSlides = slidesData.slides?.length || slidesData.slideCount;
  
  // 슬라이드 인덱스 찾기
  if (slidesData.slides && Array.isArray(slidesData.slides)) {
    slideIndex = slidesData.slides.indexOf(base64String) + 1;
  }
}

// slideIndex가 없으면 1로 설정 (임시)
if (!slideIndex) {
  slideIndex = 1;
}

console.log('메타데이터:', {
  slideIndex,
  totalSlides,
  instagramId,
  analysisId
});

// n8n 바이너리 형식으로 반환
const result = {
  json: {
    slideIndex: slideIndex,
    totalSlides: totalSlides,
    instagramId: instagramId,
    analysisId: analysisId,
    phoneNumber: phoneNumber,
    fileName: `수면분석리포트_${slideIndex}.png`
  },
  binary: {
    data: {
      data: buffer,           // Buffer 객체 (이미지 데이터)
      mimeType: 'image/png',  // MIME 타입
      fileName: `수면분석리포트_${slideIndex}.png`
    }
  }
};

console.log('✅ 변환 완료:', {
  jsonKeys: Object.keys(result.json),
  hasBinary: !!result.binary,
  binaryDataLength: result.binary?.data?.data?.length || 0
});

return result;
```

---

## 🔍 디버깅: 데이터 구조 확인

먼저 Loop Over Items의 Output 구조를 확인하세요:

**임시 Code 노드 추가** (Loop Over Items 다음):

```javascript
const item = $input.first();

console.log('=== Loop Over Items Output 구조 확인 ===');
console.log('전체 아이템:', JSON.stringify(item, null, 2));
console.log('json 타입:', typeof item.json);
console.log('json 키들:', Object.keys(item.json || {}));

// 모든 가능한 Base64 경로 확인
const possiblePaths = [
  'originalResponse.data.slides',
  'slides',
  'data',
  'value'
];

possiblePaths.forEach(path => {
  const value = item.json?.[path];
  if (value && typeof value === 'string' && value.length > 100) {
    console.log(`✅ ${path}에 Base64 발견 (길이: ${value.length})`);
  }
});

return {
  json: {
    debug: {
      jsonType: typeof item.json,
      jsonKeys: Object.keys(item.json || {}),
      firstValue: item.json ? Object.values(item.json)[0]?.substring(0, 50) : null
    },
    originalItem: item.json
  }
};
```

이 코드를 실행하여 실제 데이터 구조를 확인하세요.

---

## 💡 대안: Loop Over Items 없이 처리

n8n은 자동으로 각 아이템을 처리하므로, Loop Over Items 노드가 필요 없을 수 있습니다:

```
Split Out
  ↓
Code 노드 (Base64 → 이미지 변환) ← Loop 없이 직접 연결
  ↓
다음 노드
```

이렇게 하면 Code 노드가 각 아이템에 대해 자동으로 실행됩니다.

---

## 🎯 확인 사항

1. **Loop Over Items Output 확인**
   - 각 아이템의 구조 확인
   - Base64 문자열이 어디에 있는지 확인

2. **Code 노드 실행**
   - Console 로그 확인
   - Base64 문자열이 올바르게 찾아지는지 확인

3. **Output 확인**
   - "Binary" 탭 확인
   - 바이너리 데이터가 있는지 확인

---

먼저 디버깅 코드를 실행하여 실제 데이터 구조를 확인한 후, 그에 맞게 Code 노드를 수정하세요!

