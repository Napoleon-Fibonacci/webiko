-- ============================================================
--  Webiko — supabase/policies.sql
--  RLS (Row Level Security) + policy + trigger profil.
--
--  Cara pakai: jalankan SETELAH supabase/schema.sql.
--  File idempotent: policy di-drop lalu dibuat ulang, jadi aman
--  dijalankan berulang kali (perubahan di file langsung berlaku).
-- ============================================================

-- ------------------------------------------------------------
-- 0. Helper: username unik lintas profiles
--    Diperlukan karena kita memakai email sintetis
--    (username@webiko.local) sehingga dua username berbeda
--    bisa menghasilkan email yang sama secara case-insensitive.
--    SECURITY DEFINER supaya pengecekan bisa melihat semua baris
--    meskipun RLS membatasi pembacaan.
-- ------------------------------------------------------------
create or replace function public.username_taken(p_username text)
returns boolean
language 'sql'
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where username = p_username::citext
  );
$$;

grant execute on function public.username_taken(text) to anon, authenticated;

-- ------------------------------------------------------------
-- 1. Trigger: buat baris profiles otomatis setelah signup
--    Username diambil dari user_metadata.username yang dikirim
--    oleh supabase.auth.signUp({ options: { data: { username } } }).
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language 'plpgsql'
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      split_part(new.email, '@', 1)
    )::citext
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 2. Aktifkan RLS di semua tabel
-- ------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.progress      enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.comments      enable row level security;
alter table public.badges        enable row level security;

-- ------------------------------------------------------------
-- 3. Hapus policy lama (idempotent re-run)
-- ------------------------------------------------------------
drop policy if exists "profiles_select_public"   on public.profiles;
drop policy if exists "profiles_update_own"      on public.profiles;

drop policy if exists "progress_select_own"      on public.progress;
drop policy if exists "progress_insert_own"      on public.progress;
drop policy if exists "progress_update_own"      on public.progress;

drop policy if exists "quiz_attempts_select_own" on public.quiz_attempts;
drop policy if exists "quiz_attempts_insert_own" on public.quiz_attempts;
drop policy if exists "quiz_attempts_update_own" on public.quiz_attempts;

drop policy if exists "comments_select_visible"  on public.comments;
drop policy if exists "comments_insert_own"      on public.comments;
drop policy if exists "comments_delete_own"      on public.comments;

drop policy if exists "badges_select_own"        on public.badges;
drop policy if exists "badges_insert_own"        on public.badges;
drop policy if exists "badges_update_own"        on public.badges;

-- ------------------------------------------------------------
-- 4. Policy per tabel
-- ------------------------------------------------------------

-- profiles: semua orang bisa melihat (username saja — jangan
-- simpan data pribadi lain di tabel ini), update hanya milik sendiri.
-- Insert hanya lewat trigger handle_new_user() (SECURITY DEFINER).
create policy "profiles_select_public"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- progress: hanya baris milik sendiri.
create policy "progress_select_own"
  on public.progress for select
  to authenticated
  using (auth.uid() = user_id);

create policy "progress_insert_own"
  on public.progress for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "progress_update_own"
  on public.progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- quiz_attempts: hanya baris milik sendiri.
create policy "quiz_attempts_select_own"
  on public.quiz_attempts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "quiz_attempts_insert_own"
  on public.quiz_attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "quiz_attempts_update_own"
  on public.quiz_attempts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- comments: baca hanya yang tidak di-hidden, tulis/hapus milik sendiri.
-- Catatan aman: policy SELECT hanya mengizinkan baris hidden = false,
-- sehingga UPDATE tidak berguna untuk menyembunyikan baris sendiri.
create policy "comments_select_visible"
  on public.comments for select
  to anon, authenticated
  using (hidden = false);

create policy "comments_insert_own"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "comments_delete_own"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- badges: user boleh mencatat badge miliknya sendiri.
-- (Validasi badge yang sah dilakukan di aplikasi; lihat catatan README.)
create policy "badges_select_own"
  on public.badges for select
  to authenticated
  using (auth.uid() = user_id);

create policy "badges_insert_own"
  on public.badges for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "badges_update_own"
  on public.badges for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
