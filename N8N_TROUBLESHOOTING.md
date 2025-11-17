# n8n API 트러블슈팅 가이드

## 🔴 "AI 분석에 실패했습니다" 에러 해결 방법

### 1. Base64 이미지 데이터 확인

**문제**: Base64 인코딩이 잘못되었거나 데이터가 손상됨

**해결 방법**:
- n8n Code 노드에서 Base64 변환 확인
- 이미지 파일이 올바르게 읽혔는지 확인
- Base64 문자열이 완전한지 확인 (중간에 잘리지 않았는지)

**확인 코드**:
```javascript
// Code 노드에서 디버깅
const binaryData = $input.first().binary.data.data;
const mimeType = $input.first().binary.data.mimeType || 'image/jpeg';
const base64String = Buffer.from(binaryData).toString('base64');

console.log('Image size:', binaryData.length);
console.log('MIME type:', mimeType);
console.log('Base64 length:', base64String.length);
console.log('Base64 preview:', base64String.substring(0, 50));

return {
  json: {
    imageBase64: `data:${mimeType};base64,${base64String}`,
    birthDate: "2024-01-15",
    phoneNumber: "010-1234-5678",
    instagramId: "@instagram_id"
  }
};
```

### 2. 이미지 형식 확인

**지원되는 형식**:
- JPEG/JPG
- PNG
- WebP

**확인 방법**:
- 이미지 파일 확장자 확인
- MIME 타입이 `image/jpeg`, `image/png`, `image/webp` 중 하나인지 확인

### 3. 이미지 크기 확인

**제한사항**:
- Base64 인코딩 후 최대 50MB
- 원본 이미지 권장 크기: 10MB 이하

**해결 방법**:
- 이미지 리사이즈 후 전송
- 이미지 압축 사용

**리사이즈 예시** (n8n Code 노드):
```javascript
// 이미지 크기 확인 및 경고
const binaryData = $input.first().binary.data.data;
const sizeInMB = binaryData.length / (1024 * 1024);

if (sizeInMB > 10) {
  console.warn(`이미지 크기가 큽니다: ${sizeInMB.toFixed(2)}MB`);
  // 필요시 이미지 리사이즈 로직 추가
}
```

### 4. API 키 확인

**확인 방법**:
- Railway 환경 변수에서 `GEMINI_API_KEY` 확인
- 헬스 체크 엔드포인트로 확인: `GET /api/health`

**헬스 체크 응답**:
```json
{
  "success": true,
  "message": "API is running",
  "geminiConfigured": true  // true여야 함
}
```

### 5. 네트워크 및 타임아웃 확인

**문제**: 요청이 타임아웃되거나 네트워크 오류

**해결 방법**:
- n8n HTTP Request 노드에서 타임아웃 설정 증가
- Railway 로그 확인

### 6. 요청 데이터 형식 확인

**올바른 형식**:
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "birthDate": "2024-01-15",
  "phoneNumber": "010-1234-5678",
  "instagramId": "@instagram_id"
}
```

**확인 사항**:
- `imageBase64`가 문자열인지 확인 (객체가 아님)
- `birthDate`가 `YYYY-MM-DD` 형식인지 확인
- JSON이 올바르게 파싱되는지 확인

### 7. 디버깅 단계별 확인

**1단계: 헬스 체크**
```
GET https://sundayhug-sleep-report-25-production.up.railway.app/api/health
```
- 응답이 정상인지 확인

**2단계: Base64 변환 확인**
- Code 노드에서 Base64 문자열이 올바르게 생성되는지 확인
- Base64 문자열 길이 확인 (너무 짧으면 문제)

**3단계: 요청 전송 확인**
- HTTP Request 노드의 "Send Body"가 켜져 있는지 확인
- Body Content Type이 "JSON"인지 확인
- JSON 형식이 올바른지 확인

**4단계: 에러 응답 확인**
- n8n에서 에러 응답의 전체 내용 확인
- "Other info" 섹션 확인

### 8. 일반적인 문제 해결

#### 문제: Base64 문자열이 잘림
**원인**: n8n에서 데이터 크기 제한
**해결**: 이미지 크기 줄이기

#### 문제: MIME 타입이 잘못됨
**원인**: 이미지 파일 형식 감지 실패
**해결**: 명시적으로 MIME 타입 설정
```javascript
const mimeType = 'image/jpeg'; // 명시적으로 설정
```

#### 문제: JSON 파싱 오류
**원인**: JSON 형식 오류
**해결**: JSON 유효성 검사 도구 사용

### 9. Railway 로그 확인

Railway 대시보드에서:
1. 프로젝트 → Deployments → 최근 배포 클릭
2. Logs 탭 확인
3. 에러 메시지 확인

**확인할 로그**:
- `Error analyzing image with Gemini:`
- `Error details:`
- `Request body:`

### 10. 테스트 워크플로우

**간단한 테스트**:
```
1. Manual Trigger
   ↓
2. Set 노드 (테스트 데이터 설정)
   - imageBase64: 작은 테스트 이미지의 Base64
   - birthDate: "2024-01-15"
   ↓
3. HTTP Request (API 호출)
   ↓
4. 결과 확인
```

**테스트 이미지 Base64 생성** (온라인 도구 사용):
- https://www.base64-image.de/
- 작은 이미지(100KB 이하)로 테스트

---

## 📞 추가 지원

문제가 계속되면:
1. Railway 로그 전체 복사
2. n8n 에러 응답 전체 복사
3. 사용한 이미지 정보 (크기, 형식)
4. 요청 Body 예시

이 정보를 함께 제공해주시면 더 정확한 진단이 가능합니다.

