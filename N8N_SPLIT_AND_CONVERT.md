# n8n Split Out 후 Base64 → 이미지 변환 가이드

## ✅ 현재 상태
- Split Out 노드로 Base64 배열을 5개의 개별 아이템으로 분리 완료
- 각 아이템은 Base64 문자열

---

## 📋 다음 단계: Base64 → 이미지 변환

### Code 노드 추가

**Split Out 노드 다음에 Code 노드를 추가**하세요.

**노드 이름**: "Base64 → 이미지 변환"

**코드**:
```javascript
// Split Out으로 분리된 각 Base64 문자열 처리
const item = $input.first();

// Base64 문자열 가져오기
// Split Out 후 구조: { json: { "originalResponse.data.slides": "base64..." } }
const base64String = item.json['originalResponse.data.slides'] || item.json.slides || item.json;

console.log('=== Base64 → 이미지 변환 ===');
console.log('Base64 타입:', typeof base64String);
console.log('Base64 길이:', base64String?.length || 0);

if (!base64String || typeof base64String !== 'string') {
  throw new Error('Base64 문자열을 찾을 수 없습니다. JSON: ' + JSON.stringify(item.json));
}

// Base64 문자열을 Buffer로 변환 (이미지로 변환)
const buffer = Buffer.from(base64String, 'base64');

console.log('Buffer 길이:', buffer.length, 'bytes');

if (buffer.length === 0) {
  throw new Error('Buffer가 비어있습니다.');
}

// 원본 응답에서 추가 정보 가져오기 (있는 경우)
const originalResponse = item.json.originalResponse || {};
const slidesData = originalResponse.data || {};

// n8n 바이너리 형식으로 반환
return {
  json: {
    slideIndex: item.json.slideIndex || null,
    totalSlides: item.json.totalSlides || null,
    instagramId: slidesData.instagramId || null,
    analysisId: slidesData.analysisId || null,
    phoneNumber: slidesData.phoneNumber || null,
    fileName: `수면분석리포트_${item.json.slideIndex || 'unknown'}.png`
  },
  binary: {
    data: {
      data: buffer,           // Buffer 객체 (이미지 데이터)
      mimeType: 'image/png',  // MIME 타입
      fileName: `수면분석리포트_${item.json.slideIndex || 'unknown'}.png`
    }
  }
};
```

---

## 🔧 더 나은 방법: 원본 데이터 유지

Split Out 전에 원본 데이터를 유지하려면, Code 노드를 다음과 같이 수정하세요:

```javascript
// Split Out으로 분리된 각 Base64 문자열 처리
const item = $input.first();

console.log('=== Base64 → 이미지 변환 ===');
console.log('전체 아이템:', JSON.stringify(item.json, null, 2));

// Base64 문자열 찾기 (여러 가능한 경로 확인)
let base64String = null;
let slideIndex = null;
let totalSlides = null;
let instagramId = null;
let analysisId = null;
let phoneNumber = null;

// Split Out 후 구조 확인
if (item.json['originalResponse.data.slides']) {
  base64String = item.json['originalResponse.data.slides'];
} else if (item.json.slides) {
  base64String = item.json.slides;
} else if (typeof item.json === 'string') {
  base64String = item.json;
}

// 원본 응답에서 메타데이터 가져오기
if (item.json.originalResponse) {
  const data = item.json.originalResponse.data || {};
  instagramId = data.instagramId;
  analysisId = data.analysisId;
  phoneNumber = data.phoneNumber;
  totalSlides = data.slides?.length || data.slideCount;
}

// 슬라이드 인덱스 찾기 (배열 인덱스 기반)
const allSlides = item.json.originalResponse?.data?.slides || [];
slideIndex = allSlides.indexOf(base64String) + 1;

console.log('Base64 길이:', base64String?.length || 0);
console.log('슬라이드 인덱스:', slideIndex);
console.log('총 슬라이드:', totalSlides);

if (!base64String || typeof base64String !== 'string') {
  throw new Error('Base64 문자열을 찾을 수 없습니다.');
}

// Base64 문자열을 Buffer로 변환 (이미지로 변환)
const buffer = Buffer.from(base64String, 'base64');

console.log('Buffer 길이:', buffer.length, 'bytes');

if (buffer.length === 0) {
  throw new Error('Buffer가 비어있습니다.');
}

// n8n 바이너리 형식으로 반환
return {
  json: {
    slideIndex: slideIndex,
    totalSlides: totalSlides,
    instagramId: instagramId,
    analysisId: analysisId,
    phoneNumber: phoneNumber,
    fileName: `수면분석리포트_${slideIndex || 'unknown'}.png`
  },
  binary: {
    data: {
      data: buffer,           // Buffer 객체 (이미지 데이터)
      mimeType: 'image/png',  // MIME 타입
      fileName: `수면분석리포트_${slideIndex || 'unknown'}.png`
    }
  }
};
```

---

## 📋 워크플로우 구조

```
1. Tally Trigger
   ↓
2. HTTP Request (분석 API)
   ↓
3. Code 노드 (analysisId 추출)
   ↓
4. HTTP Request (슬라이드 조회)
   ↓
5. Code 노드 (응답 확인) - 선택사항
   ↓
6. Split Out 노드 ← Base64 배열을 개별 아이템으로 분리 ✅
   - Fields To Split Out: `originalResponse.data.slides`
   ↓
7. Code 노드 (Base64 → 이미지 변환) ← 이 노드 추가!
   ↓
8. 다음 노드 (DM 전송 등)
```

---

## 🎯 확인 사항

1. **Split Out 노드 확인**
   - 5개의 아이템이 생성되었는지 확인
   - 각 아이템에 Base64 문자열이 있는지 확인

2. **Code 노드 실행**
   - Execute step 실행
   - Console 로그 확인

3. **Output 확인**
   - "Binary" 탭 확인
   - 각 아이템에 바이너리 데이터가 있는지 확인
   - View/Download 버튼 테스트

---

## 💡 팁

- Split Out 노드의 "Include" 옵션을 "All Other Fields"로 설정하면 원본 데이터를 유지할 수 있습니다
- 이렇게 하면 `slideIndex`, `instagramId` 등의 정보를 더 쉽게 가져올 수 있습니다

위의 Code 노드를 추가하고 실행해보세요!

