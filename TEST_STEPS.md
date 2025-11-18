# 배포 후 테스트 단계별 가이드

## ✅ 1단계 완료: 서버 배포 확인

- ✅ Health Check API 정상 작동
- ✅ Gemini API 설정 확인됨 (`geminiConfigured: true`)

---

## 🔍 2단계: 실제 API 테스트

### 방법 1: Tally 폼으로 테스트 (권장)

1. **Tally 폼 제출**
   - 실제 아기 수면 환경 사진 업로드
   - 생년월일, 전화번호, 인스타그램 ID 입력
   - 폼 제출

2. **n8n 워크플로우 확인**
   - 워크플로우가 자동 실행되는지 확인
   - 각 노드에서 데이터가 정상적으로 전달되는지 확인

3. **결과 확인**
   - 분석 결과가 정상적으로 생성되는지 확인
   - Storage에 이미지가 업로드되는지 확인

### 방법 2: API 직접 호출 테스트

**테스트 이미지 URL 사용:**
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

**응답 확인:**
- `success: true` 확인
- `analysisId` 확인
- `image_url`이 Storage URL인지 확인

---

## 📋 확인할 사항

### Railway 서버 로그 확인

Railway Dashboard → Deployments → Logs에서 다음 메시지 확인:

```
✅ Server running at http://0.0.0.0:3000/
✅ Storage 버킷 "sleep-analysis" 확인됨
```

또는

```
📦 Storage 버킷 "sleep-analysis" 생성 시도 중...
✅ Storage 버킷 "sleep-analysis" 생성 완료
```

### Supabase Storage 확인

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard/project/ugzwgegkvxcczwiottej/storage/buckets

2. **버킷 확인**
   - `sleep-analysis` 버킷 클릭
   - 버킷이 비어있거나 파일이 있는지 확인

3. **테스트 후 확인**
   - API 호출 후 `images/{analysisId}/` 폴더 생성 확인
   - 슬라이드 생성 후 `slides/{analysisId}/` 폴더 생성 확인

---

## 🎯 다음 단계

### 3단계: n8n 워크플로우 업데이트

`N8N_STORAGE_URL_GUIDE.md` 파일을 참고해서 워크플로우를 업데이트하세요:

1. **슬라이드 조회 API 호출**
   - GET `/api/analysis/{{ $json.analysisId }}/slides`

2. **Code 노드 추가**
   - URL 배열 → 개별 아이템 변환
   - (가이드 파일의 코드 사용)

3. **HTTP Request 노드 추가**
   - 각 슬라이드 URL에서 이미지 다운로드
   - Response Format: `File` 또는 `Binary`

4. **테스트**
   - View/Download 버튼 작동 확인

---

## 🐛 문제 발생 시

### 문제 1: Storage 버킷 인식 안 됨

**확인 사항:**
- Railway 로그에서 버킷 관련 메시지 확인
- Supabase Dashboard에서 버킷이 Public으로 설정되어 있는지 확인

**해결:**
- 버킷이 Public으로 설정되어 있으면 정상 작동해야 함
- 로그에 "확인됨" 또는 "생성 완료" 메시지가 있으면 정상

### 문제 2: 이미지 업로드 실패

**확인 사항:**
- API 응답에서 에러 메시지 확인
- Railway 로그에서 상세 에러 확인

**해결:**
- Storage 버킷이 Public인지 확인
- 이미지 URL이 접근 가능한지 확인

---

## ✅ 완료 체크리스트

- [ ] 서버 Health Check 정상
- [ ] Railway 로그에서 Storage 버킷 확인 메시지 확인
- [ ] 이미지 분석 API 테스트 성공
- [ ] Storage에 이미지 업로드 확인
- [ ] 슬라이드 생성 API 테스트 성공
- [ ] 슬라이드 Storage URL 확인
- [ ] 슬라이드 URL 직접 접근 가능
- [ ] n8n 워크플로우 업데이트 완료
- [ ] n8n에서 View/Download 정상 작동

---

지금 바로 테스트해볼까요? 아니면 n8n 워크플로우를 먼저 업데이트할까요?

