# Lab latihan: catatan teknis

Dokumen ini menjelaskan cara kerja lab latihan di `materi/`, aturan tampilan
yang sudah disepakati, dan hal yang harus dicek sebelum mengubahnya.

## Tujuan

Lab latihan harus terasa seperti satu editor kecil yang konsisten:

- kanvas dan isi pratinjau sama-sama putih;
- teks mulai di titik yang sama di setiap bab;
- kotak hasil memanjang mengikuti isi, bukan menggulir di dalam kotak tetap;
- editor juga memanjang mengikuti jumlah baris kode;
- tanpa JavaScript, halaman tetap utuh dan contoh kode tetap terbaca.

## Berkas yang terlibat

| Berkas | Peran |
| --- | --- |
| `assets/js/latihan-html.js` | Menyalin editor ke iframe, mewarnai sintaks, mengukur tinggi editor dan pratinjau, tombol Jalankan/Reset, pemeriksaan struktur. |
| `assets/js/latihan-js.js` | Menjalankan kode JavaScript di Web Worker dan menampilkan `console.log`/error di panel Keluaran. |
| `assets/js/latihan-dom.js` | Menjalankan kode DOM di iframe ber-sandbox; `document` menunjuk dokumen pratinjau, perulangan dijaga penghitung. |
| `assets/js/lab-warna.js` | Kotak warna kecil di dalam editor CSS. Tanpa JavaScript tidak ada kotak. |
| `assets/css/style.css` | Token, panel lab, editor, pratinjau, dan batas tinggi minimum. |
| `materi/css/*.html` | Lab CSS: 11 bab, dari `mengenal-css` sampai `mode-gelap`. |
| `materi/html/*.html` | Lab HTML: `file-html-pertama`, `judul-dan-paragraf`, `gambar`, `tautan`, `daftar`, `tabel`, `halaman-lengkap`. |
| `materi/javascript/*.html` | Materi JavaScript: `apa-itu-javascript` (lab + kuis), `variabel`, `fungsi`, `percabangan`, `perulangan`, `array-objek`, `dom`, `klik-dan-form`. Lima bab lain belum dibuat. |

Bab konsep `apa-itu-website` dan `dari-server-ke-layar` memakai kuis pilihan
ganda, bukan lab kode. `mengenal-tag-html` memakai latihan "Bedah satu tag"
yang juga ditutup kuis pilihan ganda.

Kuis ditangani `assets/js/kuis-pilihan.js`. Tanpa JavaScript semua soal dan
pilihan tetap terlihat; `<noscript>` menampilkan kunci jawaban. Skor, jawaban
benar, dan tombol Ulangi baru muncul setelah siswa memeriksa jawaban.

Jalur CSS & tata letak kini punya 11 bab dan semuanya terbit. Bab 4-11 memakai
kerangka yang sama seperti bab 1-3: satu lab per bab, kode HTML utuh di dalam
`srcdoc`, `sandbox="allow-same-origin"`, serta `main.js` untuk menu HP dan
tombol tema.

## Aturan pratinjau

- Semua kanvas putih. Tidak ada blok lilac di dalam latihan.
- Layout awal seragam:

  ```css
  body {
    margin: 0;
    padding: 1rem;
    background-color: #ffffff;
    color: #1a1b33;
  }

  h1 {
    margin-top: 0;
  }
  ```

- Akibatnya teks pertama mulai di `x: 16`, `y: 16` pada semua lab.
- Lab HTML tidak memakai kolom `max-width` di tengah. Body langsung menjadi
  area latihan supaya posisi awal sama dengan lab CSS.
- Bab 2 tetap boleh mengubah latar `body` karena latihannya memang tentang
  warna dan latar.
- Bab 3 (`ukuran-dan-jarak`) mengatur jarak yang benar-benar terlihat di atas
  putih: padding `body`, margin bawah `h1`, dan margin bawah `p`.

## Lab JavaScript

Lab JavaScript memakai penanda `data-lab-js`, bukan `data-lab`, supaya
`latihan-html.js` tidak ikut memasang iframe pratinjau. Satu halaman hanya
memuat satu lab.

Kode siswa tidak dijalankan di halaman utama. `latihan-js.js` membuat Web
Worker dari Blob, lalu mengirim isi editor ke worker itu:

- kode tidak bisa menyentuh DOM atau `localStorage` halaman;
- `console.log`, `console.info`, `console.warn`, dan `console.error`
  diterjemahkan menjadi baris di panel Keluaran;
- error yang tidak tertangkap mengakhiri program dan ditandai merah;
- kode yang berjalan lebih dari 2 detik dihentikan, misalnya `while (true) {}`;
- `Ctrl+Enter` menjalankan kode, Tab menyisipkan dua spasi.

Karena dijalankan sebagai satu skrip, kode yang selesai lebih dulu tidak
menunggu `setTimeout` atau Promise. Materi yang membutuhkan penantian perlu
lab khusus, bukan lab ini.

## Lab DOM

Bab `dom` dan `klik-dan-form` memakai penanda `data-lab-dom` dan
`assets/js/latihan-dom.js`. Kode siswa butuh `document`, sedangkan Web Worker
tidak punya DOM. Karena itu kode dijalankan di iframe pratinjau, bukan di
halaman materi:

- iframe memakai `sandbox="allow-scripts"` tanpa `allow-same-origin`, jadi
  halaman materi tidak bisa menyentuh isinya dan sebaliknya;
- bab `klik-dan-form` menambahkan `allow-forms`. Tanpa itu, menekan tombol
  `type="submit"` tidak memicu pengiriman formulir, sehingga latihan
  `preventDefault` tidak bisa dicoba;
- `srcdoc` pratinjau sudah berisi contoh halaman kecil;
- iframe mengirim pesan `selesai`, `galat`, `macet`, dan `tinggi` lewat
  `postMessage` dengan kunci acak per percobaan;
- tinggi iframe mengikuti isi, sama seperti lab HTML.

Iframe yang terkunci `while (true)` tidak bisa dipulihkan dari luar: mengganti
`srcdoc` atau membuat iframe baru tetap menunggu proses yang sama. Karena itu
`beriPenjaga()` menyisipkan `__lanjut()` ke syarat `for` dan `while` sebelum
kode dijalankan. Setelah 1.000.000 putaran, kode berhenti dengan pesan
`Kode dihentikan karena berputar tanpa henti.` Timer 2 detik tetap ada sebagai
jaring pengaman, tetapi tidak boleh diandalkan untuk memulihkan pratinjau.

`for...of` dan `for...in` tidak dijaga karena mengulang data yang sudah ada.
Teks di dalam string dan komentar tidak ikut diubah.

## Tinggi otomatis

### Pratinjau

`aturTinggiPratinjau()` di `assets/js/latihan-html.js`:

1. membaca `documentElement.scrollHeight` dari iframe;
2. menyetel tinggi iframe ke angka itu;
3. dipanggil saat iframe `load`, saat tombol Jalankan, saat Reset, dan saat
   jendela berubah lebar.

Tinggi disetel ke `0px` lebih dulu supaya bisa menyusut, bukan hanya
memanjang. `min-height: 240px` di CSS tetap menjadi batas bawah.

Iframe memakai `sandbox="allow-same-origin"` supaya tinggi bisa dibaca.
Tanpa `allow-scripts`, script di dalam pratinjau tetap dilarang.

### Editor

`aturTinggi()` mengatur tinggi textarea:

```js
editor.style.height = 'auto';
editor.style.height = editor.scrollHeight + 'px';
```

Dipanggil setiap isi editor berubah (input, Tab, Enter, Reset), saat halaman
dimuat, dan saat `load` jendela selesai (font bisa selesai dimuat belakangan).

Penting: jangan memberi nama fungsi baru `aturTinggi` di lingkup yang sama.
Deklarasi fungsi kedua akan menimpa yang pertama dan editor kembali
terpotong. Fungsi pratinjau sudah dipisah menjadi `aturTinggiPratinjau`.

## Batasan

- Tanpa JavaScript, tinggi editor dan pratinjau tetap pada `min-height`.
  Pratinjau yang isinya lebih panjang bisa menggulir di dalam kotak. Ini
  konsekuensi pengukuran yang butuh script.
- Gerak hanya memakai `transform` dan `opacity`, dan mati saat
  `prefers-reduced-motion: reduce`.
- Jangan menaruh kunci `service_role` atau password database di frontend.

## Checklist verifikasi

Jalankan `python -m http.server 8000`, lalu periksa:

1. Semua lab pada tema terang dan gelap.
2. Lebar 1440, 1024, 900, 768, 390, dan 320: tidak ada overflow halaman.
3. Editor: `scrollHeight == clientHeight`.
4. Pratinjau: `scrollHeight == clientHeight`.
5. Posisi awal teks `x: 16`, `y: 16`.
6. Jalankan kode panjang: kotak memanjang. Reset: kotak menyusut.
7. Panel menu HP saat dibuka tetap benar.
8. Tanpa JavaScript: editor dan contoh kode tetap tampil.
9. Lab JavaScript: keluaran benar, error sintaks tampil, `while (true) {}`
   berhenti setelah 2 detik, dan Atur ulang mengembalikan kode awal.
10. Lab DOM: pratinjau berubah, error selector tampil, `while (true)` berhenti
    sendiri, dan Jalankan lagi tetap bekerja setelahnya.
11. Lab DOM formulir: klik tombol dan tombol Enter mengubah pesan; tanpa
    `preventDefault` pratinjau dimuat ulang, lalu Jalankan lagi memulihkannya.
12. Semua berkas tetap CRLF.

## Riwayat perubahan

| Commit | Perubahan |
| --- | --- |
| `28fd4d1` | Latar pratinjau disamakan menjadi putih. |
| `ab1889b` | Pratinjau bab ukuran disamakan dengan bab warna. |
| `01a9a0e` | Kartu lilac dipakai di semua pratinjau. |
| `164a1c2` | Cek pemahaman ditambahkan di bab konsep HTML. |
| `5b2b27a` | Semua pratinjau dibuat putih penuh; latihan bab ukuran diubah agar jarak terlihat. |
| `a1b6ad4` | Posisi awal teks disamakan; tinggi pratinjau mengikuti isi. |
| `7a4564c` | Tabrakan nama `aturTinggi` diperbaiki; editor tidak lagi terpotong. |
