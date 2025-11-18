# n8n 워크플로우 간단 가이드

## 🎯 목표
Tally 폼 제출 → 분석 → 슬라이드 생성 → 이미지 변환 → DM 전송

---

## ✅ 최종 워크플로우 (간단 버전)

```
1. Tally Trigger
   ↓
2. HTTP Request (분석 API)
   - POST /api/analyze-from-url
   - 슬라이드 자동 생성됨 ✅
   ↓
3. Code 노드 (analysisId 추출)
   ↓
4. HTTP Request (슬라이드 조회)
   - GET /api/analysis/{analysisId}/slides
   ↓
5. Code 노드 (슬라이드 변환)
   - Base64 배열 → 바이너리 배열 변환
   ↓
6. 다음 노드 (DM 전송 등)
```

**중요**: Split Out, Loop Over Items는 필요 없습니다! n8n이 자동으로 처리합니다.

---

## 📋 각 노드 설정

### 1. Tally Trigger
- 이미 설정되어 있음 ✅
- Output: `{ question_4rR8Rk: "이미지URL", question_VJaPlj: "생년월일", ... }`

---

### 2. HTTP Request (분석 API)

**노드 이름**: "분석 API 호출"

**설정**:
- **Method**: `POST`
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze-from-url`
- **Body Content Type**: `JSON`
- **Body (JSON)**:
```json
{
  "imageUrl": "{{ $json.question_4rR8Rk }}",
  "birthDate": "{{ $json.question_VJaPlj }}",
  "phoneNumber": "{{ $json.question_PON9E1 }}",
  "instagramId": "{{ $json.question_EWGl1l }}"
}
```

**예상 응답**:
```json
{
  "success": true,
  "data": { ... },
  "analysisId": "uuid-here"
}
```

---

### 3. Code 노드 (analysisId 추출)

**노드 이름**: "analysisId 추출"

**코드**:
```javascript
const item = $input.first();
const analysisId = item.json.data?.analysisId || item.json.analysisId;

if (!analysisId) {
  throw new Error('analysisId를 찾을 수 없습니다.');
}

return {
  json: {
    ...item.json,
    analysisId: analysisId
  }
};
```

---

### 4. HTTP Request (슬라이드 조회)

**노드 이름**: "슬라이드 조회"

**설정**:
- **Method**: `GET`
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{{ $json.analysisId }}/slides`
- **Response Format**: `JSON`

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

### 5. Code 노드 (슬라이드 변환) ⭐ 핵심!

**노드 이름**: "슬라이드 변환"

**코드**:
```javascript
const response = $input.first().json;

// 응답 구조 확인
if (!response.success || !response.data || !response.data.slides) {
  throw new Error('슬라이드 데이터를 찾을 수 없습니다.');
}

const slidesData = response.data;
const slides = slidesData.slides;

if (!Array.isArray(slides) || slides.length === 0) {
  throw new Error('슬라이드 배열이 비어있습니다.');
}

console.log(`📊 슬라이드 개수: ${slides.length}`);

// 각 슬라이드를 개별 아이템으로 변환
const items = slides.map((base64String, index) => {
  try {
    // Base64 문자열을 Buffer로 변환
    const buffer = Buffer.from(base64String, 'base64');
    
    if (buffer.length === 0) {
      throw new Error(`슬라이드 ${index + 1}의 Buffer가 비어있습니다.`);
    }
    
    console.log(`✅ 슬라이드 ${index + 1}/${slides.length} 변환 완료 (${buffer.length} bytes)`);
    
    // n8n 바이너리 형식으로 반환
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
    throw error;
  }
});

console.log(`✅ 총 ${items.length}개의 슬라이드 아이템 생성 완료`);

return items;
```

**중요**: 이 Code 노드는 배열을 반환합니다. n8n이 자동으로 각 아이템을 처리합니다!

---

### 6. 다음 노드 (DM 전송 등)

이제 각 슬라이드가 개별 아이템으로 처리됩니다:
- `json.slideIndex`: 슬라이드 번호
- `json.instagramId`: 인스타그램 ID
- `binary.data`: 이미지 데이터

---

## 🚫 제거할 노드들

다음 노드들은 **제거**하세요:
- ❌ Convert Image to Base64
- ❌ upload
- ❌ Split Out
- ❌ Loop Over Items
- ❌ Code in JavaScript1
- ❌ Code in JavaScript2

---

## ✅ 최종 워크플로우 구조

```
Tally Trigger
  ↓
HTTP Request (분석 API)
  ↓
Code 노드 (analysisId 추출)
  ↓
HTTP Request (슬라이드 조회)
  ↓
Code 노드 (슬라이드 변환) ← 5개 아이템 자동 생성
  ↓
다음 노드 (DM 전송 등) ← 자동으로 5번 실행됨
```

---

## 🎯 확인 사항

1. **분석 API 실행**
   - `analysisId`가 반환되는지 확인

2. **슬라이드 조회 실행**
   - `success: true` 확인
   - `data.slides` 배열이 5개인지 확인

3. **슬라이드 변환 실행**
   - Output에서 5개 아이템 확인
   - 각 아이템에 "Binary" 탭 확인
   - View/Download 버튼 테스트

---

## 💡 핵심 포인트

1. **Split Out, Loop Over Items 불필요**
   - n8n이 자동으로 배열의 각 아이템을 처리합니다

2. **Code 노드에서 배열 반환**
   - `return items;` (배열)
   - n8n이 자동으로 각 아이템에 대해 다음 노드를 실행합니다

3. **바이너리 형식**
   ```javascript
   binary: {
     data: {
       data: buffer,
       mimeType: 'image/png',
       fileName: 'filename.png'
     }
   }
   ```

---

## 🔧 문제 해결

### 문제: 바이너리 데이터가 안 보임
- Code 노드의 "Binary" 탭 확인
- 바이너리 형식이 올바른지 확인

### 문제: 슬라이드가 없음
- Railway 로그에서 슬라이드 생성 확인
- 슬라이드 조회 API 응답 확인

### 문제: 에러 발생
- 각 노드의 Output 확인
- Console 로그 확인

---

위 구조로 간단하게 다시 구성하세요!

