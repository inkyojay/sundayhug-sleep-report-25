# 수면 분석 API 문서

## 개요

이 API는 아기 수면 환경 분석 결과를 조회하고 통계 정보를 제공합니다. n8n과 같은 자동화 도구와 연동하여 사용할 수 있습니다.

## Base URL

```
https://ugzwgegkvxcczwiottej.supabase.co/functions/v1/sleep-analysis-api
```

## 인증

API 요청 시 다음 헤더가 필요합니다:

```
apikey: YOUR_SUPABASE_ANON_KEY
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

## 엔드포인트

### 1. 분석 결과 목록 조회

**GET** `/sleep-analyses`

분석 결과 목록을 조회합니다.

#### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 | 기본값 |
|---------|------|------|------|--------|
| `limit` | number | 아니오 | 조회할 항목 수 | 10 |
| `offset` | number | 아니오 | 시작 위치 (페이지네이션) | 0 |
| `birth_date` | string | 아니오 | 생년월일 필터 (YYYY-MM-DD) | - |
| `age_in_months` | number | 아니오 | 월령 필터 | - |

#### 예시 요청

```bash
curl -X GET \
  'https://ugzwgegkvxcczwiottej.supabase.co/functions/v1/sleep-analysis-api/sleep-analyses?limit=20&offset=0' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY'
```

#### 응답 예시

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "image_url": null,
      "image_base64": "base64-string...",
      "birth_date": "2024-01-15",
      "age_in_months": 12,
      "summary": "종합 요약 내용...",
      "created_at": "2025-01-25T10:30:00Z",
      "updated_at": "2025-01-25T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

### 2. 특정 분석 결과 조회

**GET** `/sleep-analyses/:id`

특정 분석 결과의 상세 정보를 조회합니다. 피드백 항목과 참고 자료를 포함합니다.

#### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `id` | string | 예 | 분석 결과 UUID |

#### 예시 요청

```bash
curl -X GET \
  'https://ugzwgegkvxcczwiottej.supabase.co/functions/v1/sleep-analysis-api/sleep-analyses/uuid-here' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY'
```

#### 응답 예시

```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "image_url": null,
    "image_base64": "base64-string...",
    "birth_date": "2024-01-15",
    "age_in_months": 12,
    "summary": "종합 요약 내용...",
    "created_at": "2025-01-25T10:30:00Z",
    "updated_at": "2025-01-25T10:30:00Z",
    "feedbackItems": [
      {
        "id": "feedback-uuid",
        "analysis_id": "uuid-here",
        "item_id": 1,
        "x": 25.5,
        "y": 30.2,
        "title": "위험 요소 제목",
        "feedback": "상세 피드백 내용...",
        "risk_level": "High",
        "created_at": "2025-01-25T10:30:00Z"
      }
    ],
    "references": [
      {
        "id": "ref-uuid",
        "analysis_id": "uuid-here",
        "title": "참고 자료 제목",
        "uri": "https://example.com/reference",
        "created_at": "2025-01-25T10:30:00Z"
      }
    ]
  }
}
```

---

### 3. 통계 정보 조회

**GET** `/sleep-analyses/stats`

전체 분석 통계 정보를 조회합니다.

#### 예시 요청

```bash
curl -X GET \
  'https://ugzwgegkvxcczwiottej.supabase.co/functions/v1/sleep-analysis-api/sleep-analyses/stats' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY'
```

#### 응답 예시

```json
{
  "success": true,
  "data": {
    "totalAnalyses": 150,
    "riskLevelDistribution": {
      "High": 45,
      "Medium": 80,
      "Low": 120,
      "Info": 30
    }
  }
}
```

---

## 에러 응답

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

### HTTP 상태 코드

- `200`: 성공
- `400`: 잘못된 요청
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 오류

---

## n8n 연동 가이드

### 1. HTTP Request 노드 설정

n8n에서 HTTP Request 노드를 사용하여 API를 호출할 수 있습니다.

#### 기본 설정

- **Method**: GET
- **URL**: `https://ugzwgegkvxcczwiottej.supabase.co/functions/v1/sleep-analysis-api/sleep-analyses`
- **Authentication**: Header Auth
  - **Name**: `apikey`
  - **Value**: `YOUR_SUPABASE_ANON_KEY`
- **Additional Header**:
  - **Name**: `Authorization`
  - **Value**: `Bearer YOUR_SUPABASE_ANON_KEY`

#### 예시 워크플로우

1. **트리거**: Webhook 또는 Schedule Trigger
2. **HTTP Request**: 분석 결과 목록 조회
3. **Code**: 데이터 처리 및 필터링
4. **Slack/Email**: 결과 알림 전송

### 2. 자동화 시나리오 예시

#### 시나리오 1: 일일 분석 리포트 생성

```
Schedule Trigger (매일 오전 9시)
  → HTTP Request (GET /sleep-analyses/stats)
  → Code (데이터 포맷팅)
  → Email (리포트 전송)
```

#### 시나리오 2: 고위험 분석 결과 알림

```
Schedule Trigger (매 1시간)
  → HTTP Request (GET /sleep-analyses?limit=100)
  → Filter (risk_level = "High")
  → Slack (고위험 항목 알림)
```

#### 시나리오 3: 월별 통계 대시보드

```
Schedule Trigger (매월 1일)
  → HTTP Request (GET /sleep-analyses/stats)
  → HTTP Request (GET /sleep-analyses?limit=1000)
  → Code (통계 계산)
  → Google Sheets (데이터 저장)
```

---

## 데이터베이스 스키마

### sleep_analyses 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 고유 ID |
| image_url | TEXT | 이미지 URL (선택) |
| image_base64 | TEXT | Base64 인코딩된 이미지 |
| birth_date | DATE | 아기 생년월일 |
| age_in_months | INTEGER | 월령 |
| summary | TEXT | 종합 요약 |
| created_at | TIMESTAMPTZ | 생성 시간 |
| updated_at | TIMESTAMPTZ | 수정 시간 |

### sleep_analysis_feedback_items 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 고유 ID |
| analysis_id | UUID | 분석 결과 ID (FK) |
| item_id | INTEGER | 항목 번호 |
| x | NUMERIC | 이미지 내 x 좌표 (0-100) |
| y | NUMERIC | 이미지 내 y 좌표 (0-100) |
| title | TEXT | 제목 |
| feedback | TEXT | 피드백 내용 |
| risk_level | VARCHAR | 위험도 (High/Medium/Low/Info) |
| created_at | TIMESTAMPTZ | 생성 시간 |

### sleep_analysis_references 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 고유 ID |
| analysis_id | UUID | 분석 결과 ID (FK) |
| title | TEXT | 참고 자료 제목 |
| uri | TEXT | 참고 자료 URL |
| created_at | TIMESTAMPTZ | 생성 시간 |

---

## 제한 사항

- API 호출 제한: Supabase 무료 플랜 기준 (초당 2회)
- 이미지 크기: Base64 인코딩된 이미지는 최대 5MB 권장
- 페이지네이션: 한 번에 최대 1000개 항목 조회 가능

---

## 지원

문제가 발생하거나 질문이 있으시면 프로젝트 이슈를 생성해주세요.

