# SEO dan kartu sosial

Dokumen ini menjelaskan metadata yang dipasang di setiap halaman, aturan URL,
gambar pratinjau, dan cara memeriksa hasilnya setelah deploy.

## Ringkasan

Setiap dari 37 halaman punya:

- `link rel="canonical"`;
- Open Graph: `og:type`, `og:site_name`, `og:locale`, `og:title`,
  `og:description`, `og:url`, `og:image`, `og:image:type`,
  `og:image:width`, `og:image:height`, `og:image:alt`;
- Twitter Card: `twitter:card`, `twitter:title`, `twitter:description`,
  `twitter:image`, `twitter:image:alt`.

Semua tag ditulis statis di `<head>`, bukan lewat JavaScript. Crawler
WhatsApp, Facebook, Telegram, Discord, LinkedIn, dan X tidak menjalankan
JavaScript untuk membaca kartu, jadi ini syarat utamanya.

## Contoh hasil

Di `akun.html`:

```html
<link rel="canonical" href="https://www.webiko.my.id/akun">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Webiko">
<meta property="og:locale" content="id_ID">
<meta property="og:title" content="Akun — Webiko">
<meta property="og:description" content="Masuk atau buat akun Webiko dengan username dan password. Tanpa email, tanpa data pribadi. Progres bab, skor kuis, dan badge tersimpan di akunmu.">
<meta property="og:url" content="https://www.webiko.my.id/akun">
<meta property="og:image" content="https://www.webiko.my.id/assets/img/og-webiko.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Kartu Webiko: kotak kuning bergambar huruf W, tulisan Bikin website pertamamu, baris demi baris, dan panel kode index.html.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Akun — Webiko">
<meta name="twitter:description" content="Masuk atau buat akun Webiko dengan username dan password. Tanpa email, tanpa data pribadi. Progres bab, skor kuis, dan badge tersimpan di akunmu.">
<meta name="twitter:image" content="https://www.webiko.my.id/assets/img/og-webiko.png">
<meta name="twitter:image:alt" content="Kartu Webiko: kotak kuning bergambar huruf W, tulisan Bikin website pertamamu, baris demi baris, dan panel kode index.html.">
```

Judul dan deskripsi diambil dari `<title>` dan
`<meta name="description">` halaman itu sendiri, jadi tiap bab punya kartu
berbeda tanpa gambar terpisah.

## Aturan URL

`vercel.json` memakai `"cleanUrls": true` dan `"trailingSlash": false`. Karena
itu canonical dan `og:url` memakai bentuk tanpa `.html`:

| Berkas | URL kanonis |
| --- | --- |
| `index.html` | `https://www.webiko.my.id/` |
| `akun.html` | `https://www.webiko.my.id/akun` |
| `styleguide.html` | `https://www.webiko.my.id/styleguide` |
| `materi/html/daftar.html` | `https://www.webiko.my.id/materi/html/daftar` |

Host kanonis adalah `www.webiko.my.id`, sesuai domain utama di Vercel. Alamat
apex `https://webiko.my.id/...` membalas `308` ke `https://www.webiko.my.id/...`,
jadi canonical, `og:url`, `og:image`, sitemap, dan robots semuanya memakai
`www` supaya crawler tidak perlu melewati pengalihan. Bagikan tautan `www`
langsung.

Bagikan URL bentuk bersih. Kalau yang dibagikan masih `.html`, Vercel
mengalihkan ke bentuk bersih; sebagian crawler mengikuti pengalihan, sebagian
membaca versi pertama. Menghindari pengalihan lebih aman.

## Gambar OG

- Berkas: `assets/img/og-webiko.png`
- Ukuran: 1200x630 piksel, PNG, 85.600 byte (sekitar 84 KB).
- Alasan: rasio 1,91:1 dipakai Facebook, WhatsApp, LinkedIn, X, Telegram, dan
  Discord. Ukuran di bawah 300 KB supaya WhatsApp tidak menolak atau
  mengompres berlebihan.
- URL di tag **wajib absolut**:
  `https://www.webiko.my.id/assets/img/og-webiko.png`. Path relatif membuat
  WhatsApp dan Facebook tidak menampilkan gambar.
- Isi: kotak kuning bergambar W, kata "WEBiko", headline "Bikin website
  pertamamu, baris demi baris." dengan marker kuning, panel kode `index.html`,
  dan kartu hasil "Halo, dunia!".
- Alt: "Kartu Webiko: kotak kuning bergambar huruf W, tulisan Bikin website
  pertamamu, baris demi baris, dan panel kode index.html."

Mengganti gambar: timpa berkas dengan PNG 1200x630, jaga ukuran di bawah
300 KB, lalu perbarui `og:image:alt` di 37 halaman kalau isinya berubah.

## robots.txt

```text
User-agent: *
Allow: /

Sitemap: https://www.webiko.my.id/sitemap.xml
```

Tidak ada halaman yang dilarang. `akun` tetap boleh dirayapi; isinya bukan
data pribadi, hanya formulir.

## sitemap.xml

Berisi 37 URL bersih, beranda di urutan pertama. Tidak memakai `lastmod`,
`changefreq`, atau `priority` karena tanggal dan bobotnya tidak bisa
dipertanggungjawabkan; Google mengabaikan sebagian besar nilai itu. Kalau
menambah bab baru, tambahkan satu `<url>` di sini.

## JSON-LD

Hanya di beranda, satu blok `application/ld+json`:

- `WebSite` — nama, URL, deskripsi, `inLanguage: id-ID`;
- `EducationalOrganization` — nama, URL, logo.

Tidak ada `SearchAction` karena situs belum punya pencarian. Jangan menambah
schema yang tidak didukung isi halaman.

## Hasil verifikasi

Pemeriksaan otomatis pada 37 halaman:

- canonical dan `og:url` cocok dengan URL bersih tiap berkas;
- tepat satu `og:title`, `og:description`, `og:image`, `twitter:card`, dan
  `twitter:image` per halaman;
- `og:image` selalu absolut dan menunjuk `assets/img/og-webiko.png`;
- lebar/tinggi gambar 1200x630, berkas 85.600 byte;
- JSON-LD valid dan hanya ada di beranda;
- sitemap berisi 37 URL, tanpa duplikat, sama persis dengan canonical;
- `robots.txt` mengizinkan crawl dan menyebut sitemap;
- semua HTML, `robots.txt`, dan `sitemap.xml` tetap CRLF.

Pemeriksaan tampilan: overflow horizontal 0 di 1440/1024/900/768/390/320,
tema terang dan gelap, menu HP di 390 terbuka tanpa menggeser isi. Aset lokal
`/assets/img/og-webiko.png`, `/robots.txt`, dan `/sitemap.xml` menjawab 200.

## Setelah deploy

Cache kartu sosial tidak langsung berubah. Setelah `git push` dan deploy:

1. **Facebook / WhatsApp** — buka
   <https://developers.facebook.com/tools/debug/> , tempel URL, klik
   **Scrape Again**. WhatsApp ikut cache Facebook.
2. **LinkedIn** — <https://www.linkedin.com/post-inspector/> , tempel URL.
3. **Telegram** — kirim URL ke `@WebpageBot`, atau kirim ulang ke chat.
4. **Discord** — kirim ulang URL; embed lama tidak diperbarui otomatis.
5. **X** — validator kartu resmi sudah dihapus. Uji dengan mengetik URL di
   composer dan lihat pratinjaunya sebelum mengirim.
6. **WhatsApp uji cepat** — tambahkan `?v=2` di belakang URL untuk memaksa
   crawler mengambil versi baru.

Kalau gambar tidak muncul di salah satu platform, cek tiga hal: URL gambar
absolut dan bisa dibuka tanpa login, gambar PNG/JPG (bukan SVG/WebP), dan
ukurannya di bawah 300 KB.

## Menambah atau mengubah halaman

Metadata ditulis statis, bukan dibuat saat build. Saat menambah halaman:

1. Salin blok 17 baris di atas.
2. Ganti `canonical` dan `og:url` dengan URL bersih halaman baru.
3. Samakan `og:title`/`twitter:title` dengan `<title>`, dan
   `og:description`/`twitter:description` dengan `<meta name="description">`.
4. Tambahkan `<url>` baru ke `sitemap.xml`.
5. Cek CRLF: `grep -qU $'\r' <berkas>` harus cocok.
