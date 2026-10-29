# Web Guide

Website pembelajaran untuk anak sekolah yang ingin belajar membuat website dari dasar, ditulis dalam Bahasa Indonesia.

## Stack

- **Frontend:** HTML, CSS, dan JavaScript vanilla (tanpa framework, tanpa build step)
- **Backend:** [Supabase](https://supabase.com) (auth + database)
- **Deploy:** [Vercel](https://vercel.com)

## Struktur folder

```
.
├── index.html          # Halaman utama
├── vercel.json         # Konfigurasi deploy Vercel
├── assets/
│   ├── css/style.css   # Stylesheet utama
│   ├── js/main.js      # Script utama
│   ├── js/main.js      # Script utama
│   └── img/            # Gambar
├── data/
│   └── kurikulum.js    # Daftar kurikulum materi
└── materi/             # Materi pelajaran
```

## Setup Supabase (3 langkah)

Situs butuh database Supabase untuk login, progres, komentar, dan badge.
Panduan detail dengan "tanda berhasil" tiap langkah ada di
[`scripts/verify-supabase.md`](scripts/verify-supabase.md).

### 1. Buat project

1. Buka <https://supabase.com/dashboard> → **New project**.
2. Setelah project siap, catat dua nilai di **Project Settings → API**:
   - **Project URL** (bentuknya `https://<ref>.supabase.co`)
   - **anon public** key — **bukan** `service_role`.

### 2. Jalankan 2 file SQL

Buka **SQL Editor** → **New query**, lalu untuk tiap langkah: tempel isi file
dan klik **Run**. Urutannya penting.

1. `supabase/schema.sql` → membuat tabel, index, dan menyalakan RLS.
2. `supabase/policies.sql` → membuat policy RLS, fungsi `username_taken()`,
   dan trigger `handle_new_user()`.
3. Opsional, untuk membuktikan semuanya masuk: jalankan `supabase/lint.sql`.
   Kolom `saklar` harus `LULUS`.

Kedua file idempotent (aman dijalankan ulang). Detail + query cek RLS:
[`supabase/README.md`](supabase/README.md).

Tambahan di dashboard (bukan SQL): **Authentication → Sign In / Providers →
Email** → matikan **Confirm email**. User mendaftar dengan username, tanpa
email sungguhan.

### 3. Isi config

```powershell
Copy-Item assets/js/supabase-config.example.js assets/js/supabase-config.js
```

Isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `assets/js/supabase-config.js`
dengan nilai dari langkah 1. File ini **di-.gitignore** dan tidak boleh
di-commit.

Untuk production di Vercel: situs ini statis tanpa build step, jadi file
tersebut **tidak ditemukan lewat Environment Variables**. Buat file yang sama
dengan nilai production, lalu deploy dari folder itu:

```powershell
vercel --prod
```

Integrasi **Vercel ↔ Supabase** (Vercel → Project → **Integrations**) tetap
berguna untuk akses dashboard, tetapi tidak mengisi config situs ini.

Anon key memang publik (aman di browser) — keamanan data dijaga oleh RLS.
Jangan pernah memakai `service_role` key atau DB password di frontend.

## Akun: username + password

Supabase Auth berbasis email, sedangkan user mendaftar dengan
**username + password saja** (tanpa nama asli, email asli, atau data
pribadi lain). Pendekatan:

- Username dipetakan ke email sintetis: `username@webguide.local`.
- Saat `signUp`, username juga dikirim sebagai
  `options.data.username`; trigger `handle_new_user()` memakainya
  untuk mengisi `profiles.username`.
- Username divalidasi `^[A-Za-z0-9_]{3,20}$` dan disimpan sebagai
  `citext`, sehingga unik tanpa membedakan huruf besar/kecil.
  Helper `username_taken()` dipakai untuk mengecek ketersediaan
  sebelum signup.

| Tabel | Isi |
| --- | --- |
| `profiles` | `id` (= `auth.users.id`), `username`, `created_at` |
| `progress` | `user_id`, `bab_id`, `selesai`, `updated_at` |
| `quiz_attempts` | `id`, `user_id`, `bab_id`, `skor`, `total`, `created_at` |
| `comments` | `id`, `user_id`, `bab_id`, `isi`, `created_at`, `hidden` |
| `badges` | `id`, `user_id`, `kode`, `earned_at` |

Semua tabel memakai RLS. Ringkasannya:

- `profiles`: SELECT untuk semua (hanya berisi username), UPDATE hanya baris sendiri. INSERT hanya lewat trigger.
- `progress`, `quiz_attempts`, `badges`: SELECT/INSERT/UPDATE hanya baris milik user login.
- `comments`: SELECT semua komentar dengan `hidden = false`, INSERT/DELETE hanya milik sendiri.

Cara membuktikan RLS benar-benar aktif (query `pg_tables` / `pg_policies`,
plus uji `set local role anon`): lihat `supabase/README.md`.

## Kode klien

`assets/js/supabase.js` adalah ESM module yang memuat
`@supabase/supabase-js` v2 dari CDN (`https://esm.sh/@supabase/supabase-js@2`) —
tidak ada npm atau build step. Muat `supabase-config.js` (script biasa)
**dulu**, lalu modul. Urutan ini sudah dipasang di `index.html`:

```html
<script src="assets/js/supabase-config.js"></script>
<script type="module" src="assets/js/main.js"></script>
```

`supabase-config.js` mengisi `window.__ENV__ = { SUPABASE_URL, SUPABASE_ANON_KEY }`
dan `supabase.js` membaca dari sana; nama lama `window.SUPABASE_URL` /
`window.SUPABASE_ANON_KEY` tetap didukung sebagai alias.

```js
import { supabase, getSession, signIn, signUp, signOut } from "./supabase.js";

await signUp("budi_01", "rahasia123");
await signIn("budi_01", "rahasia123");
const session = await getSession();
await signOut();
```
## Menjalankan secara lokal

Tidak perlu install apa pun — cukup serve folder ini sebagai static site.

**Opsi 1 — Python:**

```bash
python -m http.server 8000
```

Lalu buka <http://localhost:8000>.

**Opsi 2 — VS Code Live Server:**

Install ekstensi *Live Server*, klik kanan `index.html`, pilih **Open with Live Server**.

## Kontribusi materi

Materi ditulis langsung sebagai file HTML di folder `materi/` — cukup edit filenya, tidak ada panel admin.
