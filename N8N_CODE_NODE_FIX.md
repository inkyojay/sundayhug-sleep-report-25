# n8n Code 노드 Base64 변환 수정 가이드

## 🔴 문제: Base64 문자열이 너무 짧거나 공백 포함

### 올바른 Code 노드 코드

**전체 코드**:
```javascript
// 이전 노드에서 바이너리 데이터 받기
const item = $input.first();

// 바이너리 데이터 확인
if (!item.binary || !item.binary.data) {
  throw new Error('바이너리 데이터가 없습니다. 이전 노드에서 파일을 올바르게 읽었는지 확인하세요.');
}

const binaryData = item.binary.data.data;
const mimeType = item.binary.data.mimeType || 'image/jpeg';

// 데이터 유효성 검사
if (!binaryData || binaryData.length === 0) {
  throw new Error('이미지 데이터가 비어있습니다.');
}

// Base64로 변환 (공백 제거)
const base64String = Buffer.from(binaryData).toString('base64').replace(/\s/g, '');

// 디버깅 정보 (선택사항)
console.log('이미지 크기:', binaryData.length, 'bytes');
console.log('MIME 타입:', mimeType);
console.log('Base64 길이:', base64String.length);
console.log('Base64 시작:', base64String.substring(0, 50));

// API 요청 형식으로 변환
return {
  json: {
    imageBase64: `data:${mimeType};base64,${base64String}`,
    birthDate: "2024-01-15", // 실제 생년월일로 변경 (YYYY-MM-DD 형식)
    phoneNumber: "010-1234-5678", // 선택사항
    instagramId: "@instagram_id" // 선택사항
  }
};
```

## 🔍 문제 해결 단계

### 1단계: 이전 노드 확인

**HTTP Request 노드 설정 확인**:
- **Response Format**: `File` 또는 `Binary`로 설정
- 파일이 올바르게 다운로드되었는지 확인

### 2단계: Code 노드 수정

위의 올바른 코드를 사용하세요. 주요 변경사항:
- `.replace(/\s/g, '')` 추가: Base64 문자열에서 공백 제거
- 데이터 유효성 검사 추가
- 에러 처리 추가

### 3단계: 디버깅

**디버깅용 코드** (문제 파악용):
```javascript
const item = $input.first();

console.log('전체 아이템 구조:', JSON.stringify(Object.keys(item), null, 2));
console.log('바이너리 데이터 존재:', !!item.binary);
console.log('바이너리 데이터 키:', item.binary ? Object.keys(item.binary) : '없음');

if (item.binary && item.binary.data) {
  const binaryData = item.binary.data.data;
  console.log('바이너리 데이터 타입:', typeof binaryData);
  console.log('바이너리 데이터 길이:', binaryData ? binaryData.length : 0);
  console.log('MIME 타입:', item.binary.data.mimeType);
  
  if (binaryData && binaryData.length > 0) {
    const base64String = Buffer.from(binaryData).toString('base64').replace(/\s/g, '');
    console.log('Base64 길이:', base64String.length);
    console.log('Base64 시작 50자:', base64String.substring(0, 50));
    
    return {
      json: {
        imageBase64: `data:${item.binary.data.mimeType || 'image/jpeg'};base64,${base64String}`,
        birthDate: "2024-01-15",
        phoneNumber: "010-1234-5678",
        instagramId: "@instagram_id"
      }
    };
  } else {
    throw new Error('바이너리 데이터가 비어있습니다.');
  }
} else {
  throw new Error('바이너리 데이터를 찾을 수 없습니다. 이전 노드 설정을 확인하세요.');
}
```

## 📋 체크리스트

- [ ] 이전 노드(HTTP Request)의 Response Format이 `File` 또는 `Binary`로 설정됨
- [ ] Code 노드에서 `.replace(/\s/g, '')`로 공백 제거
- [ ] Base64 문자열 길이가 100자 이상인지 확인 (작은 이미지도 최소 수백 자)
- [ ] `imageBase64` 값이 `data:image/jpeg;base64,`로 시작하는지 확인
- [ ] Base64 문자열에 공백이 없는지 확인

## 🎯 예상되는 올바른 출력

**Base64 문자열 예시** (실제로는 훨씬 길어야 함):
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
  "birthDate": "2024-01-15",
  "phoneNumber": "010-1234-5678",
  "instagramId": "@instagram_id"
}
```

**주의**: 실제 Base64 문자열은 수백~수천 자 이상이어야 합니다.

## ⚠️ 일반적인 문제

### 문제 1: Base64가 너무 짧음
**원인**: 이미지 파일이 제대로 읽히지 않음
**해결**: 이전 노드에서 파일 다운로드 확인

### 문제 2: Base64에 공백 포함
**원인**: 변환 과정에서 공백 추가됨
**해결**: `.replace(/\s/g, '')` 추가

### 문제 3: 바이너리 데이터가 없음
**원인**: 이전 노드 설정 오류
**해결**: HTTP Request 노드의 Response Format 확인

