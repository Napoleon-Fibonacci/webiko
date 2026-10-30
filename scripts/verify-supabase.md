# Verifikasi Supabase langkah demi langkah

Panduan ini untuk siapa pun (termasuk yang belum pernah memakai Supabase).
Ikuti berurutan. Setiap langkah diakhiri "tanda berhasil" — kalau tanda itu
tidak muncul, jangan lanjut ke langkah berikutnya.

**Jangan pernah** menyalin *service_role* key atau password database ke
chat, laporan, commit, atau file di repo. Yang dipakai frontend hanya
**anon public** key.

---

## 0. Siapkan (sekali saja)

- Akun <https://supabase.com> dan satu **project** Webiko
  (buat lewat **New project**; simpan password database di tempat aman —
  tidak dibutuhkan oleh situs).
- Folder repo ini terbuka di editor.
- Pastikan `assets/js/supabase-config.js` belum ada di git:
  `git check-ignore assets/js/supabase-config.js` → harus mencetak nama filenya.

**Tanda berhasil:** perintah di atas mencetak `assets/js/supabase-config.js`.

---

## 1. Jalankan `schema.sql`

1. Buka project Supabase → menu **SQL Editor** → **New query**.
2. Buka file `supabase/schema.sql` di editor, **salin seluruh isinya**.
3. Tempel ke SQL Editor, klik **Run** (atau `Ctrl+Enter`).
4. Tunggu pesan `Success. No rows returned`.

**Tanda berhasil:** `Success. No rows returned`. Kalau muncul
`already exists` dan berhenti, berarti bagian "if not exists" hilang —
laporkan, jangan dilewati.

Bukti tambahan — buka **Table Editor**: kelima tabel ini harus ada:
`profiles`, `progress`, `quiz_attempts`, `comments`, `badges`.

---

## 2. Jalankan `policies.sql`

1. Masih di **SQL Editor** → **New query**.
2. Salin seluruh isi `supabase/policies.sql` → **Run**.

**Tanda berhasil:** `Success. No rows returned`.

Bisa diulang kapan saja (file ini menghapus policy lama lalu membuat ulang),
jadi jika di kemudian hari policy diubah, cukup jalankan ulang file ini.

---

## 3. Jalankan pemeriksaan `lint.sql`

1. **SQL Editor** → **New query**.
2. Salin seluruh isi `supabase/lint.sql` → **Run**.
3. Baca hasil pertama (satu baris, kolom `saklar`).

**Tanda berhasil:** `saklar` = **`LULUS`** dan
`tabel_ok = 5`, `policy_ok = 13`, `fungsi_ok = 2`, `trigger_ok = 1`.

Kalau `GAGAL`, jalankan ulang langkah 1 lalu 2 (keduanya aman diulang),
kemudian jalankan `lint.sql` lagi.

**Cek manual RLS** (sama seperti di `supabase/README.md`):

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

**Tanda berhasil:** kelima tabel menampilkan `rowsecurity = true`.

```sql
set local role anon;
select count(*) from public.progress;   -- harus ERROR permission denied
reset role;
```

**Tanda berhasil:** query `select` di atas **error**
`permission denied for table progress`; `reset role;` tetap dijalankan.

---

## 4. Isi config

1. Di dashboard Supabase: **Project Settings** (ikon gerigi) → **API**.
2. Catat dua nilai:
   - **Project URL** → `https://<ref>.supabase.co`
   - **anon / public** key (di bagian *Project API keys*).
     **Bukan** `service_role`.
3. Di folder repo, salin contohnya:

   ```powershell
   Copy-Item assets/js/supabase-config.example.js assets/js/supabase-config.js
   ```

4. Buka `assets/js/supabase-config.js`, ganti dua placeholder:
   `GANTI-PROJECT-REF.supabase.co` dan `GANTI-DENGAN-ANON-KEY`.
   (Alias `window.SUPABASE_URL` di bawahnya terisi otomatis.)

**Tanda berhasil:** `git status` **tidak** menampilkan
`assets/js/supabase-config.js` (file ini di-.gitignore).

---

## 5. Sambungkan ke Vercel (Integrasi Vercel ↔ Supabase)

1. Buka dashboard Vercel → project Webiko → tab **Integrations** →
   cari **Supabase** → **Add Integration** → pilih project Supabase Anda.
2. Selesai. Integrasi ini berguna untuk akses dashboard/CLI, tetapi **tidak**
   menyuntikkan URL/anon key ke file statis (tidak ada build step), jadi
   situs tetap membaca `assets/js/supabase-config.js`.
3. Karena `assets/js/supabase-config.js` di-.gitignore dan repo tidak memuat
   kredensial, cara paling sederhana agar production punya config:
   buat file yang sama di mesin Anda dengan nilai production, lalu
   deploy dari folder itu (`vercel --prod` dari akar repo). Vercel
   meng-upload isi folder apa adanya — file gitignored tetap ikut ter-upload
   karena bukan dari git.
4. (Opsional, jika nanti project dihubungkan lewat GitHub) tambahkan
   `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di **Vercel → Settings →
   Environment Variables** sebagai catatan nilai production; nilainya tetap
   harus ditulis ke `supabase-config.js` sebelum deploy karena tidak ada build
   step untuk membacanya.

**Tanda berhasil:** buka URL production, buka DevTools → **Console**.
Tidak ada pesan `[supabase] window.__ENV__…` dan tidak ada error
`Failed to fetch` saat memanggil auth.

---

## 6. Pengaturan Auth di dashboard

**Authentication → Sign In / Providers → Email**:

- Matikan **Confirm email** (user daftar pakai username, email-nya sintetis
  `username@webiko.local` sehingga tidak bisa dikirimi email).
- Biarkan signup publik aktif.

**Tanda berhasil:** uji daftar dari situs berhasil tanpa perlu klik link email,
dan tabel `profiles` mendapat baris baru dengan `username` yang didaftarkan
(trigger `handle_new_user()` bekerja).

---

## 7. Uji dari situs

1. Buka situs (lokal atau production) → daftar dengan username uji
   (misal `budi_01`).
2. Di SQL Editor: `select * from public.profiles;`
3. Login, tandai satu bab selesai, lalu lihat `select * from public.progress;`.

**Tanda berhasil:** baris `profiles` muncul setelah daftar; baris `progress`
muncul setelah menandai bab. Kalau `profiles` kosong, trigger belum terpasang →
ulangi langkah 2.
