# 슬라이드 조회 및 변환 단계

## ✅ 현재 완료된 단계

1. ✅ Tally Trigger
2. ✅ HTTP Request (분석 API)
3. ✅ Code 노드 (analysisId 추출)
4. ✅ HTTP Request (슬라이드 생성) - **방금 완료!**
   - slideCount: 3개 생성됨

---

## 📋 다음 단계: 슬라이드 조회 및 변환

### 5단계: HTTP Request (슬라이드 조회)

**목적**: 생성된 슬라이드 URL 배열 가져오기

**노드 추가:**
- 노드 타입: `HTTP Request`
- 노드 이름: `Get Slides`

**설정:**

**Parameters 탭:**
- Method: `GET`
- URL: `https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{{ $json.analysisId }}/slides`
- Authentication: `None`
- Send Body: `Off`

**Settings 탭:**
- Response Format: `JSON`

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "analysisId": "0a746a6d-e196-48be-92b5-950275319977",
    "slides": [
      "https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/sleep-analysis/slides/.../slide-1.png",
      "https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/sleep-analysis/slides/.../slide-2.png",
      "https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/sleep-analysis/slides/.../slide-3.png"
    ],
    "slideCount": 3,
    "isUrlArray": true
  }
}
```

**확인 사항:**
- `success: true` 확인
- `slides` 배열에 URL이 3개 있는지 확인
- 각 URL이 Storage URL 형식인지 확인

---

### 6단계: Code 노드 (URL 배열 → 개별 아이템)

**목적**: 슬라이드 URL 배열을 개별 아이템으로 변환

**노드 추가:**
- 노드 타입: `Code`
- 노드 이름: `Convert URLs to Items`

**코드:**
```javascript
// 이전 노드(HTTP Request)에서 응답 받기
const response = $input.first().json;

// 응답 검증
if (!response.success || !response.data || !response.data.slides) {
  throw new Error('슬라이드 데이터를 찾을 수 없습니다. 응답: ' + JSON.stringify(response));
}

const slidesData = response.data;
const slideUrls = slidesData.slides; // URL 배열

console.log(`📊 슬라이드 개수: ${slideUrls.length}`);
console.log(`📸 인스타그램 ID: ${slidesData.instagramId}`);
console.log(`🆔 분석 ID: ${slidesData.analysisId}`);

// 각 URL을 개별 아이템으로 변환
const items = slideUrls.map((url, index) => {
  return {
    json: {
      slideUrl: url,
      slideIndex: index + 1,
      totalSlides: slideUrls.length,
      instagramId: slidesData.instagramId || null,
      analysisId: slidesData.analysisId || null,
      phoneNumber: slidesData.phoneNumber || null
    }
  };
});

console.log(`✅ ${items.length}개의 아이템 생성 완료`);

return items;
```

**설정:**
- Mode: `Run Once for All Items` (기본값)

**출력 확인:**
- 3개의 아이템이 생성되어야 함
- 각 아이템에 `slideUrl`, `slideIndex`, `totalSlides` 포함

---

### 7단계: Loop Over Items

**목적**: 각 슬라이드를 개별적으로 처리

**노드 추가:**
- 노드 타입: `Loop Over Items`
- 노드 이름: `Loop Slides`

**설정:**
- 기본 설정 사용 (추가 설정 불필요)

**동작:**
- 이전 노드에서 생성된 3개의 아이템을 하나씩 처리
- 다음 노드가 각 슬라이드마다 실행됨

---

### 8단계: HTTP Request (이미지 다운로드)

**목적**: Storage URL에서 이미지 다운로드 (View/Download 가능하게)

**노드 추가:**
- 노드 타입: `HTTP Request`
- 노드 이름: `Download Slide Image`

**설정:**

**Parameters 탭:**
- Method: `GET`
- URL: `{{ $json.slideUrl }}`
- Authentication: `None`
- Send Body: `Off`

**Settings 탭:**
- Response Format: `File` 또는 `Binary` ← **중요!**

**설정 확인:**
- Response Format이 `File` 또는 `Binary`로 설정되어 있어야 View/Download 버튼이 작동합니다!

**출력:**
- 각 슬라이드 이미지가 바이너리 데이터로 다운로드됨
- n8n에서 View 버튼으로 이미지 확인 가능
- Download 버튼으로 파일 다운로드 가능

---

## ✅ 완성된 워크플로우 구조

```
1. Tally Trigger ✅
   ↓
2. HTTP Request (분석 API) ✅
   ↓
3. Code 노드 (analysisId 추출) ✅
   ↓
4. HTTP Request (슬라이드 생성) ✅
   ↓
5. HTTP Request (슬라이드 조회) ← 지금 여기!
   ↓
6. Code 노드 (URL → 개별 아이템)
   ↓
7. Loop Over Items
   ↓
8. HTTP Request (이미지 다운로드)
```

---

## 🧪 테스트 순서

1. **5단계 실행**
   - 슬라이드 조회 API 호출
   - URL 배열 3개 확인
   - `isUrlArray: true` 확인

2. **6단계 실행**
   - 3개의 개별 아이템 생성 확인
   - 각 아이템에 `slideUrl` 있는지 확인

3. **7단계 실행**
   - Loop Over Items 작동 확인

4. **8단계 실행**
   - 각 슬라이드 이미지 다운로드 확인
   - **View 버튼** 클릭 → 이미지 확인
   - **Download 버튼** 클릭 → 파일 다운로드

---

## ⚠️ 중요 사항

### 8단계 Response Format 설정

**반드시 확인:**
- Response Format이 `File` 또는 `Binary`로 설정되어 있어야 합니다!
- `JSON`으로 설정되어 있으면 View/Download 버튼이 작동하지 않습니다.

### URL 확인

5단계에서 받은 URL이 올바른지 확인:
- Storage URL 형식: `https://ugzwgegkvxcczwiottej.supabase.co/storage/v1/object/public/sleep-analysis/slides/...`
- 브라우저에서 직접 URL을 열어서 이미지가 보이는지 확인 가능

---

## 🎯 다음 단계

모든 단계 완료 후:
- ✅ 슬라이드 이미지 다운로드 완료
- ✅ View/Download 버튼 작동 확인
- ⏭️ Instagram DM 전송 등 다음 단계 진행 가능

---

지금 5단계(슬라이드 조회)부터 진행하세요! 🚀

