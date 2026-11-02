# Dokumentasi Webiko

Kumpulan catatan teknis untuk situs Webiko: keputusan desain, perubahan yang
sudah masuk, dan cara memeriksanya. Semua dokumen ditulis untuk dibaca ulang
oleh manusia, bukan generated docs.

## Daftar dokumen

| Berkas | Isi |
| --- | --- |
| [`lab-latihan.md`](lab-latihan.md) | Cara kerja lab editor + pratinjau di `materi/`, aturan tampilan, dan hal yang harus dicek sebelum mengubahnya. |
| [`logo.md`](logo.md) | Logo Webiko: alasan memilih monogram W, spesifikasi mark navbar dan favicon, berkas yang disentuh, dan hasil verifikasi. |
| [`perubahan-terbaru.md`](perubahan-terbaru.md) | Riwayat perubahan terakhir (kuis, jalur JavaScript, kartu jalur, akun, navbar, CTA, logo) beserta commit-nya. |

## Aturan yang berlaku di semua dokumen

- Repo ini memakai **CRLF**. Setiap berkas baru, termasuk dokumen ini, harus
  berakhir CRLF. Cek dengan `grep -qU $'\r' <berkas>`; hasilnya harus cocok.
- Tanpa framework, tanpa build step, tanpa dependency npm. Jangan menambah
  alat baru hanya untuk dokumentasi.
- Angka, path, perintah, dan nama token ditulis apa adanya. Kalau berubah,
  perbarui dokumen di commit yang sama.
- Verifikasi tampilan dilakukan di lebar 1440/1024/900/768/390/320, tema
  terang dan gelap, plus panel menu HP dalam keadaan terbuka.

## Menjalankan situs untuk pengecekan

```bash
python -m http.server 8000
```

Lalu buka <http://localhost:8000>. Matikan server setelah selesai.
