# 한글 폰트 깨짐 문제 해결 가이드

## 🔴 문제

서버에서 생성된 슬라이드의 한글 텍스트가 깨져서 표시됩니다.

**원인:**
- `Arial` 폰트는 한글을 제대로 지원하지 않습니다.
- 서버 환경(Railway)에서는 시스템 폰트가 다를 수 있습니다.

---

## ✅ 해결 방법

### 방법 1: 시스템 폰트 사용 (현재 적용됨)

코드에서 한글 폰트를 사용하도록 수정했습니다:
- `Noto Sans CJK KR`
- `NanumGothic`
- `AppleGothic`
- `Malgun Gothic`

**하지만** 서버에 이 폰트들이 설치되어 있지 않을 수 있습니다.

---

### 방법 2: 폰트 파일 직접 포함 (권장)

더 확실한 방법은 Noto Sans KR 폰트 파일을 프로젝트에 포함시키는 것입니다.

#### 1단계: 폰트 파일 다운로드

1. **Google Fonts에서 다운로드**
   - https://fonts.google.com/noto/specimen/Noto+Sans+KR
   - "Download family" 클릭
   - `NotoSansKR-Regular.ttf` 파일 추출

2. **프로젝트에 폰트 파일 추가**
   ```bash
   # fonts 디렉토리에 폰트 파일 복사
   cp ~/Downloads/NotoSansKR-Regular.ttf fonts/
   ```

#### 2단계: 코드 수정

`services/serverSlideService.js` 파일 수정:

```javascript
// 폰트 파일 로드
try {
  registerFont(path.join(__dirname, '../fonts/NotoSansKR-Regular.ttf'), { 
    family: 'Noto Sans KR' 
  });
  console.log('✅ 한글 폰트 로드 성공');
} catch (error) {
  console.warn('⚠️ 폰트 파일을 찾을 수 없습니다. 시스템 폰트 사용:', error.message);
}

// 폰트 헬퍼 함수 수정
function setKoreanFont(ctx, size, weight = 'normal') {
  const weightMap = {
    'normal': 'normal',
    '500': '500',
    'bold': 'bold',
    '900': '900'
  };
  const fontWeight = weightMap[weight] || 'normal';
  // 폰트 파일이 로드되었으면 'Noto Sans KR' 사용, 아니면 시스템 폰트 사용
  ctx.font = `${fontWeight} ${size}px "Noto Sans KR", ${KOREAN_FONT}`;
}
```

---

## 🧪 테스트

### 현재 상태 확인

1. **코드 변경 완료**
   - 모든 `Arial` 폰트를 한글 폰트로 변경
   - 시스템 폰트 사용 시도

2. **배포 및 테스트**
   - 코드 커밋 및 배포
   - 슬라이드 생성 테스트
   - 한글이 정상적으로 표시되는지 확인

### 여전히 깨지면

폰트 파일을 직접 포함시키는 방법 2를 사용하세요.

---

## 📝 참고

- Canvas 라이브러리는 시스템에 설치된 폰트만 사용할 수 있습니다.
- Railway 서버에는 기본적으로 한글 폰트가 설치되어 있지 않을 수 있습니다.
- 폰트 파일을 직접 포함시키는 것이 가장 확실한 방법입니다.

---

현재 코드 변경으로 한글이 정상 표시되는지 확인해보세요. 여전히 깨지면 폰트 파일을 추가하는 방법을 진행하겠습니다!

