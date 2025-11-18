# n8n 바이너리 데이터 수정 가이드

## 🚨 문제
- 슬라이드가 다운로드되지 않음
- View로 봐도 아무것도 안 보임

## 🔧 해결 방법

### Code 노드 (슬라이드 변환) 코드 수정

기존 코드를 다음으로 **완전히 교체**하세요:

```javascript
const response = $input.first().json;

if (!response.success || !response.data || !response.data.slides) {
  throw new Error('슬라이드 데이터를 찾을 수 없습니다. 응답: ' + JSON.stringify(response));
}

const slidesData = response.data;
const slides = slidesData.slides;

console.log(`📊 슬라이드 개수: ${slides.length}`);
console.log(`📸 인스타그램 ID: ${slidesData.instagramId}`);

// 각 슬라이드를 개별 아이템으로 변환
const items = slides.map((base64String, index) => {
  try {
    // Base64 문자열 검증
    if (!base64String || typeof base64String !== 'string') {
      throw new Error(`슬라이드 ${index + 1}의 Base64 데이터가 유효하지 않습니다.`);
    }
    
    // Base64 문자열을 Buffer로 변환
    const buffer = Buffer.from(base64String, 'base64');
    
    // Buffer가 비어있는지 확인
    if (buffer.length === 0) {
      throw new Error(`슬라이드 ${index + 1}의 Buffer가 비어있습니다.`);
    }
    
    console.log(`✅ 슬라이드 ${index + 1}/${slides.length} 변환 완료 (${buffer.length} bytes)`);
    
    // n8n 바이너리 형식에 맞게 반환
    return {
      json: {
        slideIndex: index + 1,
        totalSlides: slides.length,
        instagramId: slidesData.instagramId,
        analysisId: slidesData.analysisId,
        phoneNumber: slidesData.phoneNumber,
        fileName: `수면분석리포트_${index + 1}.png`
      },
      binary: {
        data: buffer  // Buffer 객체를 직접 반환
      }
    };
  } catch (error) {
    console.error(`❌ 슬라이드 ${index + 1} 변환 실패:`, error.message);
    console.error(`Base64 길이: ${base64String ? base64String.length : 0}`);
    throw new Error(`슬라이드 ${index + 1} 변환 실패: ${error.message}`);
  }
});

console.log(`✅ 총 ${items.length}개의 슬라이드 아이템 생성 완료`);

return items;
```

---

## 🔍 문제 진단

### 1. Base64 데이터 확인

슬라이드 조회 API의 응답을 확인하세요:

```javascript
// Code 노드에 임시로 추가하여 확인
const response = $input.first().json;
console.log('슬라이드 데이터 확인:');
console.log('- slides 배열 길이:', response.data?.slides?.length);
console.log('- 첫 번째 슬라이드 길이:', response.data?.slides?.[0]?.length);
console.log('- 첫 번째 슬라이드 앞 50자:', response.data?.slides?.[0]?.substring(0, 50));
```

### 2. Buffer 변환 확인

```javascript
const base64String = response.data.slides[0];
const buffer = Buffer.from(base64String, 'base64');
console.log('Buffer 길이:', buffer.length);
console.log('Buffer 타입:', typeof buffer);
```

---

## ⚠️ 주의사항

### n8n 바이너리 데이터 형식

n8n에서 바이너리 데이터는 다음과 같은 형식이어야 합니다:

```javascript
{
  json: { ... },
  binary: {
    data: Buffer  // Buffer 객체 직접 사용
  }
}
```

또는:

```javascript
{
  json: { ... },
  binary: {
    data: {
      data: Buffer,
      mimeType: 'image/png',
      fileName: 'filename.png'
    }
  }
}
```

---

## 🎯 테스트 방법

1. **Code 노드 실행**
   - Execute step 클릭
   - Output 확인

2. **바이너리 데이터 확인**
   - Output에서 각 아이템의 `binary` 필드 확인
   - `binary.data`가 Buffer인지 확인

3. **View/Download 테스트**
   - View 버튼 클릭
   - Download 버튼 클릭

---

## 💡 추가 디버깅

문제가 계속되면:

1. **슬라이드 조회 API 직접 테스트**
   ```bash
   curl https://sundayhug-sleep-report-25-production.up.railway.app/api/analysis/{analysisId}/slides
   ```

2. **Base64 데이터 검증**
   - Base64 문자열이 올바른 형식인지 확인
   - 길이가 충분한지 확인 (최소 수백 자)

3. **Railway 로그 확인**
   - 슬라이드 생성 로그 확인
   - 에러 메시지 확인

---

위 코드로 수정한 후 다시 테스트해보세요!

