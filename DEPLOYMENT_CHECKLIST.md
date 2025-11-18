# 배포 후 확인 체크리스트

## ✅ 배포 전 완료 사항

- [x] Storage 버킷 생성 완료 (`sleep-analysis`)
- [x] 버킷 Public 설정 완료
- [x] 서버 코드 커밋 완료
- [x] 로컬 서버 테스트 완료

---

## 🚀 배포 후 확인 사항

### 1단계: 서버 배포 확인

1. **Railway 배포 상태 확인**
   - Railway Dashboard에서 배포 완료 확인
   - 서버 URL: `https://sundayhug-sleep-report-25-production.up.railway.app`

2. **Health Check 테스트**
   ```bash
   curl https://sundayhug-sleep-report-25-production.up.railway.app/api/health
   ```
   예상 응답:
   ```json
   {
     "success": true,
     "message": "API is running",
     "geminiConfigured": true
   }
   ```

3. **서버 로그 확인**
   - Railway Dashboard → Deployments → Logs
   - 다음 메시지 확인:
     - `✅ Server running`
     - `✅ Storage 버킷 "sleep-analysis" 확인됨` 또는 `✅ Storage 버킷 "sleep-analysis" 생성 완료`

---

### 2단계: Storage 기능 테스트

1. **이미지 분석 API 테스트**
   ```bash
   curl -X POST https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze-from-url \
     -H "Content-Type: application/json" \
     -d '{
       "imageUrl": "https://example.com/test-image.jpg",
       "birthDate": "2024-01-15",
       "phoneNumber": "010-1234-5678",
       "instagramId": "@test_user"
     }'
   ```

2. **응답 확인**
   - `success: true` 확인
   - `analysisId` 확인
   - `image_url`이 Storage URL인지 확인:
     ```
     https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/sleep-analysis/images/...
     ```

3. **Supabase Storage 확인**
   - Dashboard → Storage → `sleep-analysis` 버킷
   - `images/{analysisId}/original.jpg` 파일 확인
   - 파일을 클릭해서 이미지가 정상적으로 보이는지 확인

---

### 3단계: 슬라이드 생성 테스트

1. **슬라이드 생성 API 호출**
   ```bash
   curl -X POST https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{analysisId}/generate-slides
   ```
   (위에서 받은 `analysisId` 사용)

2. **응답 확인**
   ```json
   {
     "success": true,
     "data": {
       "analysisId": "...",
       "slideCount": 5
     }
   }
   ```

3. **슬라이드 조회 API 호출**
   ```bash
   curl https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{analysisId}/slides
   ```

4. **응답 확인**
   - `slides` 배열이 URL 배열인지 확인
   - 각 URL이 `https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/sleep-analysis/slides/...` 형식인지 확인
   - `isUrlArray: true` 확인

5. **슬라이드 URL 직접 접근 테스트**
   - 브라우저에서 슬라이드 URL 열기
   - 이미지가 정상적으로 보이는지 확인

6. **Supabase Storage 확인**
   - Dashboard → Storage → `sleep-analysis` 버킷
   - `slides/{analysisId}/slide-1.png`, `slide-2.png` 등 확인

---

### 4단계: n8n 워크플로우 테스트

1. **워크플로우 업데이트 확인**
   - `N8N_STORAGE_URL_GUIDE.md` 파일의 가이드대로 워크플로우 업데이트
   - Code 노드 코드 적용 확인

2. **워크플로우 실행**
   - Tally 폼 제출 또는 수동 실행

3. **각 노드 확인**
   - ✅ HTTP Request (분석 API): `analysisId` 받는지 확인
   - ✅ HTTP Request (슬라이드 조회): URL 배열 받는지 확인
   - ✅ Code 노드: 개별 아이템 생성되는지 확인
   - ✅ HTTP Request (이미지 다운로드): 바이너리 데이터 받는지 확인

4. **View/Download 테스트**
   - 각 아이템의 **View 버튼** 클릭 → 이미지 확인
   - 각 아이템의 **Download 버튼** 클릭 → 파일 다운로드

---

## 🐛 문제 해결

### 문제 1: 서버 로그에 "Storage 버킷 생성 실패" 메시지

**원인**: 버킷 목록 조회 권한 문제 또는 버킷이 아직 인식되지 않음

**해결**:
1. 잠시 기다린 후 서버 재시작
2. Supabase Dashboard에서 버킷이 정상적으로 보이는지 확인
3. 버킷이 Public으로 설정되어 있는지 확인

### 문제 2: 이미지 업로드 실패

**증상**: `Storage 업로드 실패` 에러

**해결**:
1. 버킷이 Public으로 설정되어 있는지 확인
2. Railway 환경 변수 확인:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 서버 로그에서 상세 에러 메시지 확인

### 문제 3: 슬라이드 URL 접근 불가

**증상**: 브라우저에서 URL 열었을 때 404 또는 접근 거부

**해결**:
1. 버킷이 Public으로 설정되어 있는지 확인
2. Storage 정책 확인 (Supabase Dashboard → Storage → Policies)
3. URL이 올바른지 확인 (복사해서 직접 접근)

### 문제 4: n8n에서 View/Download 작동 안 함

**증상**: View 버튼 클릭해도 아무것도 안 보임

**해결**:
1. HTTP Request 노드의 Response Format이 `File` 또는 `Binary`인지 확인
2. Code 노드에서 바이너리 데이터가 올바르게 생성되는지 확인
3. 슬라이드 URL이 올바른지 확인 (브라우저에서 직접 접근 테스트)

---

## ✅ 최종 확인

배포 후 다음이 모두 정상 작동하면 완료:

- [ ] 서버 Health Check 정상
- [ ] Storage 버킷 인식 확인 (서버 로그)
- [ ] 이미지 분석 API 정상 작동
- [ ] 이미지가 Storage에 업로드됨
- [ ] 슬라이드 생성 API 정상 작동
- [ ] 슬라이드가 Storage URL로 반환됨
- [ ] 슬라이드 URL 직접 접근 가능
- [ ] n8n 워크플로우 정상 작동
- [ ] n8n에서 View/Download 정상 작동

---

## 📞 문제 발생 시

1. Railway 서버 로그 확인
2. Supabase Dashboard에서 Storage 확인
3. 각 API 엔드포인트 직접 테스트
4. `STORAGE_SETUP_GUIDE.md` 파일의 문제 해결 섹션 참고

배포 후 위 항목들을 하나씩 확인해보세요! 🚀

