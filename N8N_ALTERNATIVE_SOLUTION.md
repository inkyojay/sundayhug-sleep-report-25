# n8n Tally 이미지 처리 대안 방법

## 🎯 문제점
- Tally URL에서 직접 다운로드 시 바이너리 데이터를 제대로 받지 못함
- HTTP Request 노드의 Response Format 설정과 무관하게 데이터 손실 발생

## 💡 해결 방법 3가지

---

## 방법 1: 서버에 이미지 URL 변환 API 추가 (추천)

서버에 이미지 URL을 받아서 Base64로 변환해주는 API를 추가합니다.

### 서버에 추가할 API 엔드포인트

```javascript
/**
 * POST /api/convert-image-url
 * 이미지 URL을 Base64로 변환 (n8n 연동용)
 * 
 * Request Body:
 * {
 *   "imageUrl": "https://storage.tally.so/private/image.jpeg?...",
 *   "birthDate": "2024-01-15",
 *   "phoneNumber": "010-1234-5678" (선택사항),
 *   "instagramId": "@instagram_id" (선택사항)
 * }
 */
app.post('/api/convert-image-url', async (req, res) => {
  try {
    const { imageUrl, birthDate, phoneNumber, instagramId } = req.body;

    if (!imageUrl || !birthDate) {
      return res.status(400).json({
        success: false,
        error: 'imageUrl and birthDate are required'
      });
    }

    // 이미지 URL에서 이미지 다운로드
    const fetch = (await import('node-fetch')).default;
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    // 바이너리 데이터로 변환
    const imageBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);
    
    // MIME 타입 확인
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Base64로 변환
    const base64String = buffer.toString('base64');
    const imageBase64 = `data:${contentType};base64,${base64String}`;

    // 분석 수행
    const analysisResult = await analyzeSleepEnvironment(
      base64String,
      contentType,
      birthDate
    );

    const ageInMonths = calculateAgeInMonths(birthDate);

    // Supabase에 저장
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('sleep_analyses')
      .insert({
        image_base64: base64String,
        birth_date: birthDate,
        age_in_months: ageInMonths,
        summary: analysisResult.summary,
        report_slides: null,
        phone_number: phoneNumber || null,
        instagram_id: instagramId || null
      })
      .select()
      .single();

    if (saveError) {
      throw new Error(`Failed to save analysis: ${saveError.message}`);
    }

    // 피드백 항목 저장
    if (analysisResult.feedbackItems && analysisResult.feedbackItems.length > 0) {
      const feedbackItems = analysisResult.feedbackItems.map(item => ({
        sleep_analysis_id: savedAnalysis.id,
        x: item.x,
        y: item.y,
        title: item.title,
        feedback: item.feedback,
        risk_level: item.riskLevel
      }));

      const { error: feedbackError } = await supabase
        .from('sleep_analysis_feedback_items')
        .insert(feedbackItems);

      if (feedbackError) {
        console.error('Feedback items save error:', feedbackError);
      }
    }

    // 참고 자료 저장
    if (analysisResult.references && analysisResult.references.length > 0) {
      const references = analysisResult.references.map(ref => ({
        sleep_analysis_id: savedAnalysis.id,
        title: ref.title,
        uri: ref.uri
      }));

      const { error: refError } = await supabase
        .from('sleep_analysis_references')
        .insert(references);

      if (refError) {
        console.error('References save error:', refError);
      }
    }

    res.json({
      success: true,
      data: {
        ...analysisResult,
        phoneNumber: phoneNumber || null,
        instagramId: instagramId || null
      },
      analysisId: savedAnalysis.id
    });

  } catch (error) {
    console.error('Convert Image URL API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});
```

### n8n 워크플로우 (간단해짐!)

```
1. Tally Trigger
   ↓
2. HTTP Request 노드 (서버 API 호출)
   - Method: POST
   - URL: https://sundayhug-sleep-report-25-production.up.railway.app/api/convert-image-url
   - Body: JSON
   {
     "imageUrl": "{{ $json.question_4rR8Rk }}",
     "birthDate": "{{ $json.birthDate }}",
     "phoneNumber": "{{ $json.phoneNumber }}",
     "instagramId": "{{ $json.instagramId }}"
   }
```

**장점:**
- n8n에서 Base64 변환 불필요
- 서버에서 이미지 다운로드 및 변환 처리
- 더 안정적이고 신뢰할 수 있음

---

## 방법 2: n8n에서 직접 Base64 변환 (개선된 방법)

Tally URL을 받아서 n8n에서 직접 Base64로 변환합니다.

### n8n 워크플로우

```
1. Tally Trigger
   ↓
2. Code 노드 (이미지 URL을 Base64로 변환)
```

### Code 노드 코드

```javascript
// Tally에서 받은 이미지 URL
const imageUrl = $input.first().json.question_4rR8Rk;

if (!imageUrl) {
  throw new Error('이미지 URL이 없습니다.');
}

// n8n의 내장 fetch 사용
const response = await fetch(imageUrl);

if (!response.ok) {
  throw new Error(`이미지 다운로드 실패: ${response.status} ${response.statusText}`);
}

// 바이너리 데이터 가져오기
const arrayBuffer = await response.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

// Base64로 변환
const base64String = buffer.toString('base64').replace(/\s/g, '');

// MIME 타입 확인
const contentType = response.headers.get('content-type') || 'image/jpeg';

console.log('이미지 크기:', buffer.length, 'bytes');
console.log('Base64 길이:', base64String.length);
console.log('MIME 타입:', contentType);

// Tally form 데이터와 함께 반환
return {
  json: {
    imageBase64: `data:${contentType};base64,${base64String}`,
    birthDate: $input.first().json.birthDate || "2024-01-15",
    phoneNumber: $input.first().json.phoneNumber || "010-1234-5678",
    instagramId: $input.first().json.instagramId || "@instagram_id"
  }
};
```

**주의:** n8n의 Code 노드에서 `fetch`를 사용할 수 있는지 확인이 필요합니다.

---

## 방법 3: Supabase Storage에 업로드 후 사용

이미지를 Supabase Storage에 업로드한 후 공개 URL을 사용합니다.

### n8n 워크플로우

```
1. Tally Trigger
   ↓
2. HTTP Request (Tally 이미지 다운로드)
   - Response Format: File
   ↓
3. Supabase 노드 (Storage에 업로드)
   ↓
4. Code 노드 (공개 URL을 Base64로 변환 또는 직접 사용)
   ↓
5. HTTP Request (분석 API 호출)
```

---

## 🎯 추천: 방법 1 (서버 API 추가)

가장 안정적이고 간단한 방법입니다.

### 구현 단계

1. **서버에 API 엔드포인트 추가**
2. **n8n 워크플로우 단순화**
   - Tally Trigger → HTTP Request (서버 API 호출)
   - Base64 변환 불필요!

### 장점

- ✅ n8n에서 복잡한 Base64 변환 불필요
- ✅ 서버에서 안정적으로 이미지 다운로드
- ✅ 에러 처리 및 로깅 용이
- ✅ 워크플로우 단순화

---

## 📋 다음 단계

어떤 방법을 선택하시겠습니까?

1. **방법 1 (추천)**: 서버에 이미지 URL 변환 API 추가
2. **방법 2**: n8n Code 노드에서 직접 변환
3. **방법 3**: Supabase Storage 사용

방법 1을 추천합니다. 서버에 API를 추가해드릴까요?

