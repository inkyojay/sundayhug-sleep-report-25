# n8n Tally 이미지 URL 처리 가이드 (새로운 방법)

## 🎯 새로운 API 엔드포인트

**URL**: `POST https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze-from-url`

이 API는 이미지 URL을 받아서 서버에서 직접 다운로드하고 분석합니다. n8n에서 복잡한 Base64 변환이 필요 없습니다!

---

## 📋 n8n 워크플로우 설정

### 워크플로우 구조 (매우 간단!)

```
1. Tally Trigger
   ↓
2. HTTP Request 노드 (서버 API 호출)
```

끝! Base64 변환 Code 노드가 필요 없습니다!

---

## 🔧 HTTP Request 노드 설정

### 1단계: HTTP Request 노드 추가

1. Tally Trigger 노드 옆에 **HTTP Request** 노드 추가
2. 노드를 더블클릭하여 설정 열기

### 2단계: 기본 설정

- **Method**: `POST`
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze-from-url`
- **Authentication**: `None`

### 3단계: Body 설정

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

**참고**: Tally form의 필드 이름에 맞게 수정하세요.
- `question_4rR8Rk` → Tally의 이미지 URL 필드
- `birthDate` → Tally의 생년월일 필드
- `phoneNumber` → Tally의 전화번호 필드 (선택사항)
- `instagramId` → Tally의 인스타그램 ID 필드 (선택사항)

---

## 📝 API 요청 예시

### 요청 (Request)

**URL**: `POST https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze-from-url`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "imageUrl": "https://storage.tally.so/private/image.jpeg?id=M8epkY&accessToken=...",
  "birthDate": "2024-01-15",
  "phoneNumber": "010-1234-5678",
  "instagramId": "@instagram_id"
}
```

**파라미터 설명**:
- `imageUrl` (필수): Tally에서 받은 이미지 URL
- `birthDate` (필수): 아기의 생년월일 (YYYY-MM-DD 형식)
- `phoneNumber` (선택사항): 전화번호
- `instagramId` (선택사항): 인스타그램 ID

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
      }
    ],
    "references": [],
    "phoneNumber": "010-1234-5678",
    "instagramId": "@instagram_id"
  },
  "analysisId": "12345"
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

## ✅ 장점

1. **간단함**: Base64 변환 Code 노드 불필요
2. **안정성**: 서버에서 이미지 다운로드 처리
3. **에러 처리**: 서버에서 상세한 에러 로깅
4. **유지보수**: 워크플로우가 단순해짐

---

## 🔍 트러블슈팅

### 문제 1: 400 Bad Request - "imageUrl and birthDate are required"
**원인**: 필수 파라미터 누락
**해결**: 
- `imageUrl`과 `birthDate`가 Body에 포함되어 있는지 확인
- Tally 필드 이름이 올바른지 확인

### 문제 2: 500 Internal Server Error - "이미지 다운로드 실패"
**원인**: Tally 이미지 URL에 접근할 수 없음
**해결**:
- Tally 이미지 URL이 유효한지 확인
- URL에 `accessToken`이 포함되어 있는지 확인
- Railway 로그에서 상세 에러 확인

### 문제 3: Tally 필드 이름이 다름
**원인**: Tally form의 필드 이름이 다를 수 있음
**해결**:
- Tally Trigger 노드의 Output 확인
- 실제 필드 이름에 맞게 JSON Body 수정
- 예: `{{ $json.question_생년월일 }}` 또는 `{{ $json.birthDate }}`

---

## 📋 체크리스트

n8n 워크플로우 설정 시 확인사항:

- [ ] HTTP Request 노드 Method가 `POST`로 설정됨
- [ ] URL이 정확함 (`/api/analyze-from-url`)
- [ ] Body Content Type이 `JSON`으로 설정됨
- [ ] `imageUrl` 파라미터가 Tally 필드에서 올바르게 참조됨
- [ ] `birthDate` 파라미터가 Tally 필드에서 올바르게 참조됨
- [ ] `phoneNumber` 파라미터 포함 (선택사항)
- [ ] `instagramId` 파라미터 포함 (선택사항)

---

## 🎯 사용 예시

### 예시 1: 기본 사용 (이미지 URL + 생년월일만)

```json
{
  "imageUrl": "{{ $json.question_4rR8Rk }}",
  "birthDate": "{{ $json.question_생년월일 }}"
}
```

### 예시 2: 모든 필드 포함

```json
{
  "imageUrl": "{{ $json.question_4rR8Rk }}",
  "birthDate": "{{ $json.question_생년월일 }}",
  "phoneNumber": "{{ $json.question_전화번호 }}",
  "instagramId": "{{ $json.question_인스타그램 }}"
}
```

---

## 🚀 다음 단계

1. **서버 배포**: 변경사항을 Railway에 배포
2. **n8n 워크플로우 수정**: HTTP Request 노드만 사용하도록 단순화
3. **테스트**: Tally form 제출 후 정상 작동 확인

이제 Base64 변환 문제 없이 깔끔하게 작동할 것입니다! 🎉

