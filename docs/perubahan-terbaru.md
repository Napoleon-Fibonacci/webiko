# Perubahan terbaru

Catatan perubahan yang sudah masuk ke repo, urut dari lama ke baru. Semua
commit ada di branch `main`. Angka dan path diambil dari isi repo saat
dokumen ini ditulis.

## Ringkasan commit

| Commit | Area | Isi |
| --- | --- | --- |
| `32b80de` | Kuis | Kuis pilihan ganda di bab CSS dan JavaScript. 27 halaman materi memuat `assets/js/kuis-pilihan.js`. Tanpa JavaScript semua soal dan pilihan tetap terlihat; `<noscript>` menampilkan kunci jawaban. Skor dan tombol Ulangi baru muncul setelah jawaban diperiksa. |
| `0b47efe` | Kurikulum | Jalur JavaScript dibuka di beranda. Kartu jalur memakai `tautan` dari `data/kurikulum.js`, jadi bisa diklik menuju `materi/javascript/apa-itu-javascript.html`. |
| `08d57c8` | Kartu | Warna kartu jalur mengikuti brand: HTML, CSS, dan JavaScript. Warna diatur lewat atribut `data-jalur`, bukan urutan kartu. |
| `b257891` | Akun | Halaman `akun.html` + `assets/js/akun.js`: masuk, daftar dengan username + password, sesi, dan keluar. Supabase tetap opsional; `supabase-config.js` tidak di-commit. |
| `fb1b9bc` | Navigasi | Tautan **Akun** ditambahkan di navbar semua halaman, setelah "Cara pakai". Di footer, tautan "Buat akun" diganti **Akun** supaya tetap 4 tautan dan tidak ada dua tautan bertujuan sama. 36 berkas diubah; `akun.html` sudah punya tautan itu. |
| `35a296a` | Beranda | Tombol ketiga `btn btn--ghost` "Buat akun" di hero, selalu tampil dan boleh wrap di layar sempit. Kartu CTA "Buat akun" yang `disabled` + badge "Segera" tidak diubah. |
| `96f3f78` | Logo | Mark orbit diganti monogram W di 37 halaman, plus `favicon.svg` di akar. Detail di [`logo.md`](logo.md). |
| `87d8fca` | SEO | Canonical, Open Graph, dan Twitter Card di 37 halaman. Gambar OG 1200x630 di `assets/img/og-webiko.png`, `robots.txt`, `sitemap.xml` berisi 37 URL bersih, dan JSON-LD di beranda. Detail di [`seo.md`](seo.md). |
| `66dfaa3` | SEO | Host kanonis disamakan ke `https://www.webiko.my.id` karena apex membalas `308` ke www. Canonical, `og:url`, gambar, JSON-LD, sitemap, dan robots ikut diperbarui. |

## SEO dan kartu sosial

Tag sosial ditulis statis di `<head>` 37 halaman. Canonical dan `og:url`
memakai URL bersih tanpa `.html` sesuai `cleanUrls` di `vercel.json`. Gambar
`assets/img/og-webiko.png` 1200x630 (85.600 byte) dipakai semua halaman;
`robots.txt` dan `sitemap.xml` berisi 37 URL. Detail dan langkah setelah deploy
ada di [`seo.md`](seo.md).

## Gerak masuk layar (fade-in)

Fade-in kartu kurikulum ternyata **sudah ada** sebelum permintaan terakhir, jadi
tidak ada commit baru untuk itu. Yang berjalan sekarang:

- `assets/js/main.js` menandai tiap `<li>` kartu dengan `data-reveal`.
- `assets/css/style.css` memakai `@keyframes wg-reveal`: opacity 0 ke 1 dan
  `translateY(14px)` ke `none`.
- Durasi `--dur-reveal: 520ms`, jeda antar elemen `--stagger: 70ms`, easing
  `--ease-out`.
- Satu `IntersectionObserver` memicu sekali saat elemen masuk viewport.
- `prefers-reduced-motion: reduce` mematikan gerak.
- Tanpa JavaScript tidak ada isi tersembunyi: kelas `reveal-siap` hanya
  dipasang kalau `IntersectionObserver` ada, dan dilepas lagi setelah 2 detik
  kalau `main.js` gagal jalan.

Kalau suatu saat ingin lebih lambat, ubah dua token di
`assets/css/style.css` (`--dur-reveal`, `--stagger`), bukan menambah animasi
baru.

## Verifikasi yang dipakai

- Lebar 1440/1024/900/768/390/320: tinggi halaman wajar, overflow horizontal 0.
- Tema terang dan gelap.
- Panel menu HP dibuka: `data-open` terpasang, panel menutup lebar layar, tidak
  menggeser isi halaman.
- CRLF: `grep -qU $'\r' <berkas>` harus cocok untuk setiap berkas yang diubah.
- Proses uji dimatikan setelah selesai:
  `netstat -ano | grep -E ":8000|:8001|:9222" | grep LISTENING` harus kosong.

## Konteks repo

- 37 halaman HTML: 3 di akar (`index.html`, `akun.html`, `styleguide.html`) dan
  34 di `materi/` (10 HTML, 11 CSS, 13 JavaScript).
- Tanpa build step dan tanpa dependency npm. Perubahan cukup di berkas statis.
- Backend Supabase belum dipakai di beranda. Halaman akun memakai klien
  `assets/js/supabase.js` dan config lokal yang di-.gitignore.
