/* ============================================================
   Web Guide — data/kurikulum.js
   Daftar kurikulum materi pembelajaran.

   Dimuat sebagai script biasa lewat <script> di index.html, jadi
   KURIKULUM bisa dibaca script lain yang dimuat setelahnya
   (lihat assets/js/main.js).

   Bentuk tiap jalur:
     {
       slug, judul, ringkas,
       tingkat: "Pemula" | "Pemula+" | "Lanjutan",
       status: "segera" | "terbit",
       bab: [{ slug, judul }]
     }

   Jumlah bab ditampilkan dari panjang array `bab`, bukan ditulis
   ulang di teks — jadi tidak perlu disamakan manual.
   ============================================================ */

const KURIKULUM = [
  {
    slug: "html",
    judul: "HTML dari nol",
    ringkas:
      "Kenali tag, teks, gambar, dan tautan. Delapan bab menuju halaman pertamamu.",
    tingkat: "Pemula",
    status: "segera",
    bab: [
      { slug: "apa-itu-website", judul: "Apa itu website" },
      { slug: "file-html-pertama", judul: "File HTML pertamamu" },
      { slug: "judul-dan-paragraf", judul: "Judul dan paragraf" },
      { slug: "tautan", judul: "Tautan antar halaman" },
      { slug: "gambar", judul: "Menampilkan gambar" },
      { slug: "daftar", judul: "Daftar berurutan dan tidak" },
      { slug: "tabel", judul: "Tabel sederhana" },
      { slug: "halaman-lengkap", judul: "Merangkai halaman lengkap" },
    ],
  },
  {
    slug: "css",
    judul: "CSS & tata letak",
    ringkas:
      "Warna, jarak, dan grid. Sepuluh bab untuk membuat tampilan rapi di HP maupun laptop.",
    tingkat: "Pemula+",
    status: "segera",
    bab: [
      { slug: "warna-dan-latar", judul: "Warna dan latar" },
      { slug: "ukuran-dan-jarak", judul: "Ukuran dan jarak" },
      { slug: "font-dan-baris", judul: "Font dan tinggi baris" },
      { slug: "selector-kelas", judul: "Selector dan kelas" },
      { slug: "kotak", judul: "Kotak: margin, border, padding" },
      { slug: "flexbox", judul: "Menata dengan flexbox" },
      { slug: "grid", judul: "Menyusun grid" },
      { slug: "tombol-dan-kartu", judul: "Tombol dan kartu" },
      { slug: "tampilan-di-hp", judul: "Tampilan di layar HP" },
      { slug: "mode-gelap", judul: "Mode gelap" },
    ],
  },
  {
    slug: "javascript",
    judul: "JavaScript dasar",
    ringkas:
      "Bikin halaman yang merespons klik dan isian. Dua belas bab, dari variabel sampai ambil data.",
    tingkat: "Lanjutan",
    status: "segera",
    bab: [
      { slug: "variabel", judul: "Variabel dan tipe data" },
      { slug: "fungsi", judul: "Fungsi" },
      { slug: "percabangan", judul: "Percabangan if" },
      { slug: "perulangan", judul: "Perulangan" },
      { slug: "array-objek", judul: "Array dan objek" },
      { slug: "dom", judul: "Mengubah halaman dari kode" },
      { slug: "klik-dan-form", judul: "Klik dan isian formulir" },
      { slug: "penyimpanan", judul: "Menyimpan data di browser" },
      { slug: "ambil-data", judul: "Mengambil data dari server" },
      { slug: "daftar-dari-data", judul: "Membuat daftar dari data" },
      { slug: "pesan-error", judul: "Membaca pesan error" },
      { slug: "latihan-pencatat", judul: "Latihan: pencatat belajar" },
    ],
  },
];
