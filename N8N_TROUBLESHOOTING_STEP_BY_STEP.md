# n8n Base64 변환 문제 해결 가이드 (단계별)

## 🔍 현재 상황
- ✅ 워크플로우 구조는 올바름: Tally Trigger → HTTP Request1 → Code 노드
- ❌ Base64 문자열이 너무 짧음 (`ZmlsZXN5c3RlbS12Mg==` = "filesystem-v2")

## 🎯 문제 진단 단계

### 1단계: HTTP Request1 노드 Output 확인

**HTTP Request1 노드를 더블클릭하고:**

1. **Output 탭 확인**
   - "Binary" 탭을 클릭
   - 이미지 파일이 있는지 확인
   - 파일 크기가 0보다 큰지 확인 (예: 50000 bytes 이상)

2. **에러 확인**
   - 노드에 빨간색 경고 표시가 있는지 확인
   - 에러 메시지가 있는지 확인

3. **Response Format 확인**
   - Parameters 탭으로 이동
   - **Response Format**이 `File` 또는 `Binary`로 설정되어 있는지 확인
   - 만약 `JSON` 또는 `String`으로 설정되어 있다면 → `File`로 변경

### 2단계: HTTP Request1 노드 설정 확인

**Parameters 탭에서 확인:**

- **Method**: `GET` ✅
- **URL**: `{{ $json.question_4rR8Rk }}` ✅
- **Response Format**: `File` 또는 `Binary` ⚠️ **이게 가장 중요!**
- **Authentication**: `None` (또는 필요시 설정)

**만약 Response Format이 `JSON` 또는 `String`이라면:**
1. `File` 또는 `Binary`로 변경
2. 워크플로우 다시 실행

### 3단계: Code 노드에 디버깅 코드 적용

**Code 노드에 다음 코드를 복사해서 붙여넣으세요:**

```javascript
// 이전 노드에서 데이터 받기
const item = $input.first();

// ========== 1단계: 전체 데이터 구조 확인 ==========
console.log('=== 🔍 전체 아이템 구조 확인 ===');
console.log('아이템 키 목록:', Object.keys(item));
console.log('JSON 데이터 존재:', !!item.json);
console.log('바이너리 데이터 존재:', !!item.binary);

// ========== 2단계: JSON 데이터 확인 ==========
if (item.json) {
  console.log('=== 📄 JSON 데이터 확인 ===');
  console.log('JSON 키 목록:', Object.keys(item.json));
  // Tally form 데이터 확인
  if (item.json.question_4rR8Rk) {
    console.log('이미지 URL:', item.json.question_4rR8Rk);
  }
}

// ========== 3단계: 바이너리 데이터 확인 ==========
if (item.binary) {
  console.log('=== 📦 바이너리 데이터 확인 ===');
  console.log('바이너리 키 목록:', Object.keys(item.binary));
  
  // 바이너리 데이터의 모든 키 확인
  if (item.binary.data) {
    console.log('binary.data 키 목록:', Object.keys(item.binary.data));
    
    const binaryData = item.binary.data.data;
    const mimeType = item.binary.data.mimeType || 'image/jpeg';
    
    console.log('바이너리 데이터 타입:', typeof binaryData);
    console.log('바이너리 데이터 길이:', binaryData ? binaryData.length : 0);
    console.log('MIME 타입:', mimeType);
    
    // 바이너리 데이터가 있는 경우
    if (binaryData && binaryData.length > 0) {
      console.log('✅ 바이너리 데이터 발견!');
      console.log('데이터 크기:', binaryData.length, 'bytes');
      
      // Base64로 변환
      const base64String = Buffer.from(binaryData).toString('base64').replace(/\s/g, '');
      
      console.log('Base64 길이:', base64String.length);
      console.log('Base64 시작 50자:', base64String.substring(0, 50));
      
      // Base64 길이 검증
      if (base64String.length < 100) {
        console.log('⚠️ Base64 문자열이 너무 짧습니다!');
        console.log('이미지가 제대로 다운로드되지 않았을 수 있습니다.');
        console.log('HTTP Request1 노드의 Output을 확인하세요.');
        throw new Error(`Base64 문자열이 너무 짧습니다 (${base64String.length}자). HTTP Request1 노드의 Response Format이 "File" 또는 "Binary"로 설정되어 있는지 확인하세요.`);
      }
      
      // 성공적으로 변환됨
      console.log('✅ Base64 변환 성공!');
      
      // Tally form에서 받은 추가 데이터도 함께 전달
      return {
        json: {
          imageBase64: `data:${mimeType};base64,${base64String}`,
          birthDate: item.json?.birthDate || item.json?.question_생년월일 || "2024-01-15",
          phoneNumber: item.json?.phoneNumber || item.json?.question_전화번호 || "010-1234-5678",
          instagramId: item.json?.instagramId || item.json?.question_인스타그램 || "@instagram_id"
        }
      };
    } else {
      console.log('❌ 바이너리 데이터가 비어있습니다.');
      throw new Error('바이너리 데이터가 비어있습니다. HTTP Request1 노드에서 이미지가 제대로 다운로드되었는지 확인하세요.');
    }
  } else {
    console.log('❌ item.binary.data가 없습니다.');
    throw new Error('바이너리 데이터 구조가 올바르지 않습니다. HTTP Request1 노드의 Response Format을 "File" 또는 "Binary"로 설정하세요.');
  }
} else {
  // 바이너리 데이터가 없는 경우
  console.log('❌ 바이너리 데이터가 없습니다!');
  console.log('현재 받은 데이터 구조:', JSON.stringify(Object.keys(item), null, 2));
  
  // JSON 데이터가 있다면 출력
  if (item.json) {
    console.log('JSON 데이터:', JSON.stringify(item.json, null, 2));
  }
  
  throw new Error('바이너리 데이터를 찾을 수 없습니다. HTTP Request1 노드의 Response Format이 "File" 또는 "Binary"로 설정되어 있는지 확인하세요.');
}
```

### 4단계: 실행 및 로그 확인

1. **워크플로우 실행**
   - Execute Workflow 클릭

2. **Code 노드의 로그 확인**
   - Code 노드 클릭
   - 하단의 "Execution Log" 또는 "Console" 탭 확인
   - 위의 `console.log` 메시지들이 출력되는지 확인

3. **확인할 내용:**
   - "✅ 바이너리 데이터 발견!" 메시지가 나오는가?
   - "바이너리 데이터 길이"가 0보다 큰가? (예: 50000 bytes 이상)
   - "Base64 길이"가 100자 이상인가?

## 🔧 일반적인 문제 및 해결

### 문제 1: HTTP Request1 노드의 Response Format이 잘못됨

**증상:**
- Code 노드에서 "바이너리 데이터를 찾을 수 없습니다" 에러
- 또는 Base64가 매우 짧음

**해결:**
1. HTTP Request1 노드 더블클릭
2. Parameters 탭으로 이동
3. **Response Format**을 `File` 또는 `Binary`로 변경
4. 워크플로우 다시 실행

### 문제 2: Tally 이미지 URL 접근 권한 문제

**증상:**
- HTTP Request1 노드에서 에러 발생
- 403 Forbidden 또는 401 Unauthorized 에러

**해결:**
1. HTTP Request1 노드의 URL 확인
2. Tally 이미지 URL에 `accessToken`이 포함되어 있는지 확인
3. 필요시 Authentication 설정 추가

### 문제 3: HTTP Request1 노드가 실제로 이미지를 다운로드하지 못함

**증상:**
- HTTP Request1 노드의 Output에 바이너리 데이터가 없음
- 또는 바이너리 데이터 크기가 0

**해결:**
1. HTTP Request1 노드를 직접 실행
2. Output의 Binary 탭 확인
3. 이미지가 다운로드되었는지 확인
4. URL이 올바른지 확인: `{{ $json.question_4rR8Rk }}`

## 📋 최종 체크리스트

- [ ] HTTP Request1 노드의 Response Format이 `File` 또는 `Binary`로 설정됨
- [ ] HTTP Request1 노드의 URL이 `{{ $json.question_4rR8Rk }}`로 설정됨
- [ ] HTTP Request1 노드를 실행했을 때 Output에 바이너리 데이터가 있음
- [ ] Code 노드의 디버깅 코드가 적용됨
- [ ] Code 노드의 로그에서 "✅ 바이너리 데이터 발견!" 메시지가 나옴
- [ ] Base64 길이가 100자 이상임

## 🎯 다음 단계

위의 디버깅 코드를 Code 노드에 적용하고 실행한 후, 콘솔 로그를 확인하세요. 어떤 메시지가 나오는지 알려주시면 더 정확한 해결책을 제시하겠습니다.

