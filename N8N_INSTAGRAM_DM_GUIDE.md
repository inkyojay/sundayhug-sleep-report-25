# n8n 인스타그램 DM 전송 가이드

## 🎯 목표
분석 완료 후 생성된 레포트 슬라이드를 인스타그램 ID로 DM 전송

---

## 📋 전체 워크플로우 구조

```
1. Tally Trigger (또는 Webhook)
   ↓
2. HTTP Request (분석 API 호출)
   - POST /api/analyze-from-url
   ↓
3. Wait 노드 (슬라이드 생성 대기 - 선택사항)
   ↓
4. HTTP Request (슬라이드 조회)
   - GET /api/analysis/:id/slides
   ↓
5. Code 노드 (슬라이드를 이미지 파일로 변환)
   ↓
6. Loop Over Items (각 슬라이드 처리)
   ↓
7. Instagram 노드 (DM 전송)
```

---

## 🔧 단계별 설정

### 1단계: 분석 API 호출 (기존)

**HTTP Request 노드**:
- **Method**: `POST`
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze-from-url`
- **Body**: JSON
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
  "analysisId": "12345"
}
```

---

### 2단계: 슬라이드 조회

**HTTP Request 노드**:
- **Method**: `GET`
- **URL**: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{{ $json.analysisId }}/slides`

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "analysisId": "12345",
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

### 3단계: 슬라이드를 이미지 파일로 변환

**Code 노드** (슬라이드를 바이너리 데이터로 변환):

```javascript
// 이전 노드에서 슬라이드 데이터 받기
const slidesData = $input.first().json.data;

if (!slidesData || !slidesData.slides || slidesData.slides.length === 0) {
  throw new Error('슬라이드가 없습니다.');
}

// 각 슬라이드를 바이너리 데이터로 변환
const items = slidesData.slides.map((base64String, index) => {
  // Base64 문자열을 Buffer로 변환
  const buffer = Buffer.from(base64String, 'base64');
  
  return {
    json: {
      slideIndex: index + 1,
      totalSlides: slidesData.slides.length,
      instagramId: slidesData.instagramId,
      analysisId: slidesData.analysisId
    },
    binary: {
      data: {
        data: buffer,
        mimeType: 'image/png',
        fileName: `수면분석리포트_${index + 1}.png`
      }
    }
  };
});

return items;
```

---

### 4단계: Loop Over Items (각 슬라이드 처리)

**Loop Over Items 노드**:
- **Mode**: `Process All Items`
- 각 슬라이드를 개별적으로 처리

---

### 5단계: Instagram DM 전송

**Instagram 노드** (n8n에 Instagram 통합이 있는 경우):

#### 방법 A: Instagram API 직접 사용

**HTTP Request 노드**:
- **Method**: `POST`
- **URL**: `https://graph.instagram.com/v18.0/{user-id}/messages`
- **Authentication**: OAuth 2.0
- **Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```
- **Body**: JSON
```json
{
  "recipient": {
    "id": "{{ $json.instagramId }}"
  },
  "message": {
    "attachment": {
      "type": "image",
      "payload": {
        "url": "data:image/png;base64,{{ $binary.data.data }}"
      }
    }
  }
}
```

**주의**: Instagram Graph API는 Base64 직접 전송을 지원하지 않을 수 있습니다. 이미지를 임시 URL로 업로드한 후 사용해야 할 수 있습니다.

#### 방법 B: 이미지를 임시 URL로 업로드 후 전송

**1. 이미지를 Supabase Storage 또는 다른 서비스에 업로드**

**HTTP Request 노드** (Supabase Storage 업로드):
- **Method**: `POST`
- **URL**: `https://{project-id}.supabase.co/storage/v1/object/{bucket-name}/{file-path}`
- **Headers**:
```
Authorization: Bearer {supabase-anon-key}
Content-Type: image/png
```
- **Body**: Binary (이전 노드의 바이너리 데이터)

**2. 공개 URL 생성 후 Instagram DM 전송**

---

## 🎯 실용적인 대안: Instagram DM 대신 다른 방법

Instagram Graph API는 복잡하고 제한이 많습니다. 대안:

### 방법 1: 이메일로 전송

**Gmail 노드** 또는 **SMTP 노드**:
- **To**: 사용자 이메일 (Tally에서 수집)
- **Subject**: "아기 수면 환경 분석 리포트"
- **Attachments**: 슬라이드 이미지들

### 방법 2: WhatsApp 메시지 전송

**WhatsApp Business API** 또는 **Twilio** 사용:
- 전화번호로 이미지 전송

### 방법 3: 슬라이드를 ZIP 파일로 묶어서 전송

**Code 노드** (ZIP 생성):
```javascript
const JSZip = require('jszip');
const zip = new JSZip();

// 각 슬라이드를 ZIP에 추가
$input.all().forEach((item, index) => {
  const buffer = Buffer.from(item.binary.data.data);
  zip.file(`슬라이드_${index + 1}.png`, buffer);
});

const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

return {
  json: {
    instagramId: $input.first().json.instagramId
  },
  binary: {
    data: {
      data: zipBuffer,
      mimeType: 'application/zip',
      fileName: '수면분석리포트.zip'
    }
  }
};
```

---

## 📝 완전한 n8n 워크플로우 예시

### 워크플로우 1: 슬라이드 조회 및 변환

```
1. Tally Trigger
   ↓
2. HTTP Request (분석)
   - POST /api/analyze-from-url
   ↓
3. HTTP Request (슬라이드 조회)
   - GET /api/analysis/{{ $json.analysisId }}/slides
   ↓
4. Code 노드 (슬라이드 변환)
   - 위의 Code 노드 코드 사용
   ↓
5. 결과 저장 또는 다음 워크플로우로 전달
```

### 워크플로우 2: 인스타그램 DM 전송 (별도 워크플로우)

```
1. Schedule Trigger (또는 Webhook)
   ↓
2. HTTP Request (슬라이드 조회)
   - GET /api/analysis/{{ $json.analysisId }}/slides
   ↓
3. Code 노드 (슬라이드 변환)
   ↓
4. Loop Over Items
   ↓
5. Instagram API 또는 대안 방법
```

---

## 🔍 API 엔드포인트 상세

### GET /api/analysis/:id/slides

**URL 파라미터**:
- `id`: 분석 ID (analysisId)

**응답 형식**:
```json
{
  "success": true,
  "data": {
    "analysisId": "string",
    "slides": ["string", "string", ...],  // Base64 문자열 배열
    "slideCount": 5,
    "instagramId": "@user_instagram",
    "phoneNumber": "010-1234-5678",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**에러 응답**:
```json
{
  "success": false,
  "error": "에러 메시지"
}
```

---

## ✅ 체크리스트

- [ ] 슬라이드 조회 API 엔드포인트 테스트
- [ ] Code 노드에서 Base64 → 바이너리 변환 확인
- [ ] Instagram API 인증 설정 (또는 대안 방법 선택)
- [ ] 각 슬라이드가 올바르게 처리되는지 확인
- [ ] 에러 처리 및 재시도 로직 추가

---

## 🚀 다음 단계

1. **서버 배포**: 슬라이드 조회 API 배포
2. **n8n 워크플로우 구성**: 위의 단계별 설정 적용
3. **테스트**: 실제 데이터로 테스트
4. **Instagram DM 설정**: Instagram API 설정 또는 대안 방법 선택

어떤 방법으로 DM을 전송하시겠습니까? (Instagram API, 이메일, WhatsApp 등)

