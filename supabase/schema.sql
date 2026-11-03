-- ============================================================
--  Webiko — supabase/schema.sql
--  Skema tabel untuk auth, progres, kuis, komentar, saran, dan badge.
--
--  Cara pakai: buka Supabase Dashboard → SQL Editor → tempel isi
--  file ini → Run. File bersifat IDEMPOTENT, aman dijalankan
--  berulang kali. Urutan: schema.sql DULU, lalu policies.sql.
-- ============================================================

-- citext = text yang dibandingkan case-insensitive (penting untuk username).
create extension if not exists citext;

-- ------------------------------------------------------------
-- 1. profiles — data akun (TIDAK bisa dibaca publik)
--    Username hanya untuk login dan ditampilkan lewat nama
--    yang diisi sendiri di komentar/saran. Lihat policies.sql.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   citext not null,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username ~ '^[A-Za-z0-9_]{3,20}$'
  )
);

create unique index if not exists profiles_username_key on public.profiles (username);

-- ------------------------------------------------------------
-- 2. progress — bab yang sudah diselesaikan user
-- ------------------------------------------------------------
create table if not exists public.progress (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  bab_id     text not null,
  selesai    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, bab_id)
);

-- ------------------------------------------------------------
-- 3. quiz_attempts — riwayat pengerjaan kuis
-- ------------------------------------------------------------
create table if not exists public.quiz_attempts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  bab_id     text not null,
  skor       integer not null check (skor >= 0),
  total      integer not null check (total > 0 and skor <= total),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. comments — komentar per bab
--    `nama` diisi sendiri oleh penulis (wajib), bukan username
--    akun. Jadi username tidak pernah tampil di komentar.
-- ------------------------------------------------------------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  bab_id     text not null,
  nama       text not null check (char_length(nama) between 2 and 40),
  isi        text not null check (char_length(isi) between 1 and 1000),
  created_at timestamptz not null default now(),
  hidden     boolean not null default false
);

-- Untuk project yang tabelnya sudah dibuat sebelum kolom `nama` ada.
alter table public.comments add column if not exists nama text;
alter table public.comments alter column nama set not null;
alter table public.comments drop constraint if exists comments_nama_format;
alter table public.comments add constraint comments_nama_format
  check (char_length(nama) between 2 and 40);

-- ------------------------------------------------------------
-- 5. suggestions — saran/kritik, privat (hanya pengirim yang bisa baca)
-- ------------------------------------------------------------
create table if not exists public.suggestions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  nama       text not null check (char_length(nama) between 2 and 40),
  isi        text not null check (char_length(isi) between 1 and 2000),
  created_at timestamptz not null default now(),
  dibaca     boolean not null default false
);

-- ------------------------------------------------------------
-- 6. admin_log — catatan masuk/keluar dashboard admin
--    Hanya ditulis dan dibaca lewat serverless function dengan
--    service_role. RLS aktif tanpa policy = tidak bisa diakses
--    anon/authenticated.
-- ------------------------------------------------------------
create table if not exists public.admin_log (
  id         bigint generated always as identity primary key,
  nama       text not null check (char_length(nama) between 1 and 40),
  aksi       text not null default 'masuk',
  ip         text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 7. badges — badge yang diraih user
-- ------------------------------------------------------------
create table if not exists public.badges (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles (id) on delete cascade,
  kode      text not null,
  earned_at timestamptz not null default now(),
  constraint badges_user_kode_key unique (user_id, kode)
);

-- ------------------------------------------------------------
-- Index untuk kolom yang sering difilter
-- ------------------------------------------------------------
create index if not exists progress_user_id_idx
  on public.progress (user_id);
create index if not exists progress_bab_id_idx
  on public.progress (bab_id);

create index if not exists quiz_attempts_user_id_idx
  on public.quiz_attempts (user_id, created_at desc);
create index if not exists quiz_attempts_bab_id_idx
  on public.quiz_attempts (bab_id);

create index if not exists comments_bab_id_created_at_idx
  on public.comments (bab_id, created_at desc);
create index if not exists comments_user_id_idx
  on public.comments (user_id);
-- Filter utama komentar adalah "yang tidak di-hidden" per bab.
create index if not exists comments_visible_idx
  on public.comments (bab_id, created_at desc)
  where hidden = false;

create index if not exists badges_user_id_idx
  on public.badges (user_id);
create index if not exists badges_kode_idx
  on public.badges (kode);

create index if not exists suggestions_created_at_idx
  on public.suggestions (created_at desc);
create index if not exists suggestions_user_id_idx
  on public.suggestions (user_id);
create index if not exists suggestions_belum_dibaca_idx
  on public.suggestions (created_at desc)
  where dibaca = false;

create index if not exists admin_log_created_at_idx
  on public.admin_log (created_at desc);

-- ------------------------------------------------------------
-- 9. Aktifkan RLS di semua tabel
--    Ditaruh di schema.sql juga (bukan hanya policies.sql) supaya
--    menjalankan ulang schema.sql selalu menutup celah "RLS mati".
--    Tanpa policy, RLS aktif = tidak ada baris yang bisa diakses
--    (fail-closed); policy-nya dibuat di policies.sql.
--    `enable row level security` idempotent (aman diulang).
-- ------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.progress      enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.comments      enable row level security;
alter table public.suggestions   enable row level security;
alter table public.badges        enable row level security;
alter table public.admin_log     enable row level security;
