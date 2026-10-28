# Supabase — skema, RLS, dan verifikasi

Folder ini berisi SQL untuk database Web Guide. Semua dijalankan manual
di **Supabase Dashboard → SQL Editor** (tidak ada `psql`/migration runner
di project ini).

| File | Isi | Wajib? |
| --- | --- | --- |
| `schema.sql` | Tabel, index, constraint, dan `enable row level security` | Ya, pertama |
| `policies.sql` | Policy RLS, fungsi `username_taken()`, trigger `handle_new_user()` | Ya, kedua |
| `lint.sql` | Pemeriksaan read-only: membuktikan skema + RLS sudah masuk | Ya, terakhir |

Panduan langkah-langkah lengkap (untuk orang awam): `scripts/verify-supabase.md`.

## Idempotent (aman dijalankan ulang)

- `schema.sql`: `create extension if not exists`, `create table if not exists`,
  `create [unique] index if not exists`, dan `alter table … enable row level
  security` — semuanya aman diulang.
- `policies.sql`: `create or replace function`, `drop trigger if exists` sebelum
  `create trigger`, dan `drop policy if exists` sebelum tiap `create policy`.
  Perubahan isi policy langsung berlaku saat file dijalankan ulang.
- `lint.sql`: murni `select`, tidak mengubah apa pun.

## Kenapa RLS diaktifkan di dua file

`schema.sql` menyalakan RLS untuk kelima tabel, dan `policies.sql` juga.
Tujuannya: menjalankan ulang `schema.sql` **selamanya** menutup celah
"RLS mati" (misalnya tabel dibuat ulang/di-`alter` oleh orang lain), tanpa
bergantung pada urutan run. RLS aktif tanpa policy = tidak ada baris yang
bisa dibaca/ditulis (fail-closed); policy-nya baru dipasang `policies.sql`.

## Membuktikan RLS aktif

Jalankan query berikut di **SQL Editor** (atau cukup jalankan `lint.sql`).
Kolom `rowsecurity` HARUS `true` untuk kelima tabel
`profiles`, `progress`, `quiz_attempts`, `comments`, `badges`.

```sql
-- 1. RLS per tabel. Semua baris harus rowsecurity = true.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

```sql
-- 2. Daftar policy yang terpasang beserta kondisi USING (qual)
--    dan WITH CHECK-nya.
select schemaname, tablename, policyname, cmd, qual
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Hasil yang diharapkan pada query ke-2 — 13 baris:

| Tabel | Policy | `cmd` |
| --- | --- | --- |
| `profiles` | `profiles_select_public` | `SELECT` |
| `profiles` | `profiles_update_own` | `UPDATE` |
| `progress` | `progress_select_own`, `progress_insert_own`, `progress_update_own` | `SELECT`, `INSERT`, `UPDATE` |
| `quiz_attempts` | `quiz_attempts_select_own`, `quiz_attempts_insert_own`, `quiz_attempts_update_own` | `SELECT`, `INSERT`, `UPDATE` |
| `comments` | `comments_select_visible`, `comments_insert_own`, `comments_delete_own` | `SELECT`, `INSERT`, `DELETE` |
| `badges` | `badges_select_own`, `badges_insert_own`, `badges_update_own` | `SELECT`, `INSERT`, `UPDATE` |

Tabel tanpa policy di daftar di atas = RLS aktif tapi tertutup total (fail-closed).

## Bukti runtime: RLS benar-benar memblokir

Pemeriksaan di atas membuktikan konfigurasi. Untuk membuktikan *perilakunya*
(anon tanpa login tidak bisa membaca data orang lain), jalankan di SQL Editor —
query ini meniru peran `anon` lalu mengembalikan peran semula:

```sql
select count(*) as jumlah_baris_dilihat_user from public.progress;

set local role anon;
select count(*) as harus_error_permission_denied
from public.progress;               -- harus error "permission denied"
reset role;
```

- Query pertama boleh mengembalikan angka apa pun.
- Query `select` saat `role anon` **harus gagal** dengan
  `permission denied for table progress` — itulah tanda RLS menahan akses.

## Cek cepat di sisi aplikasi

Setelah situs memuat tanpa error `[supabase]` di console: login sebagai user A,
tulis progres, lalu login sebagai user B — progres user A tidak boleh terlihat.
Error `permission denied` / hasil kosong tak terduga biasanya berarti
`policies.sql` belum dijalankan atau `supabase-config.js` masih berisi anon key
dari project Supabase lain.
