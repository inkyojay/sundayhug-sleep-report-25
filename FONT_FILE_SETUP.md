# 한글 폰트 파일 설정 가이드

## 🔴 문제

서버 환경에서 한글 폰트가 설치되어 있지 않아 텍스트가 깨집니다 (□□□ 표시).

## ✅ 해결 방법: 폰트 파일 직접 포함

### 1단계: Noto Sans KR 폰트 다운로드

1. **Google Fonts에서 다운로드**
   - https://fonts.google.com/noto/specimen/Noto+Sans+KR
   - "Download family" 버튼 클릭
   - ZIP 파일 다운로드

2. **폰트 파일 추출**
   - ZIP 파일 압축 해제
   - `NotoSansKR-Regular.ttf` 파일 찾기
   - (필요시 `NotoSansKR-Bold.ttf`도 추출)

### 2단계: 프로젝트에 폰트 파일 추가

```bash
# fonts 디렉토리에 폰트 파일 복사
cp ~/Downloads/NotoSansKR-Regular.ttf fonts/
# 또는 직접 파일을 fonts/ 디렉토리로 드래그 앤 드롭
```

### 3단계: 코드 수정

`services/serverSlideService.js` 파일을 수정하여 폰트 파일을 로드하도록 변경합니다.

---

## 🚀 빠른 해결 방법

폰트 파일을 다운로드하신 후, 제가 코드를 수정해드리겠습니다.

**필요한 파일:**
- `fonts/NotoSansKR-Regular.ttf` (필수)
- `fonts/NotoSansKR-Bold.ttf` (선택사항)

폰트 파일을 `fonts/` 디렉토리에 추가하신 후 알려주세요!

