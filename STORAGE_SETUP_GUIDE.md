# Supabase Storage 설정 가이드

## 📋 현재 상태

✅ 서버 코드가 Supabase Storage를 사용하도록 수정 완료  
⏳ Storage 버킷 생성 필요  
⏳ 서버 테스트 필요  
⏳ n8n 워크플로우 업데이트 필요  

---

## 🎯 단계별 작업 가이드

### 1단계: Supabase Storage 버킷 생성

#### 방법 A: 서버 실행으로 자동 생성 시도 (권장)

1. **서버 실행**
   ```bash
   npm start
   # 또는
   node server.js
   ```

2. **콘솔 로그 확인**
   - ✅ 성공: `✅ Storage 버킷 "sleep-analysis" 생성 완료`
   - ⚠️ 권한 없음: `⚠️ Storage 버킷 생성 권한이 없습니다.` → 방법 B로 진행

#### 방법 B: Supabase Dashboard에서 수동 생성

1. **Supabase Dashboard 접속**
   - URL: https://supabase.com/dashboard/project/ugzwgegkvxcczwiottej/storage/buckets
   - 또는: https://supabase.com/dashboard → 프로젝트 선택 → Storage → Buckets

2. **새 버킷 생성**
   - "New bucket" 버튼 클릭
   - **이름**: `sleep-analysis` (정확히 이 이름으로!)
   - **Public bucket**: ✅ 체크 (반드시 공개로 설정!)
   - "Create bucket" 클릭

3. **버킷 설정 확인**
   - 버킷 목록에서 `sleep-analysis` 확인
   - Public 컬럼에 체크 표시 확인

---

### 2단계: 서버 실행 및 테스트

1. **서버 실행**
   ```bash
   npm start
   ```

2. **콘솔 로그 확인**
   ```
   ✅ Server running at http://0.0.0.0:3000/
   📡 API endpoints available at http://0.0.0.0:3000/api/
   🔍 Health check: http://0.0.0.0:3000/api/health
   🌐 Web app available at http://0.0.0.0:3000/
   ✅ Storage 버킷 "sleep-analysis" 확인됨
   ```

3. **Health Check 테스트**
   ```bash
   curl http://localhost:3000/api/health
   ```
   또는 브라우저에서: http://localhost:3000/api/health

   예상 응답:
   ```json
   {
     "success": true,
     "message": "API is running",
     "timestamp": "2024-01-15T10:30:00.000Z",
     "geminiConfigured": true
   }
   ```

---

### 3단계: 이미지 분석 API 테스트

1. **테스트 이미지 준비**
   - 아기 수면 환경 사진 (JPEG 또는 PNG)

2. **API 테스트 (로컬)**
   ```bash
   curl -X POST http://localhost:3000/api/analyze-from-url \
     -H "Content-Type: application/json" \
     -d '{
       "imageUrl": "https://example.com/test-image.jpg",
       "birthDate": "2024-01-15",
       "phoneNumber": "010-1234-5678",
       "instagramId": "@test_user"
     }'
   ```

3. **응답 확인**
   - `success: true` 확인
   - `analysisId` 확인
   - `image_url`이 Storage URL인지 확인 (예: `https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/...`)

4. **Storage 확인**
   - Supabase Dashboard → Storage → `sleep-analysis` 버킷
   - `images/{analysisId}/original.jpg` 파일 확인

---

### 4단계: 슬라이드 생성 API 테스트

1. **슬라이드 생성**
   ```bash
   curl -X POST http://localhost:3000/api/analysis/{analysisId}/generate-slides
   ```
   (위에서 받은 `analysisId` 사용)

2. **응답 확인**
   ```json
   {
     "success": true,
     "data": {
       "analysisId": "...",
       "slideCount": 5,
       "message": "슬라이드가 성공적으로 생성되었습니다."
     }
   }
   ```

3. **슬라이드 조회**
   ```bash
   curl http://localhost:3000/api/analysis/{analysisId}/slides
   ```

4. **응답 확인**
   ```json
   {
     "success": true,
     "data": {
       "slides": [
         "https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/sleep-analysis/slides/.../slide-1.png",
         "https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/sleep-analysis/slides/.../slide-2.png"
       ],
       "isUrlArray": true
     }
   }
   ```

5. **Storage 확인**
   - Supabase Dashboard → Storage → `sleep-analysis` 버킷
   - `slides/{analysisId}/slide-1.png`, `slide-2.png` 등 확인

6. **URL 직접 접근 테스트**
   - 브라우저에서 슬라이드 URL 열기
   - 이미지가 정상적으로 보이는지 확인

---

### 5단계: n8n 워크플로우 업데이트

#### 현재 워크플로우 확인

기존 워크플로우:
```
1. Tally Trigger
   ↓
2. HTTP Request (분석 API)
   - POST /api/analyze-from-url
   ↓
3. HTTP Request (슬라이드 조회)
   - GET /api/analysis/{{ $json.analysisId }}/slides
   ↓
4. Code 노드 (Base64 → Binary 변환) ← 이 부분 변경 필요!
   ↓
5. Loop Over Items
   ↓
6. Instagram DM 전송
```

#### 새로운 워크플로우

```
1. Tally Trigger
   ↓
2. HTTP Request (분석 API)
   - POST /api/analyze-from-url
   - URL: https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze-from-url
   ↓
3. Code 노드 (analysisId 추출)
   ```javascript
   const response = $input.first().json;
   return {
     json: {
       analysisId: response.analysisId || response.data?.analysisId
     }
   };
   ```
   ↓
4. HTTP Request (슬라이드 조회)
   - GET /api/analysis/{{ $json.analysisId }}/slides
   - URL: https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{{ $json.analysisId }}/slides
   ↓
5. Code 노드 (URL 배열 → 개별 아이템 변환)
   ```javascript
   // N8N_STORAGE_URL_GUIDE.md 파일의 "Code 노드 코드 (2단계)" 참고
   ```
   ↓
6. Loop Over Items
   ↓
7. HTTP Request (이미지 다운로드)
   - Method: GET
   - URL: {{ $json.slideUrl }}
   - Response Format: File 또는 Binary
   ↓
8. Instagram DM 전송 (또는 다음 단계)
```

#### Code 노드 코드 (5단계)

`N8N_STORAGE_URL_GUIDE.md` 파일의 "방법 1: Loop Over Items 사용" 섹션 참고

---

### 6단계: n8n에서 테스트

1. **워크플로우 실행**
   - Tally 폼 제출 또는 수동 실행

2. **각 노드 확인**
   - ✅ HTTP Request (분석 API): `analysisId` 받는지 확인
   - ✅ HTTP Request (슬라이드 조회): URL 배열 받는지 확인
   - ✅ Code 노드: 개별 아이템 생성되는지 확인
   - ✅ HTTP Request (이미지 다운로드): 바이너리 데이터 받는지 확인

3. **View/Download 테스트**
   - 각 아이템의 **View 버튼** 클릭 → 이미지 확인
   - 각 아이템의 **Download 버튼** 클릭 → 파일 다운로드

---

## ✅ 체크리스트

### 서버 설정
- [ ] 서버 실행 성공
- [ ] Storage 버킷 생성 확인 (콘솔 로그 또는 Dashboard)
- [ ] Health check API 정상 작동

### API 테스트
- [ ] 이미지 분석 API 테스트 성공
- [ ] Storage에 이미지 업로드 확인
- [ ] 슬라이드 생성 API 테스트 성공
- [ ] 슬라이드 Storage URL 확인
- [ ] 슬라이드 URL 직접 접근 가능

### n8n 설정
- [ ] 워크플로우 업데이트 완료
- [ ] Code 노드 코드 적용
- [ ] HTTP Request 노드 설정 (Response Format: File)
- [ ] View/Download 버튼 작동 확인

---

## 🐛 문제 해결

### 문제 1: Storage 버킷 생성 실패

**증상**: 콘솔에 `⚠️ Storage 버킷 생성 권한이 없습니다.` 메시지

**해결**:
1. Supabase Dashboard에서 수동으로 버킷 생성
2. 버킷 이름: `sleep-analysis`
3. Public bucket 체크

### 문제 2: 이미지 업로드 실패

**증상**: `Storage 업로드 실패` 에러

**해결**:
1. 버킷이 존재하는지 확인
2. 버킷이 Public으로 설정되어 있는지 확인
3. Supabase API 키가 올바른지 확인

### 문제 3: 슬라이드 URL 접근 불가

**증상**: 브라우저에서 URL 열었을 때 404 또는 접근 거부

**해결**:
1. 버킷이 Public으로 설정되어 있는지 확인
2. Storage 정책 확인 (Supabase Dashboard → Storage → Policies)
3. URL이 올바른지 확인

### 문제 4: n8n에서 View/Download 작동 안 함

**증상**: View 버튼 클릭해도 아무것도 안 보임

**해결**:
1. HTTP Request 노드의 Response Format이 `File` 또는 `Binary`인지 확인
2. Code 노드에서 바이너리 데이터가 올바르게 생성되는지 확인
3. 슬라이드 URL이 올바른지 확인 (브라우저에서 직접 접근 테스트)

---

## 📚 참고 문서

- `N8N_STORAGE_URL_GUIDE.md` - n8n 워크플로우 상세 가이드
- `server.js` - 서버 코드 (Storage 업로드 함수 포함)

---

## 🎉 완료 후

모든 단계를 완료하면:
1. ✅ 이미지가 Storage에 저장됨
2. ✅ 슬라이드가 Storage URL로 반환됨
3. ✅ n8n에서 View/Download 정상 작동
4. ✅ Instagram DM 전송 등 다음 단계 진행 가능

문제가 있으면 각 단계의 로그를 확인하고 위의 문제 해결 섹션을 참고하세요!

