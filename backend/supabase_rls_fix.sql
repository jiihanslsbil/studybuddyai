-- ============================================================
-- JALANKAN INI DI SUPABASE SQL EDITOR
-- Fix: RLS policy agar backend (service role) bisa akses data
-- ============================================================

-- Nonaktifkan RLS untuk semua tabel
-- (Backend pakai service role key yang bypass RLS secara default,
--  tapi kadang Supabase versi baru memerlukan policy eksplisit)

ALTER TABLE users         DISABLE ROW LEVEL SECURITY;
ALTER TABLE summaries     DISABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes       DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans   DISABLE ROW LEVEL SECURITY;

-- Atau kalau mau tetap pakai RLS, tambahkan policy untuk service role:
-- (Uncomment baris di bawah jika ingin RLS tetap aktif)

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "service_role_all" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
-- CREATE POLICY "service_role_all" ON summaries FOR ALL TO service_role USING (true) WITH CHECK (true);
-- CREATE POLICY "service_role_all" ON quizzes FOR ALL TO service_role USING (true) WITH CHECK (true);
-- CREATE POLICY "service_role_all" ON quiz_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);
-- CREATE POLICY "service_role_all" ON study_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
