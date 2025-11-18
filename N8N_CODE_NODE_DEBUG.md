# n8n Code 노드 - 디버깅 강화 버전

## 🔍 문제 진단용 코드

이 코드는 문제를 정확히 파악하기 위한 디버깅 정보를 출력합니다.

```javascript
// 이전 노드에서 데이터 받기
const item = $input.first();

// 1단계: 전체 데이터 구조 확인
console.log('=== 전체 아이템 구조 확인 ===');
console.log('아이템 키 목록:', Object.keys(item));
console.log('JSON 데이터 존재:', !!item.json);
console.log('바이너리 데이터 존재:', !!item.binary);

// 2단계: JSON 데이터 확인 (이미지 URL이 있는지)
if (item.json) {
  console.log('=== JSON 데이터 확인 ===');
  console.log('JSON 키 목록:', Object.keys(item.json));
  console.log('이미지 URL 필드:', item.json.question_4rR8Rk || '없음');
}

// 3단계: 바이너리 데이터 확인
if (item.binary) {
  console.log('=== 바이너리 데이터 확인 ===');
  console.log('바이너리 키 목록:', Object.keys(item.binary));
  
  if (item.binary.data) {
    const binaryData = item.binary.data.data;
    const mimeType = item.binary.data.mimeType || 'image/jpeg';
    
    console.log('바이너리 데이터 타입:', typeof binaryData);
    console.log('바이너리 데이터 길이:', binaryData ? binaryData.length : 0);
    console.log('MIME 타입:', mimeType);
    
    // 바이너리 데이터가 있는 경우
    if (binaryData && binaryData.length > 0) {
      console.log('✅ 바이너리 데이터 발견!');
      
      // Base64로 변환
      const base64String = Buffer.from(binaryData).toString('base64').replace(/\s/g, '');
      
      console.log('Base64 길이:', base64String.length);
      console.log('Base64 시작 50자:', base64String.substring(0, 50));
      
      // Base64 길이 검증 (최소 100자 이상이어야 함)
      if (base64String.length < 100) {
        throw new Error(`⚠️ Base64 문자열이 너무 짧습니다 (${base64String.length}자). 이미지가 제대로 다운로드되지 않았을 수 있습니다.`);
      }
      
      // Tally form에서 받은 추가 데이터도 함께 전달
      return {
        json: {
          imageBase64: `data:${mimeType};base64,${base64String}`,
          birthDate: item.json?.birthDate || "2024-01-15", // Tally에서 받은 생년월일 또는 기본값
          phoneNumber: item.json?.phoneNumber || "010-1234-5678", // Tally에서 받은 전화번호 또는 기본값
          instagramId: item.json?.instagramId || "@instagram_id" // Tally에서 받은 인스타그램 ID 또는 기본값
        }
      };
    } else {
      throw new Error('❌ 바이너리 데이터가 비어있습니다.');
    }
  } else {
    throw new Error('❌ 바이너리 데이터 구조가 올바르지 않습니다. item.binary.data가 없습니다.');
  }
} else {
  // 바이너리 데이터가 없는 경우 - 이전 노드 확인 필요
  console.log('❌ 바이너리 데이터가 없습니다!');
  console.log('이전 노드(HTTP Request)의 Response Format이 "File" 또는 "Binary"로 설정되어 있는지 확인하세요.');
  console.log('현재 받은 데이터:', JSON.stringify(item, null, 2));
  
  throw new Error('바이너리 데이터를 찾을 수 없습니다. 이전 노드(HTTP Request)에서 이미지를 다운로드했는지 확인하세요.');
}
```

## 📋 체크리스트

이 코드를 실행한 후 콘솔 로그를 확인하세요:

- [ ] "✅ 바이너리 데이터 발견!" 메시지가 나오는가?
- [ ] "바이너리 데이터 길이"가 0보다 큰가? (예: 50000 bytes 이상)
- [ ] "Base64 길이"가 100자 이상인가? (예: 50000자 이상)
- [ ] "Base64 시작 50자"가 실제 이미지 데이터처럼 보이는가? (예: `/9j/4AAQSkZJRg...`)

## ⚠️ 문제별 해결 방법

### 문제 1: "바이너리 데이터를 찾을 수 없습니다"
**원인**: HTTP Request 노드가 없거나 Response Format이 잘못 설정됨
**해결**: 
1. Tally Trigger와 Code 노드 사이에 HTTP Request 노드 추가
2. HTTP Request 노드의 Response Format을 `File` 또는 `Binary`로 설정

### 문제 2: "바이너리 데이터가 비어있습니다"
**원인**: 이미지 URL이 잘못되었거나 다운로드 실패
**해결**:
1. HTTP Request 노드의 URL이 올바른지 확인: `{{ $json.question_4rR8Rk }}`
2. Tally 이미지 URL에 접근 권한이 있는지 확인
3. HTTP Request 노드를 직접 실행해서 이미지가 다운로드되는지 확인

### 문제 3: Base64 길이가 100자 미만
**원인**: 이미지가 제대로 다운로드되지 않았거나, 잘못된 데이터를 Base64로 변환함
**해결**:
1. HTTP Request 노드의 Output을 확인하여 실제 이미지 파일이 다운로드되었는지 확인
2. 바이너리 데이터 길이가 충분한지 확인 (최소 수천 bytes 이상)

