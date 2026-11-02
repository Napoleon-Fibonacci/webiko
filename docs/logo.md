# Logo Webiko

Dokumen ini mencatat keputusan logo, bentuk akhirnya, dan cara mengubahnya
tanpa merusak tampilan.

## Keputusan

Empat arah sempat dimock di halaman percobaan:

1. **Orbit** — atom dengan satu elips miring. Versi lama.
2. **Huruf W** — monogram tebal. **Dipilih** karena paling terbaca di ukuran
   favicon 16px.
3. **Jendela browser** — kotak halaman dengan tiga titik di title bar.
4. **Tag kurung** — tanda `</>`.

Alasan memilih W: mark navbar hanya 40px dan favicon bisa sampai 16px. Detail
orbit hilang di ukuran itu, sedangkan tiga garis W tetap terbaca. Bentuknya
juga tidak bergantung pada teks "Webiko" di sebelahnya.

## Mark navbar

Semua 37 halaman memakai SVG inline yang sama di dalam `.navbar__mark`:

```html
<span class="navbar__mark" aria-hidden="true">
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 7l3.6 10L12 9.4 16.4 17 20 7"></path>
  </svg>
</span>
```

- Kotak tetap diatur `.navbar__mark` di `assets/css/style.css`: 40x40px,
  border `var(--border-w)`, radius `var(--radius-md)`, latar
  `var(--color-marker-bg)` (kuning `#ffe14d`), bayangan
  `var(--shadow-hard-sm)`.
- W memakai `currentColor`, jadi warnanya ikut `--color-on-accent`
  (`#1f1a33`) di tema terang maupun gelap. Border kotak ikut
  `--color-border` (tinta di terang, lilac di gelap).
- Animasi kotak tidak berubah: `wg-rock` di layar kecil, dimatikan dan diganti
  rotasi -3 derajat mulai breakpoint 1200px.
- `aria-hidden="true"` dipertahankan karena teks "Webiko" sudah menjadi nama
  tautan. Jangan hapus atribut itu.

## Favicon

`favicon.svg` di akar repo, 384 byte, tanpa dependency:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" role="img" aria-label="Webiko">
  <rect x="0.9" y="0.9" width="22.2" height="22.2" rx="4.6" fill="#ffe14d" stroke="#1a1b33" stroke-width="1.8"/>
  <path d="M5.6 8l3 8.2 3.4-6.2 3.4 6.2L18.4 8" fill="none" stroke="#1a1b33" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

Warna ditulis sebagai hex, bukan token CSS, karena favicon dirender di luar
halaman dan tidak mewarisi `:root`.

Tautan di `<head>` memakai path relatif supaya tetap jalan saat dibuka lewat
`file://`:

| Lokasi halaman | Tag |
| --- | --- |
| Akar (`index.html`, `akun.html`, `styleguide.html`) | `<link rel="icon" href="favicon.svg" type="image/svg+xml">` |
| `materi/<jalur>/<bab>.html` | `<link rel="icon" href="../../favicon.svg" type="image/svg+xml">` |

## Berkas yang berubah

- `index.html`, `akun.html`, `styleguide.html`, dan 34 halaman di `materi/`:
  SVG mark diganti, satu baris `<link rel="icon">` ditambahkan.
- `favicon.svg`: berkas baru.
- `assets/css/style.css`: **tidak diubah**. Ukuran kotak, warna, bayangan, dan
  animasi mark tetap memakai token yang sudah ada.

## Hasil verifikasi

Diukur lewat Chrome headless pada `http://127.0.0.1:8000`, tema terang:

| Lebar | Overflow horizontal | Tinggi halaman |
| --- | --- | --- |
| 1440 | 0 | 2656 |
| 1024 | 0 | 2679 |
| 900 | 0 | 3182 |
| 768 | 0 | 3269 |
| 390 | 0 | 4185 |
| 320 | 0 | 4528 |

Pemeriksaan lain:

- Tema gelap di 1440 dan 390: overflow 0, mark tetap tampil.
- Menu HP di 390 dibuka: `data-open` terpasang, panel 267px, kiri 0, kanan 390,
  overflow 0.
- Halaman `materi/html/daftar.html` di 390: overflow 0, ikon memakai
  `../../favicon.svg`.
- `GET /favicon.svg` menghasilkan `200 image/svg+xml`, 384 byte.
- Semua 37 berkas HTML + `favicon.svg` lolos cek CRLF (tidak ada `\n` tanpa
  `\r`).

## Cara mengubah

- **Bentuk W**: ganti atribut `d` pada `<path>` di kedua tempat (mark navbar
  dan `favicon.svg`). Jaga agar `stroke` tetap `currentColor` untuk mark dan
  hex untuk favicon.
- **Ukuran kotak**: ubah `.navbar__mark` di `assets/css/style.css`, jangan
  menambah `style` inline di tiap halaman.
- **Warna**: pakai token `--color-marker-bg`, `--color-border`, dan
  `--color-on-accent`. Untuk favicon, samakan hex-nya secara manual.
- Sesudah mengubah, ulangi tabel verifikasi di atas. Jangan lupa cek CRLF.
