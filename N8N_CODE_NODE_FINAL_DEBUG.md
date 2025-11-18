# n8n Code 노드 - 최종 디버깅 버전

## 🔴 문제: Base64가 20자로 너무 짧음

이 코드는 HTTP Request1 노드의 Output 구조를 완전히 분석하여 바이너리 데이터의 정확한 위치를 찾습니다.

```javascript
// 이전 노드에서 데이터 받기
const item = $input.first();

// ========== 전체 데이터 구조 완전 분석 ==========
console.log('=== 🔍 전체 아이템 구조 분석 ===');
console.log('아이템 최상위 키:', Object.keys(item));

// JSON 데이터 확인
if (item.json) {
  console.log('=== 📄 JSON 데이터 ===');
  console.log('JSON 키:', Object.keys(item.json));
}

// 바이너리 데이터 완전 분석
console.log('=== 📦 바이너리 데이터 완전 분석 ===');
console.log('item.binary 존재:', !!item.binary);

if (item.binary) {
  console.log('item.binary 최상위 키:', Object.keys(item.binary));
  
  // 모든 가능한 경로 확인
  const pathsToCheck = [
    'item.binary.data',
    'item.binary.data.data',
    'item.binary.data.buffer',
    'item.binary.data.content',
    'item.binary.data.file',
    'item.binary.data',
  ];
  
  let foundBinary = null;
  let foundPath = null;
  let foundMimeType = 'image/jpeg';
  
  // 경로 1: item.binary.data.data
  if (item.binary.data && item.binary.data.data) {
    const data = item.binary.data.data;
    console.log('경로 1 - item.binary.data.data:', {
      타입: typeof data,
      Buffer인가: Buffer.isBuffer(data),
      길이: data && data.length ? data.length : 'N/A',
      처음_10바이트: data && data.length ? Array.from(data.slice(0, 10)) : 'N/A'
    });
    
    if (data && (Buffer.isBuffer(data) || data instanceof ArrayBuffer || (typeof data === 'object' && data.length > 0))) {
      foundBinary = Buffer.isBuffer(data) ? data : Buffer.from(data);
      foundPath = 'item.binary.data.data';
      foundMimeType = item.binary.data.mimeType || item.binary.data.mime || 'image/jpeg';
    }
  }
  
  // 경로 2: item.binary.data (직접 Buffer)
  if (!foundBinary && item.binary.data) {
    const data = item.binary.data;
    console.log('경로 2 - item.binary.data:', {
      타입: typeof data,
      Buffer인가: Buffer.isBuffer(data),
      ArrayBuffer인가: data instanceof ArrayBuffer,
      길이: data && data.length ? data.length : 'N/A'
    });
    
    if (Buffer.isBuffer(data)) {
      foundBinary = data;
      foundPath = 'item.binary.data';
      foundMimeType = item.binary.mimeType || 'image/jpeg';
    }
  }
  
  // 경로 3: item.binary.data의 모든 속성 확인
  if (!foundBinary && item.binary.data) {
    console.log('=== item.binary.data 전체 구조 ===');
    console.log('키 목록:', Object.keys(item.binary.data));
    
    for (const key of Object.keys(item.binary.data)) {
      const value = item.binary.data[key];
      const valueType = typeof value;
      const isBuffer = Buffer.isBuffer(value);
      const isArrayBuffer = value instanceof ArrayBuffer;
      const hasLength = value && typeof value.length === 'number';
      const length = hasLength ? value.length : 'N/A';
      
      console.log(`키 "${key}":`, {
        타입: valueType,
        Buffer인가: isBuffer,
        ArrayBuffer인가: isArrayBuffer,
        길이: length
      });
      
      // 바이너리 데이터 후보 확인
      if (isBuffer || isArrayBuffer || (valueType === 'object' && hasLength && length > 100)) {
        console.log(`✅ 후보 발견: item.binary.data.${key}`);
        
        try {
          const buffer = isBuffer ? value : Buffer.from(value);
          if (buffer.length > 100) {
            foundBinary = buffer;
            foundPath = `item.binary.data.${key}`;
            foundMimeType = item.binary.data.mimeType || item.binary.data.mime || 'image/jpeg';
            break;
          }
        } catch (e) {
          console.log(`키 "${key}" 변환 실패:`, e.message);
        }
      }
    }
  }
  
  // 경로 4: item.binary의 다른 키 확인
  if (!foundBinary) {
    console.log('=== item.binary의 다른 키 확인 ===');
    for (const key of Object.keys(item.binary)) {
      if (key !== 'data') {
        const value = item.binary[key];
        console.log(`키 "${key}":`, {
          타입: typeof value,
          Buffer인가: Buffer.isBuffer(value),
          길이: value && value.length ? value.length : 'N/A'
        });
      }
    }
  }
  
  // 바이너리 데이터를 찾았는지 확인
  if (foundBinary) {
    console.log(`✅ 바이너리 데이터 발견! 경로: ${foundPath}`);
    console.log('바이너리 데이터 길이:', foundBinary.length, 'bytes');
    console.log('MIME 타입:', foundMimeType);
    
    // Base64로 변환
    const base64String = Buffer.from(foundBinary).toString('base64').replace(/\s/g, '');
    
    console.log('Base64 길이:', base64String.length);
    console.log('Base64 시작 50자:', base64String.substring(0, 50));
    
    // Base64 길이 검증
    if (base64String.length < 100) {
      console.log('⚠️ Base64 문자열이 너무 짧습니다!');
      console.log('찾은 경로:', foundPath);
      console.log('바이너리 데이터 길이:', foundBinary.length);
      throw new Error(`Base64 문자열이 너무 짧습니다 (${base64String.length}자). 경로: ${foundPath}, 바이너리 길이: ${foundBinary.length}`);
    }
    
    console.log('✅ Base64 변환 성공!');
    
    // Tally form에서 받은 추가 데이터도 함께 전달
    return {
      json: {
        imageBase64: `data:${foundMimeType};base64,${base64String}`,
        birthDate: item.json?.birthDate || item.json?.question_생년월일 || "2024-01-15",
        phoneNumber: item.json?.phoneNumber || item.json?.question_전화번호 || "010-1234-5678",
        instagramId: item.json?.instagramId || item.json?.question_인스타그램 || "@instagram_id"
      }
    };
  } else {
    // 바이너리 데이터를 찾지 못함
    console.log('❌ 바이너리 데이터를 찾을 수 없습니다.');
    console.log('=== 전체 item.binary 구조 ===');
    console.log(JSON.stringify(item.binary, (key, value) => {
      // Buffer나 큰 배열은 요약만 표시
      if (Buffer.isBuffer(value)) {
        return `[Buffer: ${value.length} bytes]`;
      }
      if (value instanceof ArrayBuffer) {
        return `[ArrayBuffer: ${value.byteLength} bytes]`;
      }
      if (Array.isArray(value) && value.length > 10) {
        return `[Array: ${value.length} items]`;
      }
      return value;
    }, 2));
    
    throw new Error('바이너리 데이터를 찾을 수 없습니다. HTTP Request1 노드의 Output을 확인하고, Execution Log의 전체 구조를 확인하세요.');
  }
} else {
  console.log('❌ item.binary가 없습니다!');
  console.log('전체 아이템 구조:', JSON.stringify(Object.keys(item), null, 2));
  throw new Error('item.binary가 없습니다. HTTP Request1 노드의 Response Format이 "File" 또는 "Binary"로 설정되어 있는지 확인하세요.');
}
```

## 📋 사용 방법

1. **Code 노드에 위 코드 복사**
2. **워크플로우 실행**
3. **Execution Log 확인**
   - Code 노드를 클릭
   - 하단의 "Execution Log" 또는 "Console" 탭 확인
   - **모든 로그를 복사해서 공유해주세요**

## 🔍 확인할 내용

Execution Log에서 다음을 확인하세요:

1. **"✅ 바이너리 데이터 발견!" 메시지가 나오는가?**
2. **어떤 경로에서 찾았는가?** (예: `item.binary.data.data`)
3. **바이너리 데이터 길이는?** (예: 260096 bytes)
4. **Base64 길이는?** (예: 346794)

만약 "❌ 바이너리 데이터를 찾을 수 없습니다"가 나온다면:
- Execution Log의 **전체 구조**를 복사해서 공유해주세요
- 특히 `=== 전체 item.binary 구조 ===` 부분을 확인하세요

