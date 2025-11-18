# Supabase Storage 정책 설정 가이드

## 🔴 에러 원인

**에러 메시지:**
```
Storage 업로드 실패: new row violates row-level security policy
```

**원인:**
- Supabase Storage의 Row Level Security (RLS) 정책이 업로드를 차단하고 있습니다.
- 버킷이 Public이어도, 업로드하려면 적절한 정책이 필요합니다.

---

## ✅ 해결 방법: Storage 정책 설정

### 1단계: Supabase Dashboard 접속

1. **Storage 페이지로 이동**
   - URL: https://supabase.com/dashboard/project/ugzwgegkvxcczwiottej/storage/buckets
   - 또는: Dashboard → Storage → Buckets

2. **버킷 선택**
   - `sleep-analysis` 버킷 클릭

---

### 2단계: Storage 정책 설정

#### 방법 A: Policies 탭에서 설정 (권장)

1. **Policies 탭 클릭**
   - 버킷 상세 페이지에서 "Policies" 탭 클릭

2. **새 정책 추가**
   - "New Policy" 또는 "Add Policy" 버튼 클릭

3. **정책 설정**

   **정책 1: INSERT (업로드 허용)**
   - Policy name: `Allow public uploads`
   - Allowed operation: `INSERT`
   - Target roles: `anon`, `authenticated`
   - Policy definition:
     ```sql
     (bucket_id = 'sleep-analysis')
     ```

   **정책 2: SELECT (읽기 허용)**
   - Policy name: `Allow public reads`
   - Allowed operation: `SELECT`
   - Target roles: `anon`, `authenticated`
   - Policy definition:
     ```sql
     (bucket_id = 'sleep-analysis')
     ```

   **정책 3: UPDATE (업데이트 허용)**
   - Policy name: `Allow public updates`
   - Allowed operation: `UPDATE`
   - Target roles: `anon`, `authenticated`
   - Policy definition:
     ```sql
     (bucket_id = 'sleep-analysis')
     ```

#### 방법 B: SQL Editor에서 직접 실행

1. **SQL Editor 열기**
   - Dashboard → SQL Editor

2. **다음 SQL 실행:**
   ```sql
   -- sleep-analysis 버킷에 대한 정책 설정

   -- 1. INSERT 정책 (업로드 허용)
   CREATE POLICY "Allow public uploads"
   ON storage.objects
   FOR INSERT
   TO anon, authenticated
   WITH CHECK (bucket_id = 'sleep-analysis');

   -- 2. SELECT 정책 (읽기 허용)
   CREATE POLICY "Allow public reads"
   ON storage.objects
   FOR SELECT
   TO anon, authenticated
   USING (bucket_id = 'sleep-analysis');

   -- 3. UPDATE 정책 (업데이트 허용)
   CREATE POLICY "Allow public updates"
   ON storage.objects
   FOR UPDATE
   TO anon, authenticated
   USING (bucket_id = 'sleep-analysis');
   ```

3. **실행**
   - "Run" 버튼 클릭

---

### 3단계: 정책 확인

1. **Storage → Policies 확인**
   - `sleep-analysis` 버킷에 3개의 정책이 생성되었는지 확인

2. **정책 상태 확인**
   - 각 정책이 "Enabled" 상태인지 확인

---

## 🧪 테스트

정책 설정 후:

1. **n8n 워크플로우 재실행**
   - Tally 폼 제출 또는 수동 실행

2. **결과 확인**
   - 에러가 발생하지 않는지 확인
   - Supabase Storage에 파일이 업로드되는지 확인

---

## 🔍 문제 해결

### 문제 1: 정책이 적용되지 않음

**해결:**
- 정책을 저장한 후 페이지를 새로고침
- 정책이 "Enabled" 상태인지 확인

### 문제 2: 여전히 업로드 실패

**확인 사항:**
- 버킷 이름이 정확히 `sleep-analysis`인지 확인
- 정책의 `bucket_id` 조건이 올바른지 확인
- 정책이 `anon` 역할에 적용되었는지 확인

### 문제 3: SQL 실행 오류

**에러: "policy already exists"**
- 정책이 이미 존재하는 경우
- 기존 정책을 삭제하고 다시 생성하거나, 정책 이름 변경

**해결:**
```sql
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;

-- 새로 생성
-- (위의 CREATE POLICY 명령어 실행)
```

---

## ✅ 완료 후 확인

정책 설정 완료 후:
- [ ] Storage 정책 3개 생성 확인
- [ ] n8n 워크플로우 재실행
- [ ] 에러 없이 업로드 성공
- [ ] Supabase Storage에 파일 확인

---

**중요**: 정책을 설정하지 않으면 업로드가 계속 실패합니다. 반드시 위의 정책을 설정해주세요!

