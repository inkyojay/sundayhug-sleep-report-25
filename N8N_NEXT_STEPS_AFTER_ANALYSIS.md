# n8n 분석 후 다음 단계 가이드

## ✅ 현재 완료된 단계

1. ✅ Tally Trigger - 폼 제출 감지
2. ✅ HTTP Request - 분석 API 호출 (`POST /api/analyze-from-url`)

---

## 📋 다음 단계 (순서대로)

### 3단계: Code 노드 - analysisId 추출

**목적**: 분석 API 응답에서 `analysisId`를 추출하여 다음 노드에서 사용

**노드 추가**:
- **노드 타입**: Code
- **노드 이름**: "analysisId 추출"

**코드 입력**:
```javascript
const item = $input.first();
const analysisId = item.json.data?.analysisId || item.json.analysisId;

if (!analysisId) {
  throw new Error('analysisId를 찾을 수 없습니다. 응답: ' + JSON.stringify(item.json));
}

console.log('✅ analysisId 추출:', analysisId);

return {
  json: {
    ...item.json,
    analysisId: analysisId
  }
};
```

**확인 사항**:
- 이전 노드(분석 API)와 연결되어 있는지 확인
- Output에서 `analysisId`가 있는지 확인

---

### 4단계: HTTP Request - 슬라이드 조회

**목적**: 생성된 슬라이드를 조회

**노드 추가**:
- **노드 타입**: HTTP Request
- **노드 이름**: "슬라이드 조회"

**설정**:
- **Method**: `GET`
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{{ $json.analysisId }}/slides`
- **Response Format**: `JSON`

**확인 사항**:
- URL에 `{{ $json.analysisId }}`가 올바르게 들어갔는지 확인
- 이전 노드(analysisId 추출)와 연결되어 있는지 확인

**예상 응답**:
```json
{
  "success": true,
  "data": {
    "analysisId": "uuid",
    "slides": ["base64...", "base64..."],
    "slideCount": 5,
    "instagramId": "2222",
    "phoneNumber": "+821051555837"
  }
}
```

---

### 5단계: Code 노드 - 슬라이드 변환

**목적**: Base64 문자열 배열을 n8n에서 사용할 수 있는 바이너리 데이터로 변환

**노드 추가**:
- **노드 타입**: Code
- **노드 이름**: "슬라이드 변환"

**코드 입력**:
```javascript
const response = $input.first().json;

if (!response.success || !response.data || !response.data.slides) {
  throw new Error('슬라이드 데이터를 찾을 수 없습니다. 응답: ' + JSON.stringify(response));
}

const slidesData = response.data;
const slides = slidesData.slides;

console.log(`📊 슬라이드 개수: ${slides.length}`);
console.log(`📸 인스타그램 ID: ${slidesData.instagramId}`);
console.log(`🆔 분석 ID: ${slidesData.analysisId}`);

// 각 슬라이드를 개별 아이템으로 변환
const items = slides.map((base64String, index) => {
  try {
    // Base64 문자열을 Buffer로 변환
    const buffer = Buffer.from(base64String, 'base64');
    
    console.log(`✅ 슬라이드 ${index + 1}/${slides.length} 변환 완료 (${buffer.length} bytes)`);
    
    return {
      json: {
        slideIndex: index + 1,
        totalSlides: slides.length,
        instagramId: slidesData.instagramId,
        analysisId: slidesData.analysisId,
        phoneNumber: slidesData.phoneNumber,
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
    console.error(`❌ 슬라이드 ${index + 1} 변환 실패:`, error.message);
    throw new Error(`슬라이드 ${index + 1} 변환 실패: ${error.message}`);
  }
});

console.log(`✅ 총 ${items.length}개의 슬라이드 아이템 생성 완료`);

return items;
```

**확인 사항**:
- 이전 노드(슬라이드 조회)와 연결되어 있는지 확인
- Output에서 `binary.data`가 있는지 확인

---

### 6단계: Loop Over Items (선택사항)

**목적**: 각 슬라이드를 개별적으로 처리

**노드 추가**:
- **노드 타입**: Loop Over Items
- **노드 이름**: "각 슬라이드 처리"

**설정**:
- 기본 설정 사용

**확인 사항**:
- 이전 노드(슬라이드 변환)와 연결되어 있는지 확인
- 각 슬라이드가 개별 아이템으로 처리되는지 확인

---

### 7단계: 다음 노드 (사용자가 구성)

**옵션**:
- Instagram DM 전송
- 이메일 전송
- 다른 워크플로우 트리거
- 등등...

---

## 🔍 각 단계별 확인 방법

### 3단계 확인 (analysisId 추출)
- 노드 Output에서 `analysisId` 필드 확인
- 값이 UUID 형식인지 확인

### 4단계 확인 (슬라이드 조회)
- 노드 Output에서 `success: true` 확인
- `data.slides` 배열이 있는지 확인
- `slideCount`가 0보다 큰지 확인

### 5단계 확인 (슬라이드 변환)
- 노드 Output에서 여러 아이템이 생성되었는지 확인
- 각 아이템에 `binary.data`가 있는지 확인
- `json.slideIndex`, `json.totalSlides` 확인

---

## ⚠️ 문제 해결

### 문제 1: analysisId를 찾을 수 없음

**증상**: Code 노드에서 "analysisId를 찾을 수 없습니다" 에러

**해결**:
1. 이전 노드(분석 API)의 Output 확인
2. 응답 구조 확인:
   - `data.analysisId` 또는
   - `analysisId` (최상위)
3. Code 노드 코드 수정 (위 코드 사용)

---

### 문제 2: 슬라이드가 없음

**증상**: 슬라이드 조회 API에서 "슬라이드가 아직 생성되지 않았습니다" 에러

**해결**:
1. 분석 API가 성공했는지 확인
2. Railway 로그에서 슬라이드 생성 로그 확인:
   - `📊 슬라이드 생성 시작...`
   - `✅ 슬라이드 생성 완료: X개`
3. 슬라이드 생성이 실패했다면:
   - `POST /api/analysis/{analysisId}/generate-slides` 호출
   - 또는 분석 API를 다시 실행

---

### 문제 3: 슬라이드 변환 실패

**증상**: Code 노드에서 "슬라이드 변환 실패" 에러

**해결**:
1. 슬라이드 조회 API 응답 확인
2. `data.slides` 배열이 올바른지 확인
3. Base64 문자열이 유효한지 확인

---

## 📝 체크리스트

- [ ] Code 노드 (analysisId 추출) 추가 및 연결
- [ ] HTTP Request 노드 (슬라이드 조회) 추가 및 연결
- [ ] Code 노드 (슬라이드 변환) 추가 및 연결
- [ ] 각 노드의 Output 확인
- [ ] Loop Over Items 노드 추가 (선택사항)
- [ ] 다음 노드 구성 (DM 전송 등)

---

## 🎯 빠른 시작

1. **Code 노드 추가** → 위의 "analysisId 추출" 코드 복사
2. **HTTP Request 노드 추가** → GET `/api/analysis/{{ $json.analysisId }}/slides`
3. **Code 노드 추가** → 위의 "슬라이드 변환" 코드 복사
4. **각 노드 연결** → 순서대로 연결
5. **테스트** → Execute Workflow 실행

---

다음 단계를 진행하시겠어요? 특정 단계에서 막히면 알려주세요!

