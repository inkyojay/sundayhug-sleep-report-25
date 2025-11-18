# n8n Code 노드 - 수정된 버전 (Put Output in Field: data)

## ✅ HTTP Request1 노드 확인 완료
- Response Format: `File` ✅
- Put Output in Field: `data` ✅
- File Size: `254 kB` ✅

## 🔧 Code 노드 코드 (수정 버전)

`Put Output in Field`가 `data`로 설정되어 있으므로, 바이너리 데이터 접근 방식을 조정했습니다.

```javascript
// 이전 노드에서 데이터 받기
const item = $input.first();

// ========== 1단계: 전체 데이터 구조 확인 ==========
console.log('=== 🔍 전체 아이템 구조 확인 ===');
console.log('아이템 키 목록:', Object.keys(item));
console.log('JSON 데이터 존재:', !!item.json);
console.log('바이너리 데이터 존재:', !!item.binary);

// ========== 2단계: 바이너리 데이터 확인 ==========
if (item.binary) {
  console.log('=== 📦 바이너리 데이터 확인 ===');
  console.log('바이너리 키 목록:', Object.keys(item.binary));
  
  // Put Output in Field가 "data"로 설정되어 있으므로
  // 바이너리 데이터는 item.binary.data에 있을 수 있음
  let binaryData = null;
  let mimeType = 'image/jpeg';
  
  // 방법 1: item.binary.data.data (일반적인 경우)
  if (item.binary.data && item.binary.data.data) {
    console.log('✅ 바이너리 데이터를 item.binary.data.data에서 찾았습니다.');
    binaryData = item.binary.data.data;
    mimeType = item.binary.data.mimeType || item.binary.data.mime || 'image/jpeg';
  }
  // 방법 2: item.binary.data (직접 바이너리인 경우)
  else if (item.binary.data && Buffer.isBuffer(item.binary.data)) {
    console.log('✅ 바이너리 데이터를 item.binary.data에서 찾았습니다.');
    binaryData = item.binary.data;
    mimeType = item.binary.mimeType || 'image/jpeg';
  }
  // 방법 3: 다른 키에 있을 수 있음 (예: item.binary.data의 다른 속성)
  else if (item.binary.data) {
    console.log('=== 바이너리 데이터 구조 탐색 ===');
    console.log('item.binary.data 키 목록:', Object.keys(item.binary.data));
    
    // 모든 키를 확인
    for (const key of Object.keys(item.binary.data)) {
      const value = item.binary.data[key];
      console.log(`키 "${key}": 타입=${typeof value}, 길이=${value && value.length ? value.length : 'N/A'}`);
      
      // Buffer나 ArrayBuffer인 경우
      if (Buffer.isBuffer(value) || value instanceof ArrayBuffer || (value && typeof value === 'object' && value.length)) {
        console.log(`✅ 바이너리 데이터를 item.binary.data.${key}에서 찾았습니다.`);
        binaryData = Buffer.isBuffer(value) ? value : Buffer.from(value);
        mimeType = item.binary.data.mimeType || item.binary.data.mime || 'image/jpeg';
        break;
      }
    }
  }
  
  // 바이너리 데이터를 찾았는지 확인
  if (binaryData) {
    console.log('✅ 바이너리 데이터 발견!');
    console.log('바이너리 데이터 타입:', typeof binaryData);
    console.log('바이너리 데이터 길이:', binaryData.length, 'bytes');
    console.log('MIME 타입:', mimeType);
    
    // Base64로 변환
    const base64String = Buffer.from(binaryData).toString('base64').replace(/\s/g, '');
    
    console.log('Base64 길이:', base64String.length);
    console.log('Base64 시작 50자:', base64String.substring(0, 50));
    
    // Base64 길이 검증
    if (base64String.length < 100) {
      console.log('⚠️ Base64 문자열이 너무 짧습니다!');
      throw new Error(`Base64 문자열이 너무 짧습니다 (${base64String.length}자). 바이너리 데이터가 올바르게 읽히지 않았을 수 있습니다.`);
    }
    
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
    console.log('❌ 바이너리 데이터를 찾을 수 없습니다.');
    console.log('item.binary 구조:', JSON.stringify(Object.keys(item.binary), null, 2));
    if (item.binary.data) {
      console.log('item.binary.data 구조:', JSON.stringify(Object.keys(item.binary.data), null, 2));
    }
    throw new Error('바이너리 데이터를 찾을 수 없습니다. HTTP Request1 노드의 Output을 확인하세요.');
  }
} else {
  console.log('❌ 바이너리 데이터가 없습니다!');
  console.log('현재 받은 데이터 구조:', JSON.stringify(Object.keys(item), null, 2));
  throw new Error('바이너리 데이터를 찾을 수 없습니다. HTTP Request1 노드의 Output을 확인하세요.');
}
```

## 📋 사용 방법

1. **Code 노드에 위 코드 복사**
2. **워크플로우 실행**
3. **Execution Log 확인**
   - Code 노드를 클릭
   - 하단의 "Execution Log" 또는 "Console" 탭 확인
   - 어떤 경로에서 바이너리 데이터를 찾았는지 확인

## 🔍 예상되는 로그 출력

### 성공 시:
```
✅ 바이너리 데이터를 item.binary.data.data에서 찾았습니다.
✅ 바이너리 데이터 발견!
바이너리 데이터 길이: 260096 bytes
Base64 길이: 346794
✅ Base64 변환 성공!
```

### 다른 구조인 경우:
```
=== 바이너리 데이터 구조 탐색 ===
item.binary.data 키 목록: ["data", "mimeType", "fileName"]
키 "data": 타입=object, 길이=260096
✅ 바이너리 데이터를 item.binary.data.data에서 찾았습니다.
```

## ⚠️ 문제 해결

만약 여전히 바이너리 데이터를 찾지 못한다면:

1. **HTTP Request1 노드의 Output 확인**
   - HTTP Request1 노드를 클릭
   - Output 탭에서 "Binary" 탭 확인
   - 바이너리 데이터가 실제로 있는지 확인

2. **Code 노드의 Execution Log 확인**
   - 위 코드의 `console.log` 출력 확인
   - 어떤 구조로 데이터가 들어오는지 확인

3. **데이터 구조에 맞게 코드 수정**
   - 로그에서 확인한 실제 구조에 맞게 코드 수정

