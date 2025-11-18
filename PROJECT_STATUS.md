# 프로젝트 현황 및 작업 메모

## 📋 프로젝트 개요
- **프로젝트명**: 아기 수면 환경 AI 분석기
- **배포 URL**: https://sundayhug-sleep-report-25-production.up.railway.app
- **GitHub 저장소**: inkyojay/sundayhug-sleep-report-25
- **주요 기능**: Tally form 이미지 분석 → 슬라이드 생성 → 인스타그램 DM 전송

---

## ✅ 완료된 작업

### 1. 서버 API 엔드포인트
- ✅ `POST /api/analyze-from-url` - Tally 이미지 URL 처리
- ✅ `GET /api/analysis/:id/slides` - 슬라이드 조회
- ✅ `POST /api/analyze-and-save` - Base64 이미지 분석 및 저장
- ✅ `GET /api/health` - 헬스 체크

### 2. n8n 연동
- ✅ Tally Trigger 연동
- ✅ 이미지 URL 처리 (Base64 변환 불필요)
- ✅ 슬라이드 조회 및 바이너리 변환 가이드 작성

### 3. 문서화
- ✅ `N8N_URL_API_GUIDE.md` - Tally 이미지 URL 처리 가이드
- ✅ `N8N_SLIDES_CODE_NODE.md` - 슬라이드 조회 및 변환 가이드
- ✅ `N8N_BINARY_PARSING_GUIDE.md` - 바이너리 데이터 파싱 가이드
- ✅ `N8N_WORKFLOW_STEP_BY_STEP.md` - 워크플로우 단계별 가이드
- ✅ `N8N_ANALYSIS_ID_FIX.md` - analysisId 추출 문제 해결
- ✅ `RAILWAY_ENV_SETUP.md` - Railway 환경 변수 설정 가이드
- ✅ `RAILWAY_TROUBLESHOOTING.md` - Railway 문제 해결 가이드

---

## 🔄 현재 진행 중인 문제

### 문제: API 키 인증 실패
- **증상**: 헬스 체크는 성공하지만 분석 API만 실패
- **에러 메시지**: "API 키 인증에 실패했습니다. 서버 설정을 확인해주세요."
- **상태**: 해결 중

### 확인 사항
- [ ] 헬스 체크에서 `geminiConfigured: true` 확인 필요
- [ ] Railway 로그에서 정확한 에러 메시지 확인 필요
- [ ] `GEMINI_API_KEY` 환경 변수 재확인 필요
- [ ] 서버 재배포 필요할 수 있음

---

## 📝 n8n 워크플로우 구조

### 현재 구성
```
1. Tally Trigger
   - Output: { question_4rR8Rk: "이미지URL", question_VJaPlj: "생년월일", ... }
   ↓
2. HTTP Request (분석 API 호출)
   - POST /api/analyze-from-url
   - Body: { imageUrl, birthDate, phoneNumber, instagramId }
   - Output: { success: true, data: {...}, analysisId: "..." }
   ↓
3. Code 노드 (analysisId 추출) ← 필요!
   - Input: 분석 API 응답
   - Output: { ...response, analysisId: "..." }
   ↓
4. HTTP Request (슬라이드 조회)
   - GET /api/analysis/{{ $json.analysisId }}/slides
   - Output: { success: true, data: { slides: [...], instagramId: "..." } }
   ↓
5. Code 노드 (슬라이드 변환)
   - Base64 배열 → 바이너리 배열 변환
   ↓
6. Loop Over Items
   ↓
7. 전송 (Instagram/이메일/기타)
```

---

## 🔑 주요 코드 스니펫

### analysisId 추출 (Code 노드)
```javascript
const item = $input.first();
const analysisId = item.json.data?.analysisId || item.json.analysisId;

if (!analysisId) {
  throw new Error('analysisId를 찾을 수 없습니다.');
}

return {
  json: {
    ...item.json,
    analysisId: analysisId
  }
};
```

### 슬라이드 변환 (Code 노드)
```javascript
const response = $input.first().json;
const slides = response.data.slides;

const items = slides.map((base64String, index) => {
  const buffer = Buffer.from(base64String, 'base64');
  
  return {
    json: {
      slideIndex: index + 1,
      totalSlides: slides.length,
      instagramId: response.data.instagramId,
      analysisId: response.data.analysisId
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

## 🔧 Railway 설정

### 필수 환경 변수
- `GEMINI_API_KEY`: `AIzaSyCFsqf1907hg8yTxyw-RcDp2dseHnuJawg`
- `VITE_SUPABASE_URL`: `https://ugzwgegkvxcczwiottej.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: (Supabase Anon Key)

### 배포 상태
- ✅ 서버 배포 완료
- ⚠️ 환경 변수 확인 필요

---

## 📚 주요 파일 위치

### 서버 코드
- `server.js` - Express 서버 및 API 엔드포인트

### 문서
- `N8N_URL_API_GUIDE.md` - Tally 이미지 URL 처리
- `N8N_SLIDES_CODE_NODE.md` - 슬라이드 조회 및 변환
- `N8N_WORKFLOW_STEP_BY_STEP.md` - 워크플로우 구성
- `RAILWAY_TROUBLESHOOTING.md` - 문제 해결 가이드

---

## 🎯 다음 단계

1. **API 키 인증 문제 해결**
   - Railway 로그 확인
   - 환경 변수 재설정
   - 서버 재배포

2. **n8n 워크플로우 완성**
   - analysisId 추출 Code 노드 추가
   - 슬라이드 변환 Code 노드 추가
   - 전송 방법 결정 (Instagram/이메일/기타)

3. **테스트 및 검증**
   - 전체 워크플로우 테스트
   - 에러 처리 확인
   - 성능 최적화

---

## 💡 중요 참고사항

1. **Tally 필드 이름**
   - 이미지 URL: `question_4rR8Rk`
   - 생년월일: `question_VJaPlj`
   - 전화번호: `question_PON9E1`
   - 인스타그램 ID: `question_EWGI1l`

2. **API 응답 구조**
   - 분석 API: `{ success: true, data: {...}, analysisId: "..." }`
   - 슬라이드 조회: `{ success: true, data: { slides: [...], instagramId: "..." } }`

3. **주의사항**
   - URL은 항상 `https://` 사용
   - Response Format은 `JSON`으로 설정
   - analysisId는 `data.analysisId`에서 추출 필요

---

## 📞 문제 해결 체크리스트

### API 키 인증 실패 시
- [ ] 헬스 체크에서 `geminiConfigured` 확인
- [ ] Railway 로그 확인
- [ ] 환경 변수 재설정
- [ ] 서버 재배포

### analysisId를 찾을 수 없을 때
- [ ] 이전 노드의 Output 확인
- [ ] `data.analysisId` 경로 확인
- [ ] Code 노드에서 명시적으로 추출

### 슬라이드가 없을 때
- [ ] 슬라이드가 생성되었는지 확인
- [ ] analysisId가 올바른지 확인
- [ ] API 응답 구조 확인

---

작업 일시: 2024-11-18
마지막 업데이트: API 키 인증 문제 해결 중

