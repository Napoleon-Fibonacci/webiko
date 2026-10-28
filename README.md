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
│   └── img/            # Gambar
├── data/
│   └── kurikulum.js    # Daftar kurikulum materi
└── materi/             # Materi pelajaran
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
