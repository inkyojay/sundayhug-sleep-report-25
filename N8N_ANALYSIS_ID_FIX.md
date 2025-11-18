# n8n analysisId 추출 문제 해결

## 🔴 문제: analysisId를 찾을 수 없음

HTTP Request 노드의 응답 구조를 확인하고 올바르게 추출해야 합니다.

---

## 🔍 1단계: 응답 구조 확인 (디버깅 Code 노드)

**Code 노드**에 다음 코드를 사용하여 실제 응답 구조를 확인하세요:

```javascript
// 이전 노드에서 데이터 받기
const item = $input.first();

console.log('=== 전체 아이템 구조 확인 ===');
console.log('아이템 키:', Object.keys(item));
console.log('JSON 존재:', !!item.json);
console.log('바이너리 존재:', !!item.binary);

// JSON 데이터 확인
if (item.json) {
  console.log('=== JSON 데이터 구조 ===');
  console.log('JSON 키:', Object.keys(item.json));
  console.log('전체 JSON:', JSON.stringify(item.json, null, 2));
  
  // 가능한 경로들 확인
  console.log('item.json.analysisId:', item.json.analysisId);
  console.log('item.json.data?.analysisId:', item.json.data?.analysisId);
  console.log('item.json.response?.analysisId:', item.json.response?.analysisId);
  
  // 응답이 래핑되어 있는지 확인
  if (item.json.response) {
    console.log('response 키 존재:', Object.keys(item.json.response));
  }
  if (item.json.data) {
    console.log('data 키 존재:', Object.keys(item.json.data));
  }
}

// 전체 구조 반환 (디버깅용)
return {
  json: {
    ...item.json,
    _debug: {
      keys: Object.keys(item),
      jsonKeys: item.json ? Object.keys(item.json) : [],
      hasAnalysisId: !!item.json?.analysisId,
      hasDataAnalysisId: !!item.json?.data?.analysisId
    }
  }
};
```

이 코드를 실행한 후 **Execution Log**를 확인하여 실제 응답 구조를 파악하세요.

---

## 🔧 2단계: analysisId 추출 (수정된 버전)

응답 구조에 따라 다음 중 하나를 사용하세요:

### 버전 A: 직접 analysisId가 있는 경우

```javascript
const item = $input.first();

// 직접 추출
const analysisId = item.json.analysisId;

if (!analysisId) {
  console.log('⚠️ analysisId를 찾을 수 없습니다.');
  console.log('사용 가능한 키:', Object.keys(item.json));
  console.log('전체 JSON:', JSON.stringify(item.json, null, 2));
  throw new Error('analysisId를 찾을 수 없습니다.');
}

console.log('✅ analysisId 추출 성공:', analysisId);

return {
  json: {
    ...item.json,
    analysisId: analysisId
  }
};
```

### 버전 B: data 안에 있는 경우

```javascript
const item = $input.first();

// data 안에서 추출
const analysisId = item.json.data?.analysisId || item.json.analysisId;

if (!analysisId) {
  console.log('⚠️ analysisId를 찾을 수 없습니다.');
  console.log('사용 가능한 키:', Object.keys(item.json));
  if (item.json.data) {
    console.log('data 키:', Object.keys(item.json.data));
  }
  console.log('전체 JSON:', JSON.stringify(item.json, null, 2));
  throw new Error('analysisId를 찾을 수 없습니다.');
}

console.log('✅ analysisId 추출 성공:', analysisId);

return {
  json: {
    ...item.json,
    analysisId: analysisId
  }
};
```

### 버전 C: 응답이 래핑된 경우

```javascript
const item = $input.first();

// HTTP Request 노드가 응답을 래핑한 경우
let responseData = item.json;

// response 키가 있으면 그 안에서 찾기
if (item.json.response) {
  responseData = item.json.response;
}

// data 키가 있으면 그 안에서 찾기
if (responseData.data) {
  responseData = responseData.data;
}

const analysisId = responseData.analysisId;

if (!analysisId) {
  console.log('⚠️ analysisId를 찾을 수 없습니다.');
  console.log('전체 구조:', JSON.stringify(item.json, null, 2));
  throw new Error('analysisId를 찾을 수 없습니다.');
}

console.log('✅ analysisId 추출 성공:', analysisId);

return {
  json: {
    ...item.json,
    analysisId: analysisId
  }
};
```

### 버전 D: 모든 가능한 경로 확인 (가장 안전)

```javascript
const item = $input.first();

// 모든 가능한 경로에서 analysisId 찾기
let analysisId = null;

// 경로 1: 직접
if (item.json.analysisId) {
  analysisId = item.json.analysisId;
  console.log('✅ 경로 1에서 찾음: item.json.analysisId');
}
// 경로 2: data 안에
else if (item.json.data?.analysisId) {
  analysisId = item.json.data.analysisId;
  console.log('✅ 경로 2에서 찾음: item.json.data.analysisId');
}
// 경로 3: response 안에
else if (item.json.response?.analysisId) {
  analysisId = item.json.response.analysisId;
  console.log('✅ 경로 3에서 찾음: item.json.response.analysisId');
}
// 경로 4: response.data 안에
else if (item.json.response?.data?.analysisId) {
  analysisId = item.json.response.data.analysisId;
  console.log('✅ 경로 4에서 찾음: item.json.response.data.analysisId');
}

if (!analysisId) {
  console.log('⚠️ analysisId를 찾을 수 없습니다.');
  console.log('전체 JSON 구조:', JSON.stringify(item.json, null, 2));
  throw new Error('analysisId를 찾을 수 없습니다. Execution Log를 확인하세요.');
}

console.log('✅ analysisId 추출 성공:', analysisId);

return {
  json: {
    ...item.json,
    analysisId: analysisId
  }
};
```

---

## 📋 서버 응답 구조 확인

서버 코드를 보면 `/api/analyze-from-url` 엔드포인트는 다음과 같이 응답합니다:

```javascript
res.json({
  success: true,
  data: {
    ...analysisResult,
    phoneNumber: phoneNumber || null,
    instagramId: instagramId || null
  },
  analysisId: savedAnalysis.id
});
```

따라서 응답 구조는:
```json
{
  "success": true,
  "data": { ... },
  "analysisId": "84b4601c-a606-47b9-b656-0beaf6080ba8"
}
```

**analysisId는 최상위 레벨에 있습니다!**

---

## 🔧 해결 방법

### 방법 1: HTTP Request 노드 설정 확인

HTTP Request 노드의 **Options** 탭에서:
- **Response Format**: `JSON` (기본값)
- **Response**: 
  - **Include Response Headers and Status**: 비활성화 (선택사항)
  - **Response Format**: `JSON`

### 방법 2: Code 노드 수정 (버전 D 사용)

**Code 노드**에 **버전 D** 코드를 사용하세요. 이 코드는 모든 가능한 경로를 확인합니다.

---

## 📝 완전한 워크플로우

```
1. Tally Trigger
   ↓
2. HTTP Request (분석 API 호출)
   - POST /api/analyze-from-url
   ↓
3. Code 노드 (버전 D - analysisId 추출)
   ↓
4. HTTP Request (슬라이드 조회)
   - GET /api/analysis/{{ $json.analysisId }}/slides
```

---

## ✅ 체크리스트

- [ ] HTTP Request 노드의 Output 확인
- [ ] Code 노드에서 전체 JSON 구조 확인 (디버깅 코드 사용)
- [ ] analysisId가 어디에 있는지 확인
- [ ] 올바른 경로로 추출 (버전 D 사용 권장)
- [ ] 다음 노드에서 `{{ $json.analysisId }}` 사용

---

## 🚀 다음 단계

1. **디버깅 Code 노드 실행**: 실제 응답 구조 확인
2. **Execution Log 확인**: analysisId가 어디에 있는지 확인
3. **올바른 버전 선택**: 응답 구조에 맞는 버전 사용
4. **테스트**: analysisId가 올바르게 추출되는지 확인

먼저 **디버깅 Code 노드**를 실행하여 실제 응답 구조를 확인하세요!

