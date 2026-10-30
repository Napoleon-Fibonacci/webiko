# Webiko

Website pembelajaran untuk anak sekolah yang ingin belajar membuat website dari dasar, ditulis dalam Bahasa Indonesia.

## Stack

- **Frontend:** HTML, CSS, dan JavaScript vanilla (tanpa framework, tanpa build step)
- **Backend:** [Supabase](https://supabase.com) (auth + database)
- **Deploy:** [Vercel](https://vercel.com)

## Struktur folder

```
.
├── index.html              # Halaman utama
├── styleguide.html         # Design system (acuan komponen & token)
├── vercel.json             # Konfigurasi deploy Vercel
├── assets/
│   ├── css/style.css       # Stylesheet utama (token + komponen)
│   ├── js/main.js          # Script utama (menu navbar, render kurikulum)
│   ├── js/supabase.js      # Klien Supabase (ESM)
│   ├── js/supabase-config.example.js  # Contoh config (salin jadi supabase-config.js)
│   └── img/                # Gambar
├── data/
│   └── kurikulum.js        # Jalur & bab materi (dirender oleh beranda)
├── materi/                 # Materi pelajaran (satu file HTML per bab)
├── scripts/
│   └── verify-supabase.md  # Panduan setup Supabase untuk pemula
└── supabase/               # SQL skema, policy RLS, dan lint
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

- Username dipetakan ke email sintetis: `username@webiko.local`.
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
**dulu**, baru modul yang memakainya. Halaman akun belum ada, jadi urutan ini
belum dipasang di halaman mana pun; tambahkan saat halaman akun dibuat:

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

`index.html` (beranda) belum butuh akun, jadi yang dipasang di sana dua script
biasa — data kurikulum lebih dulu, baru `main.js`:

```html
<script src="data/kurikulum.js"></script>
<script src="assets/js/main.js"></script>
```

`main.js` mengurus tombol menu navbar, merender daftar jalur materi dari
`data/kurikulum.js` ke elemen `[data-kurikulum]`, mengurus tombol tema, dan
mengatur gerak masuk layar elemen `[data-reveal]`.

## Tema

Tema punya tiga pilihan: ikut setelan sistem, selalu terang, selalu gelap.
Tombolnya di navbar, kanan atas. Aturannya:

- Atribut `data-tema` di `<html>` diisi script kecil di `<head>` **sebelum**
  halaman digambar, jadi tidak ada kedipan. Nilainya `"terang"` atau `"gelap"`.
- Pilihan pengguna disimpan di `localStorage` dengan kunci `tema`. **Tanpa
  simpanan, bawaannya terang** — jadi situs selalu terbuka cerah, tidak ikut
  setelan gelap sistem operasi. Pilihan "Sistem" juga disimpan (nilainya
  `"sistem"`), jadi ia berbeda dari pengguna baru yang belum memilih apa pun.
- Token tema gelap hidup di satu tempat: blok `:root[data-tema="gelap"]` di
  `assets/css/style.css`. Tidak ada salinan di dalam media query, jadi
  mengubah warna gelap cukup di satu blok itu.
- Di tema gelap penanda (logo navbar, nomor bab, nomor langkah) tetap kuning
  `#ffe14d`, sama persis dengan tema terang. Sisanya (`--color-accent`) versi
  redup `#f0d264`, karena di latar sedalam ini kuning mentah menyilaukan
  kalau dipakai di bidang yang lebar (tombol, badge).

### Palet

Keluarga violet-nya condong ke biru (indigo), hue 231-242 derajat — bukan
ungu kemerahan. Alasannya: di panel layar bermutu rendah (gamut sempit) ungu
kemerahan turun menjadi hampir hitam, sedangkan indigo tetap terbaca sebagai
ungu-biru. Semua pasangan teks tetap >= 4.5:1, angkanya ada di komentar tiap
token di `assets/css/style.css`.

Kuning `#ffe14d` (tema terang) sengaja dipertahankan: dengan latar indigo,
lawan warnanya makin kontras, jadi satu-satunya warna aksi tetap menonjol.

Tanpa JavaScript, atribut `data-tema` tidak pernah dipasang dan halaman
memakai tema terang.

## Gerak

Semua gerak cuma memakai `transform` dan `opacity`, jadi tidak ada tata letak
yang bergeser dan tidak ada library. Kontraknya:

- Token durasi dan easing ada di blok `/* --- Motion --- */` di
  `assets/css/style.css`: `--dur-fast`, `--dur-base`, `--dur-reveal`,
  `--stagger`, `--ease-out`.
- **Masuk layar.** Elemen bertanda `data-reveal` naik 14px sambil memudar saat
  masuk viewport, sekali saja. Pengaturnya IIFE terakhir di `assets/js/main.js`
  (satu `IntersectionObserver`, jeda bertahap 70ms per elemen).
- **Berulang.** Logo navbar bergoyang pelan (`@keyframes wg-rock`) dan hiasan di
  bawah kolom teks hero terapung naik-turun (`wg-deco-terapung` + `wg-deco-kedip`;
  hiasan ini hanya tampil di tata letak dua kolom, 1024px ke atas).
- **Menu mobile.** Tombol hamburger membuka panel melayang di bawah navbar:
  panelnya meluncur turun sambil memudar dan tiap tautan menyusul bertahap.
  Karena panel keluar dari aliran flex, tinggi navbar dan isi halaman di
  bawahnya tidak bergeser. Menutup pun ikut beranimasi (butuh
  `transition-behavior: allow-discrete`; browser lama cuma langsung hilang).
- **Hover.** Tombol terangkat dengan bayangan lebih panjang, tautan navbar naik
  1px, baris sidebar geser 2px, badge di dalamnya membesar.
- **Aman.** `prefers-reduced-motion: reduce` mematikan semua gerak. Kelas
  `reveal-siap` dipasang script di `<head>` halaman beranda hanya kalau
  `IntersectionObserver` ada, dan script yang sama melepasnya lagi setelah 2
  detik kalau `main.js` gagal jalan. Jadi tanpa JavaScript, atau saat `main.js`
  gagal dimuat, tidak ada isi halaman yang tetap tersembunyi.

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

Materi ditulis langsung sebagai file HTML di folder `materi/` — cukup edit filenya, tidak ada panel admin. Jalur dan daftar babnya diambil dari `data/kurikulum.js`; tiap bab punya `slug` yang dipakai untuk nama file dan untuk `bab_id` di tabel `progress`.

Beranda hanya menampilkan jalur dari file itu, jadi menambah bab tidak perlu menyentuh `index.html`. Judul dan tingkatnya punya satu sumber: `data/kurikulum.js`.
