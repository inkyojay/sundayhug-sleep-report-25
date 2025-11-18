# 빠른 테스트 가이드

## 현재 상태

✅ 서버 배포 완료  
✅ Storage 버킷 생성 완료 (`sleep-analysis`, Public)  
⚠️ 버킷 자동 생성 실패 (예상된 동작 - anon key 권한 제한)  
✅ 서버는 정상 작동 중  

**중요**: 버킷이 이미 생성되어 있으므로, 실제 업로드는 정상 작동해야 합니다!

---

## 🧪 실제 테스트 방법

### 방법 1: Tally 폼으로 테스트 (가장 간단)

1. **Tally 폼 제출**
   - 실제 아기 수면 환경 사진 업로드
   - 생년월일, 전화번호, 인스타그램 ID 입력
   - 폼 제출

2. **n8n 워크플로우 확인**
   - 워크플로우가 자동 실행되는지 확인
   - 분석 API 호출 확인

3. **결과 확인**
   - Supabase Dashboard → Storage → `sleep-analysis` 버킷
   - `images/{analysisId}/original.jpg` 파일 확인

### 방법 2: API 직접 호출 테스트

**테스트 명령어:**
```bash
curl -X POST https://sundayhug-sleep-report-25-production.up.railway.app/api/analyze-from-url \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800",
    "birthDate": "2024-01-15",
    "phoneNumber": "010-1234-5678",
    "instagramId": "@test_user"
  }'
```

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "summary": "...",
    "feedbackItems": [...],
    "phoneNumber": "010-1234-5678",
    "instagramId": "@test_user"
  },
  "analysisId": "uuid-here"
}
```

**확인 사항:**
1. `success: true` 확인
2. `analysisId` 확인
3. Supabase Dashboard에서 Storage 확인:
   - `images/{analysisId}/original.jpg` 파일이 있는지 확인

---

## ✅ 성공 확인 방법

### 1. Supabase Storage 확인

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard/project/ugzwgegkvxcczwiottej/storage/buckets

2. **버킷 확인**
   - `sleep-analysis` 버킷 클릭
   - API 호출 후 `images/` 폴더가 생성되는지 확인
   - `images/{analysisId}/original.jpg` 파일 확인

3. **파일 클릭**
   - 파일을 클릭해서 이미지가 정상적으로 보이는지 확인
   - 공개 URL이 생성되어 있는지 확인

### 2. 슬라이드 생성 테스트

**슬라이드 생성:**
```bash
curl -X POST https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{analysisId}/generate-slides
```

**슬라이드 조회:**
```bash
curl https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{analysisId}/slides
```

**확인 사항:**
- `slides` 배열이 URL 배열인지 확인
- 각 URL이 `https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/sleep-analysis/slides/...` 형식인지 확인
- 브라우저에서 URL 직접 접근해서 이미지 확인

---

## 🎯 다음 단계

테스트 성공 후:
1. ✅ Storage에 이미지 업로드 확인
2. ✅ 슬라이드 Storage URL 확인
3. ⏭️ n8n 워크플로우 업데이트 (`N8N_STORAGE_URL_GUIDE.md` 참고)
4. ⏭️ View/Download 테스트

---

지금 바로 테스트해볼까요? Tally 폼을 제출하거나 위의 API 명령어를 실행해보세요!

