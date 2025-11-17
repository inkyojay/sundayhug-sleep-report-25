# n8n API 사용 가이드

## 🚀 빠른 시작

**API Base URL**: `https://sundayhug-sleep-report-25-production.up.railway.app`

---

## 📋 API 엔드포인트 목록

### 1. 헬스 체크 (연결 확인용)
- **Method**: `GET`
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/health`
- **설명**: API 서버가 정상 작동하는지 확인

### 2. 이미지 분석 (분석만 수행)
- **Method**: `POST`
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze`
- **설명**: 이미지를 분석하고 결과만 반환 (데이터베이스 저장 안 함)

### 3. 이미지 분석 및 저장
- **Method**: `POST`
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze-and-save`
- **설명**: 이미지를 분석하고 Supabase 데이터베이스에 저장

---

## 🔧 n8n 설정 방법

### 방법 1: HTTP Request 노드 사용 (가장 간단)

#### 1단계: HTTP Request 노드 추가
1. n8n 워크플로우에 **HTTP Request** 노드 추가
2. 노드 더블클릭하여 설정 열기

#### 2단계: 기본 설정
- **Method**: `POST`
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze`
- **Authentication**: None (또는 필요시 추가)

#### 3단계: Body 설정
- **Body Content Type**: `JSON`
- **JSON Body**:
```json
{
  "imageBase64": "{{ $json.imageBase64 }}",
  "birthDate": "{{ $json.birthDate }}",
  "phoneNumber": "{{ $json.phoneNumber }}",
  "instagramId": "{{ $json.instagramId }}"
}
```

---

## 📸 이미지 준비 방법

### 방법 A: URL에서 이미지 다운로드 후 Base64 변환

**워크플로우 구조**:
```
1. Manual Trigger (또는 다른 트리거)
   ↓
2. HTTP Request (이미지 URL에서 다운로드)
   - Method: GET
   - URL: 이미지 URL
   - Response Format: File
   ↓
3. Code 노드 (Base64 변환)
   ↓
4. HTTP Request (분석 API 호출)
   ↓
5. 결과 처리
```

**Code 노드 (3단계) 예시**:
```javascript
// 이전 노드에서 바이너리 데이터 받기
const binaryData = $input.first().binary.data.data;
const mimeType = $input.first().binary.data.mimeType || 'image/jpeg';

// Base64로 변환
const base64String = Buffer.from(binaryData).toString('base64');

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

### 방법 B: 파일 업로드 후 Base64 변환

**워크플로우 구조**:
```
1. Webhook (파일 업로드)
   ↓
2. Read Binary File (또는 파일 읽기)
   ↓
3. Code 노드 (Base64 변환)
   ↓
4. HTTP Request (분석 API 호출)
```

**Code 노드 예시**:
```javascript
const binaryData = $input.first().binary.data.data;
const mimeType = $input.first().binary.data.mimeType || 'image/jpeg';
const base64String = Buffer.from(binaryData).toString('base64');

return {
  json: {
    imageBase64: `data:${mimeType};base64,${base64String}`,
    birthDate: "2024-01-15", // 실제 생년월일로 변경 (YYYY-MM-DD 형식)
    phoneNumber: "010-1234-5678", // 선택사항
    instagramId: "@instagram_id" // 선택사항
  }
};
```

### 방법 C: 직접 Base64 문자열 사용

이미 Base64 문자열이 있다면:
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "birthDate": "2024-01-15",
  "phoneNumber": "010-1234-5678",
  "instagramId": "@instagram_id"
}
```

---

## 📝 API 요청 예시

### 요청 (Request)

**URL**: `POST https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "birthDate": "2024-01-15",
  "phoneNumber": "010-1234-5678",
  "instagramId": "@instagram_id"
}
```

**파라미터 설명**:
- `imageBase64` (필수): Base64로 인코딩된 이미지 데이터
  - `data:image/jpeg;base64,` 접두사 포함 또는 제외 가능
  - 예: `"data:image/jpeg;base64,/9j/4AAQ..."` 또는 `"/9j/4AAQ..."`
- `birthDate` (필수): 아기의 생년월일 (YYYY-MM-DD 형식)
  - 예: `"2024-01-15"`
- `phoneNumber` (선택사항): 전화번호
  - 예: `"010-1234-5678"` 또는 `"01012345678"`
- `instagramId` (선택사항): 인스타그램 ID
  - 예: `"@instagram_id"` 또는 `"instagram_id"`

### 응답 (Response)

**성공 응답** (200 OK):
```json
{
  "success": true,
  "data": {
    "summary": "전체 분석 요약 내용...",
    "feedbackItems": [
      {
        "id": 1,
        "x": 45.5,
        "y": 32.1,
        "title": "위험 요소 제목",
        "feedback": "상세 피드백 내용...",
        "riskLevel": "High"
      },
      {
        "id": 2,
        "x": 60.0,
        "y": 50.0,
        "title": "주의사항",
        "feedback": "주의사항 내용...",
        "riskLevel": "Medium"
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

**에러 응답** (400/500):
```json
{
  "success": false,
  "error": "에러 메시지"
}
```

---

## 🎯 실제 사용 예시

### 예시 1: 슬랙에서 이미지 업로드 시 분석

**워크플로우**:
```
1. Slack Trigger (파일 업로드)
   ↓
2. HTTP Request (Slack 파일 다운로드)
   - URL: {{ $json.file.url_private }}
   - Authentication: Bearer Token (Slack Bot Token)
   - Response Format: File
   ↓
3. Code 노드 (Base64 변환)
   ↓
4. HTTP Request (분석 API 호출)
   - URL: https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze
   - Method: POST
   - Body: JSON
   ↓
5. Code 노드 (결과 포맷팅)
   ↓
6. Slack 노드 (분석 결과 전송)
```

**Code 노드 (3단계)**:
```javascript
const binaryData = $input.first().binary.data.data;
const mimeType = $input.first().binary.data.mimeType || 'image/jpeg';
const base64String = Buffer.from(binaryData).toString('base64');

return {
  json: {
    imageBase64: `data:${mimeType};base64,${base64String}`,
    birthDate: "2024-01-15", // 실제 생년월일로 변경 (YYYY-MM-DD 형식)
    phoneNumber: "010-1234-5678", // 선택사항
    instagramId: "@instagram_id" // 선택사항
  }
};
```

**Code 노드 (5단계 - 결과 포맷팅)**:
```javascript
const result = $input.first().json.data;
const summary = result.summary;
const feedbackItems = result.feedbackItems;

let message = `📊 수면 환경 분석 결과\n\n${summary}\n\n`;

feedbackItems.forEach((item, index) => {
  const emoji = item.riskLevel === 'High' ? '🔴' : 
                item.riskLevel === 'Medium' ? '🟡' : 
                item.riskLevel === 'Low' ? '🟢' : 'ℹ️';
  message += `${emoji} ${item.title}\n${item.feedback}\n\n`;
});

return {
  json: {
    message: message
  }
};
```

### 예시 2: 이메일 첨부 파일 분석

**워크플로우**:
```
1. Email Trigger (Gmail, Outlook 등)
   - 조건: 첨부 파일 있음
   ↓
2. Code 노드 (첨부 파일 Base64 변환)
   ↓
3. HTTP Request (분석 API 호출)
   ↓
4. Email 노드 (분석 결과 이메일 전송)
```

### 예시 3: 정기적인 이미지 분석 리포트

**워크플로우**:
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

## 🔍 헬스 체크 테스트

먼저 API가 정상 작동하는지 확인:

**n8n 설정**:
- **Method**: `GET`
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/health`

**예상 응답**:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-11-17T07:30:00.000Z",
  "geminiConfigured": true
}
```

---

## ⚠️ 주의사항

1. **이미지 크기**: Base64 인코딩 시 파일 크기가 약 33% 증가합니다
   - 1MB 이미지 → 약 1.33MB Base64 문자열
   - API 요청 크기 제한: 50MB

2. **생년월일 형식**: 반드시 `YYYY-MM-DD` 형식 사용
   - ✅ 올바름: `"2024-01-15"`
   - ❌ 잘못됨: `"2024/01/15"`, `"01-15-2024"`

3. **Base64 형식**: 
   - `data:image/jpeg;base64,` 접두사 포함 또는 제외 가능
   - 두 형식 모두 지원됨

4. **에러 처리**: 
   - HTTP Request 노드에서 **"Continue On Fail"** 활성화 권장
   - 에러 발생 시 별도 처리 가능

---

## 🐛 트러블슈팅

### 문제: 400 Bad Request
- **원인**: 필수 파라미터 누락 또는 형식 오류
- **해결**: `imageBase64`와 `birthDate`가 모두 포함되어 있는지 확인

### 문제: 500 Internal Server Error
- **원인**: 서버 내부 오류 (API 키 오류, 이미지 처리 오류 등)
- **해결**: Railway 로그 확인 또는 헬스 체크로 서버 상태 확인

### 문제: Base64 변환 실패
- **원인**: 바이너리 데이터 형식 오류
- **해결**: Code 노드에서 `$input.first().binary.data.data` 확인

---

## 📞 지원

문제가 발생하거나 질문이 있으시면:
- Railway 로그 확인
- API 헬스 체크 엔드포인트로 서버 상태 확인
- GitHub 이슈 생성

---

## ✅ 체크리스트

n8n 워크플로우 설정 시 확인사항:

- [ ] HTTP Request 노드 Method가 `POST`로 설정됨
- [ ] URL이 정확함 (`/api/analyze` 또는 `/api/analyze-and-save`)
- [ ] Body Content Type이 `JSON`으로 설정됨
- [ ] `imageBase64` 파라미터가 포함됨
- [ ] `birthDate` 파라미터가 `YYYY-MM-DD` 형식임
- [ ] `phoneNumber` 파라미터 포함 (선택사항)
- [ ] `instagramId` 파라미터 포함 (선택사항)
- [ ] Base64 변환 Code 노드가 올바르게 작동함
- [ ] 에러 처리가 설정됨 (Continue On Fail)

