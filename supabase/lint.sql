-- ============================================================
--  Webiko — supabase/lint.sql
--  Pemeriksaan bukti bahwa schema.sql + policies.sql SUDAH jalan.
--  Read-only: file ini HANYA SELECT, tidak mengubah apa pun.
--  Jalankan PALING AKHIR, setelah schema.sql lalu policies.sql.
--
--  Hasil yang diharapkan:
--   - saklar "Webiko"  -> 'LULUS' (bukan 'GAGAL')
--   - tabel_ok            -> 7 dari 7, semua rowsecurity = true
--   - policy_ok           -> 17 dari 17
--   - fungsi_ok           -> 3 dari 3
--   - trigger_ok          -> 1 dari 1
--
--  Kalau "saklar" = 'GAGAL', pesan errornya menyebut apa yang
--  kurang — ulangi langkah di scripts/verify-supabase.md.
-- ============================================================

with
tabel as (
  select tablename, rowsecurity
  from pg_tables
  where schemaname = 'public'
    and tablename in ('profiles', 'progress', 'quiz_attempts', 'comments',
                      'suggestions', 'badges', 'admin_log')
),
policy as (
  select schemaname, tablename, policyname, cmd, qual, with_check
  from pg_policies
  where schemaname = 'public'
),
fungsi as (
  select proname
  from pg_proc
  join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
  where nspname = 'public'
    and proname in ('handle_new_user', 'username_taken', 'jumlah_anggota')
),
pemicu as (
  select tgname
  from pg_trigger
  join pg_class on pg_class.oid = pg_trigger.tgrelid
  join pg_namespace on pg_namespace.oid = pg_class.relnamespace
  where nspname = 'auth'
    and relname = 'users'
    and tgname = 'on_auth_user_created'
    and not tgisinternal
)
select
  s.nama,
  s.tabel_ok,
  s.policy_ok,
  s.fungsi_ok,
  s.trigger_ok,
  case
    when s.tabel_ok = 7 and s.policy_ok = 17 and s.fungsi_ok = 3 and s.trigger_ok = 1
      then 'LULUS'
    else 'GAGAL — ulangi scripts/verify-supabase.md'
  end as saklar
from (
  select 'Webiko'::text as nama,
         (select count(*) from tabel where rowsecurity) as tabel_ok,
         (select count(*) from policy) as policy_ok,
         (select count(*) from fungsi) as fungsi_ok,
         (select count(*) from pemicu) as trigger_ok
) s;

-- ------------------------------------------------------------
-- Detail mentah (untuk disalin ke laporan/issue bila ada yang aneh).
-- Semua tabel public harus rowsecurity = true.
-- ------------------------------------------------------------
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
