# n8n 바이너리 데이터 파싱 가이드

## 🎯 문제점
- 업로드 노드에서 받은 바이너리 데이터를 변수로 직접 사용할 수 없음
- 바이너리 데이터를 파싱해야 다음 노드에서 사용 가능

---

## 📋 n8n 바이너리 데이터 구조

n8n에서 바이너리 데이터는 다음과 같은 구조로 저장됩니다:

```javascript
{
  json: { ... },
  binary: {
    data: {
      data: Buffer,        // 실제 바이너리 데이터
      mimeType: "image/png",
      fileName: "image.png"
    }
  }
}
```

---

## 🔧 바이너리 데이터 파싱 방법

### 방법 1: Code 노드에서 바이너리 데이터 추출

**Code 노드** (바이너리 데이터 파싱):

```javascript
// 이전 노드에서 데이터 받기
const item = $input.first();

// 바이너리 데이터 확인
if (!item.binary || !item.binary.data) {
  throw new Error('바이너리 데이터가 없습니다.');
}

const binaryData = item.binary.data.data;
const mimeType = item.binary.data.mimeType || 'image/png';
const fileName = item.binary.data.fileName || 'file.png';

console.log('바이너리 데이터 크기:', binaryData.length, 'bytes');
console.log('MIME 타입:', mimeType);
console.log('파일 이름:', fileName);

// Base64로 변환 (필요한 경우)
const base64String = Buffer.from(binaryData).toString('base64');

// JSON 데이터도 함께 전달
return {
  json: {
    // 이전 노드의 JSON 데이터
    ...item.json,
    // 바이너리 메타데이터
    binarySize: binaryData.length,
    mimeType: mimeType,
    fileName: fileName,
    // Base64 문자열 (필요한 경우)
    base64: base64String
  },
  // 바이너리 데이터 유지
  binary: item.binary
};
```

---

### 방법 2: 바이너리 데이터를 Base64로 변환하여 JSON에 포함

**Code 노드** (Base64 변환):

```javascript
const item = $input.first();

if (!item.binary || !item.binary.data) {
  throw new Error('바이너리 데이터가 없습니다.');
}

const binaryData = item.binary.data.data;
const mimeType = item.binary.data.mimeType || 'image/png';

// Base64로 변환
const base64String = Buffer.from(binaryData).toString('base64');

// JSON에 포함하여 다음 노드에서 사용 가능하게 함
return {
  json: {
    ...item.json,
    imageBase64: `data:${mimeType};base64,${base64String}`,
    base64String: base64String,  // Base64만 (접두사 없이)
    mimeType: mimeType,
    binarySize: binaryData.length
  }
};
```

이제 `{{ $json.imageBase64 }}` 또는 `{{ $json.base64String }}`로 사용할 수 있습니다.

---

### 방법 3: 바이너리 데이터를 여러 형식으로 변환

**Code 노드** (다양한 형식 제공):

```javascript
const item = $input.first();

if (!item.binary || !item.binary.data) {
  throw new Error('바이너리 데이터가 없습니다.');
}

const binaryData = item.binary.data.data;
const mimeType = item.binary.data.mimeType || 'image/png';
const fileName = item.binary.data.fileName || 'file.png';

// 다양한 형식으로 변환
const base64String = Buffer.from(binaryData).toString('base64');
const base64WithPrefix = `data:${mimeType};base64,${base64String}`;
const hexString = Buffer.from(binaryData).toString('hex');

return {
  json: {
    ...item.json,
    // Base64 형식들
    imageBase64: base64WithPrefix,      // data:image/png;base64,...
    base64String: base64String,         // Base64만
    // 기타 형식
    hexString: hexString,                // 16진수 문자열
    // 메타데이터
    mimeType: mimeType,
    fileName: fileName,
    binarySize: binaryData.length,
    // 바이너리 데이터의 처음 몇 바이트 (디버깅용)
    firstBytes: Array.from(binaryData.slice(0, 10))
  },
  // 바이너리 데이터도 유지
  binary: item.binary
};
```

---

## 📝 실제 사용 예시

### 예시 1: 이미지 업로드 → Base64 변환 → API 전송

**워크플로우**:
```
1. HTTP Request (이미지 다운로드)
   - Response Format: File
   ↓
2. Code 노드 (바이너리 → Base64)
   ↓
3. HTTP Request (API 전송)
```

**Code 노드 (2단계)**:
```javascript
const item = $input.first();

if (!item.binary || !item.binary.data) {
  throw new Error('바이너리 데이터가 없습니다.');
}

const binaryData = item.binary.data.data;
const mimeType = item.binary.data.mimeType || 'image/jpeg';

// Base64로 변환
const base64String = Buffer.from(binaryData).toString('base64');

return {
  json: {
    imageBase64: `data:${mimeType};base64,${base64String}`,
    mimeType: mimeType
  }
};
```

**HTTP Request (3단계)**:
- **URL**: `https://api.example.com/analyze`
- **Body**: JSON
```json
{
  "imageBase64": "{{ $json.imageBase64 }}"
}
```

---

### 예시 2: 슬라이드 조회 → 바이너리 변환 → 전송

**워크플로우**:
```
1. HTTP Request (슬라이드 조회)
   - GET /api/analysis/{analysisId}/slides
   ↓
2. Code 노드 (Base64 배열 → 바이너리 배열)
   ↓
3. Loop Over Items
   ↓
4. 전송
```

**Code 노드 (2단계)**:
```javascript
const response = $input.first().json;

if (!response.success || !response.data || !response.data.slides) {
  throw new Error('슬라이드 데이터를 찾을 수 없습니다.');
}

const slidesData = response.data;
const slides = slidesData.slides;  // Base64 문자열 배열

// 각 슬라이드를 바이너리 데이터로 변환
const items = slides.map((base64String, index) => {
  // Base64를 Buffer로 변환
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

## 🔍 analysisId가 undefined인 문제 해결

### 문제: `{{analysisId}}`가 `[undefined]`로 표시됨

**원인**: 이전 노드에서 `analysisId`를 올바르게 전달하지 않음

**해결 방법**:

#### 방법 1: 이전 노드의 Output 확인

**분석 API 호출 노드**의 Output 확인:
```json
{
  "success": true,
  "analysisId": "84b4601c-a606-47b9-b656-0beaf6080ba8",
  "data": { ... }
}
```

#### 방법 2: Code 노드에서 analysisId 추출

**Code 노드** (analysisId 추출):

```javascript
// 이전 노드에서 데이터 받기
const item = $input.first();

// analysisId 추출
const analysisId = item.json.analysisId;

if (!analysisId) {
  console.log('전체 JSON:', JSON.stringify(item.json, null, 2));
  throw new Error('analysisId를 찾을 수 없습니다.');
}

console.log('analysisId:', analysisId);

// 다음 노드에서 사용할 수 있도록 전달
return {
  json: {
    ...item.json,
    analysisId: analysisId  // 명시적으로 포함
  }
};
```

#### 방법 3: URL에서 직접 사용

**HTTP Request 노드** 설정:
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{{ $json.analysisId }}/slides`
  - ⚠️ **중요**: `{{ $json.analysisId }}` 형식 사용 (중괄호 안에 공백 없음)

---

## 📋 완전한 워크플로우 예시

### 워크플로우: 분석 → 슬라이드 조회 → 바이너리 변환

```
1. HTTP Request (분석 API)
   - POST /api/analyze-from-url
   ↓
2. Code 노드 (analysisId 추출 및 확인)
   ↓
3. HTTP Request (슬라이드 조회)
   - GET /api/analysis/{{ $json.analysisId }}/slides
   ↓
4. Code 노드 (Base64 배열 → 바이너리 배열)
   ↓
5. Loop Over Items
   ↓
6. 전송
```

**Code 노드 (2단계 - analysisId 추출)**:
```javascript
const item = $input.first();

console.log('전체 데이터:', JSON.stringify(item.json, null, 2));

const analysisId = item.json.analysisId;

if (!analysisId) {
  throw new Error('analysisId를 찾을 수 없습니다. 이전 노드의 Output을 확인하세요.');
}

console.log('✅ analysisId 추출 성공:', analysisId);

return {
  json: {
    ...item.json,
    analysisId: analysisId
  }
};
```

**Code 노드 (4단계 - 바이너리 변환)**:
```javascript
const response = $input.first().json;

if (!response.success || !response.data || !response.data.slides) {
  throw new Error('슬라이드 데이터를 찾을 수 없습니다.');
}

const slidesData = response.data;
const slides = slidesData.slides;

// 각 슬라이드를 바이너리 데이터로 변환
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

## ✅ 체크리스트

- [ ] 이전 노드에서 바이너리 데이터가 올바르게 전달되는지 확인
- [ ] Code 노드에서 `item.binary.data.data`로 바이너리 데이터 접근
- [ ] Base64 변환이 필요한 경우 `Buffer.from(binaryData).toString('base64')` 사용
- [ ] 바이너리 데이터를 JSON에 포함하여 다음 노드에서 사용 가능하게 함
- [ ] `analysisId`가 올바르게 전달되는지 확인

---

## 🚀 다음 단계

1. **Code 노드 추가**: 바이너리 데이터 파싱
2. **analysisId 추출**: 이전 노드에서 명시적으로 추출
3. **테스트**: 각 단계에서 데이터가 올바르게 전달되는지 확인

