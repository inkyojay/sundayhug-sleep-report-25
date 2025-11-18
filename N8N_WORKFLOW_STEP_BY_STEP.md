# n8n 워크플로우 구성 가이드 (단계별)

## 🎯 전체 워크플로우 구조

```
1. Tally Trigger (또는 Webhook)
   ↓
2. HTTP Request (분석 API 호출) ← 업로드/분석
   - POST /api/analyze-from-url
   ↓
3. HTTP Request (슬라이드 조회) ← 다운로드
   - GET /api/analysis/{analysisId}/slides
   ↓
4. Code 노드 (슬라이드 변환)
   ↓
5. Loop Over Items (각 슬라이드 처리)
   ↓
6. Instagram/이메일/기타 전송
```

---

## 📋 단계별 설정

### 1단계: 분석 API 호출 (업로드/분석)

**HTTP Request 노드** 이름: `분석 API 호출`

- **Method**: `POST`
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze-from-url`
- **Authentication**: `None`
- **Body Content Type**: `JSON`
- **Send Body**: `Yes`
- **JSON Body**:
```json
{
  "imageUrl": "{{ $json.question_4rR8Rk }}",
  "birthDate": "{{ $json.birthDate }}",
  "phoneNumber": "{{ $json.phoneNumber }}",
  "instagramId": "{{ $json.instagramId }}"
}
```

**응답 예시**:
```json
{
  "success": true,
  "data": { ... },
  "analysisId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**중요**: `analysisId`를 다음 노드에서 사용해야 합니다!

---

### 2단계: 슬라이드 조회 (다운로드)

**HTTP Request 노드** 이름: `슬라이드 조회`

⚠️ **현재 문제**: URL이 기본 URL만 설정되어 있습니다!

**올바른 설정**:

- **Method**: `GET`
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{{ $json.analysisId }}/slides`
  - ⚠️ **중요**: `/api/analysis/{{ $json.analysisId }}/slides` 경로를 포함해야 합니다!
- **Authentication**: `None`
- **Send Query Parameters**: `No`
- **Send Headers**: `No`
- **Send Body**: `No`

**URL 예시**:
```
https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/550e8400-e29b-41d4-a716-446655440000/slides
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "analysisId": "550e8400-e29b-41d4-a716-446655440000",
    "slides": [
      "iVBORw0KGgoAAAANSUhEUgAA...",  // Base64 문자열 1
      "iVBORw0KGgoAAAANSUhEUgAA...",  // Base64 문자열 2
      ...
    ],
    "slideCount": 5,
    "instagramId": "@user_instagram",
    "phoneNumber": "010-1234-5678",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 3단계: 슬라이드 변환 (Code 노드)

**Code 노드** 이름: `슬라이드 변환`

```javascript
// 이전 노드에서 슬라이드 데이터 받기
const response = $input.first().json;

if (!response.success || !response.data || !response.data.slides) {
  throw new Error('슬라이드 데이터를 찾을 수 없습니다.');
}

const slidesData = response.data;
const slides = slidesData.slides;
const instagramId = slidesData.instagramId;
const analysisId = slidesData.analysisId;

console.log(`슬라이드 개수: ${slides.length}`);
console.log(`인스타그램 ID: ${instagramId}`);
console.log(`분석 ID: ${analysisId}`);

// 각 슬라이드를 개별 아이템으로 변환
const items = slides.map((base64String, index) => {
  try {
    // Base64 문자열을 Buffer로 변환
    const buffer = Buffer.from(base64String, 'base64');
    
    console.log(`슬라이드 ${index + 1}/${slides.length} 변환 완료 (${buffer.length} bytes)`);
    
    return {
      json: {
        slideIndex: index + 1,
        totalSlides: slides.length,
        instagramId: instagramId,
        analysisId: analysisId,
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
    console.error(`슬라이드 ${index + 1} 변환 실패:`, error.message);
    throw new Error(`슬라이드 ${index + 1} 변환 실패: ${error.message}`);
  }
});

console.log(`✅ 총 ${items.length}개의 슬라이드 아이템 생성 완료`);

return items;
```

---

### 4단계: Loop Over Items (각 슬라이드 처리)

**Loop Over Items 노드**:
- **Mode**: `Process All Items`
- 각 슬라이드를 개별적으로 처리

---

### 5단계: 전송 (Instagram/이메일/기타)

**Instagram DM** 또는 **이메일** 또는 **기타 방법** 사용

---

## 🔧 현재 문제 해결

### 문제: "invalid input syntax for type uuid: '12345'"

**원인**: 
1. URL이 기본 URL만 설정되어 있음
2. `analysisId`가 URL 경로에 포함되지 않음

**해결**:

1. **HTTP Request 노드 (슬라이드 조회) 설정 확인**:
   - URL을 다음으로 변경:
   ```
   https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{{ $json.analysisId }}/slides
   ```

2. **이전 노드에서 `analysisId` 확인**:
   - "분석 API 호출" 노드의 Output 확인
   - `analysisId` 필드가 있는지 확인
   - 예: `{{ $json.analysisId }}`

3. **URL 변수 사용 확인**:
   - n8n에서 `{{ $json.analysisId }}`가 올바르게 해석되는지 확인
   - Execute Workflow 실행 후 실제 URL 확인

---

## 📝 완전한 워크플로우 예시

### 노드 1: Tally Trigger
- 기본 설정 유지

### 노드 2: 분석 API 호출
- **Method**: `POST`
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze-from-url`
- **Body**: 
```json
{
  "imageUrl": "{{ $json.question_4rR8Rk }}",
  "birthDate": "{{ $json.birthDate }}",
  "phoneNumber": "{{ $json.phoneNumber }}",
  "instagramId": "{{ $json.instagramId }}"
}
```

### 노드 3: 슬라이드 조회
- **Method**: `GET`
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{{ $json.analysisId }}/slides`
  - ⚠️ **중요**: `{{ $json.analysisId }}`를 포함해야 합니다!

### 노드 4: 슬라이드 변환
- 위의 Code 노드 코드 사용

### 노드 5: Loop Over Items
- 기본 설정

### 노드 6: 전송
- Instagram/이메일/기타

---

## ✅ 체크리스트

- [ ] 분석 API 호출 노드가 정상 작동하는지 확인
- [ ] 분석 API 응답에 `analysisId`가 있는지 확인
- [ ] 슬라이드 조회 노드의 URL이 올바른지 확인
  - [ ] `/api/analysis/` 경로 포함
  - [ ] `{{ $json.analysisId }}` 변수 포함
  - [ ] `/slides` 경로 포함
- [ ] Code 노드에서 슬라이드 변환이 올바른지 확인
- [ ] 각 슬라이드가 올바르게 처리되는지 확인

---

## 🔍 디버깅

### 슬라이드 조회 노드가 실패하는 경우

1. **이전 노드 Output 확인**:
   - "분석 API 호출" 노드 클릭
   - Output 탭에서 `analysisId` 확인
   - 실제 UUID 값 확인 (예: `550e8400-e29b-41d4-a716-446655440000`)

2. **URL 확인**:
   - "슬라이드 조회" 노드의 URL이 올바른지 확인
   - Execute Workflow 실행 후 실제 요청 URL 확인
   - 브라우저 개발자 도구에서 네트워크 요청 확인

3. **에러 메시지 확인**:
   - "invalid input syntax for type uuid" → UUID 형식이 잘못됨
   - "Analysis not found" → 분석 ID가 존재하지 않음
   - "슬라이드가 아직 생성되지 않았습니다" → 슬라이드가 아직 생성되지 않음

---

## 🚀 다음 단계

1. **슬라이드 조회 노드 URL 수정**
2. **워크플로우 테스트**
3. **전송 방법 설정** (Instagram/이메일/기타)

