# API 문서 - n8n 연동 가이드

## 개요

아기 수면 환경 AI 분석기 API는 n8n 워크플로우에서 호출할 수 있는 REST API 엔드포인트를 제공합니다.

**Base URL**: `https://your-railway-domain.railway.app`

---

## API 엔드포인트

### 1. 이미지 분석 (분석만 수행)

**엔드포인트**: `POST /api/analyze`

**설명**: 이미지를 분석하고 결과를 반환합니다. 데이터베이스에는 저장하지 않습니다.

**Request Body**:
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "birthDate": "2024-01-15"
}
```

**파라미터**:
- `imageBase64` (string, 필수): Base64로 인코딩된 이미지 데이터. `data:image/jpeg;base64,` 접두사 포함 또는 제외 가능
- `birthDate` (string, 필수): 아기의 생년월일 (YYYY-MM-DD 형식)

**Response** (성공):
```json
{
  "success": true,
  "data": {
    "summary": "전체 분석 요약...",
    "feedbackItems": [
      {
        "id": 1,
        "x": 45.5,
        "y": 32.1,
        "title": "위험 요소 제목",
        "feedback": "상세 피드백 내용...",
        "riskLevel": "High"
      }
    ],
    "references": [
      {
        "title": "참고 자료 제목",
        "uri": "https://example.com/reference"
      }
    ]
  }
}
```

**Response** (에러):
```json
{
  "success": false,
  "error": "에러 메시지"
}
```

---

### 2. 이미지 분석 및 저장

**엔드포인트**: `POST /api/analyze-and-save`

**설명**: 이미지를 분석하고 결과를 Supabase 데이터베이스에 저장합니다.

**Request Body**:
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "birthDate": "2024-01-15"
}
```

**파라미터**:
- `imageBase64` (string, 필수): Base64로 인코딩된 이미지 데이터
- `birthDate` (string, 필수): 아기의 생년월일 (YYYY-MM-DD 형식)

**Response** (성공):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "image_base64": "...",
    "birth_date": "2024-01-15",
    "age_in_months": 6,
    "summary": "전체 분석 요약...",
    "created_at": "2024-07-17T10:30:00Z",
    "sleep_analysis_feedback_items": [
      {
        "id": 1,
        "analysis_id": "uuid-string",
        "item_id": 1,
        "x_coordinate": 45.5,
        "y_coordinate": 32.1,
        "title": "위험 요소 제목",
        "feedback": "상세 피드백 내용...",
        "risk_level": "High"
      }
    ],
    "sleep_analysis_references": [
      {
        "id": 1,
        "analysis_id": "uuid-string",
        "title": "참고 자료 제목",
        "uri": "https://example.com/reference"
      }
    ]
  }
}
```

---

### 3. 헬스 체크

**엔드포인트**: `GET /api/health`

**설명**: API 서버 상태 확인

**Response**:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-07-17T10:30:00.000Z"
}
```

---

## n8n 연동 가이드

### 방법 1: HTTP Request 노드 사용

1. **n8n 워크플로우에 HTTP Request 노드 추가**

2. **노드 설정**:
   - **Method**: `POST`
   - **URL**: `https://your-railway-domain.railway.app/api/analyze`
   - **Authentication**: None (또는 필요시 API 키 추가)

3. **Body 설정**:
   - **Body Content Type**: `JSON`
   - **JSON Body**:
   ```json
   {
     "imageBase64": "{{ $json.imageBase64 }}",
     "birthDate": "{{ $json.birthDate }}"
   }
   ```

4. **이미지 처리 예시**:
   - 파일을 읽어서 Base64로 변환하는 노드 추가
   - 또는 웹훅에서 받은 이미지를 Base64로 변환

### 방법 2: 이미지 파일을 Base64로 변환

**n8n 워크플로우 예시**:

```
1. Webhook (이미지 파일 수신)
   ↓
2. Read Binary File (또는 HTTP Request로 이미지 다운로드)
   ↓
3. Code 노드 (Base64 변환)
   ↓
4. HTTP Request (API 호출)
   ↓
5. 결과 처리
```

**Code 노드 예시** (Base64 변환):
```javascript
// 이전 노드에서 바이너리 데이터를 받음
const binaryData = $input.first().binary.data.data;

// Base64로 변환
const base64String = Buffer.from(binaryData).toString('base64');
const mimeType = $input.first().binary.data.mimeType || 'image/jpeg';

// API 요청 형식으로 변환
return {
  json: {
    imageBase64: `data:${mimeType};base64,${base64String}`,
    birthDate: "2024-01-15" // 실제 생년월일로 변경
  }
};
```

### 방법 3: URL에서 이미지 다운로드 후 분석

**n8n 워크플로우**:
```
1. Manual Trigger (또는 Schedule)
   ↓
2. HTTP Request (이미지 URL에서 다운로드)
   - Method: GET
   - Response Format: File
   ↓
3. Code 노드 (Base64 변환)
   ↓
4. HTTP Request (분석 API 호출)
   ↓
5. 결과를 다른 시스템으로 전송 (예: Slack, Email 등)
```

---

## 에러 처리

### 일반적인 에러 코드

- **400 Bad Request**: 필수 파라미터 누락 또는 형식 오류
- **500 Internal Server Error**: 서버 내부 오류 (API 키 오류, Gemini API 오류 등)

### n8n에서 에러 처리

HTTP Request 노드에서:
- **Continue On Fail**: 활성화
- **Error Workflow**: 에러 발생 시 별도 워크플로우 실행 가능

---

## 예시 워크플로우

### 예시 1: 이메일 첨부 이미지 분석

```
1. Email Trigger (Gmail, Outlook 등)
   - 첨부 파일이 있을 때 트리거
   ↓
2. Code 노드 (첨부 파일 Base64 변환)
   ↓
3. HTTP Request (분석 API 호출)
   - URL: https://your-domain.railway.app/api/analyze-and-save
   ↓
4. Code 노드 (결과 포맷팅)
   ↓
5. Email 노드 (분석 결과 이메일 전송)
```

### 예시 2: 슬랙에서 이미지 업로드 시 분석

```
1. Slack Trigger (파일 업로드)
   ↓
2. HTTP Request (Slack 파일 다운로드)
   ↓
3. Code 노드 (Base64 변환)
   ↓
4. HTTP Request (분석 API 호출)
   ↓
5. Slack 노드 (분석 결과 슬랙 메시지 전송)
```

### 예시 3: 정기적인 이미지 분석 리포트

```
1. Schedule Trigger (매일 오전 9시)
   ↓
2. Google Drive 노드 (특정 폴더 이미지 목록)
   ↓
3. Loop Over Items
   ↓
4. HTTP Request (각 이미지 다운로드)
   ↓
5. Code 노드 (Base64 변환)
   ↓
6. HTTP Request (분석 API 호출)
   ↓
7. Google Sheets 노드 (결과 저장)
```

---

## 보안 고려사항

1. **API 키 보호**: Railway 환경 변수에 `GEMINI_API_KEY` 설정
2. **Rate Limiting**: 필요시 n8n에서 요청 빈도 제한
3. **이미지 크기**: Base64 인코딩 시 파일 크기 증가 고려 (50MB 제한)

---

## 테스트

### cURL로 테스트

```bash
curl -X POST https://your-domain.railway.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "birthDate": "2024-01-15"
  }'
```

### n8n에서 테스트

1. HTTP Request 노드 추가
2. Method: POST
3. URL: `https://your-domain.railway.app/api/health`
4. Execute Node 클릭하여 연결 확인

---

## 지원

문제가 발생하거나 질문이 있으시면 프로젝트 이슈를 생성해주세요.

