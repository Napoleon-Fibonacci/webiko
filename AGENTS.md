# Panduan kerja

Ringkas: **Webiko** — situs pembelajaran bikin website, Bahasa Indonesia.
Situs statis (HTML/CSS/JS vanilla, tanpa framework, tanpa build step, tanpa
dependency npm). Dibuat untuk pelajar SMP & SMA.

Berkas: `index.html` (beranda), `styleguide.html` (acuan design system),
`assets/css/style.css` (token + komponen), `assets/js/main.js` (menu navbar,
render kurikulum, tombol tema, gerak masuk layar), `data/kurikulum.js` (sumber
judul/tingkat/bab), `supabase/` (skema + policy), `scripts/verify-supabase.md`.
Backend Supabase belum dipakai di beranda. Detail lain di `README.md`.

Deploy: Vercel (`vercel.json`), domain `webiko.my.id`. Git: branch `main`,
remote `origin` (`Napoleon-Fibonacci/web-guide`).

## Aturan yang tidak boleh dilanggar

1. **Line ending CRLF.** Semua berkas repo pakai CRLF (`core.autocrlf=true`).
   Jangan pernah mengubahnya. Jangan pakai `sed -i`. Sesudah menulis berkas
   baru, pastikan CRLF. Verifikasi: `grep -qU $'\r' <berkas>` (harus cocok).
2. **Jangan sentuh `materi/`** — masih kosong, cuma ada `.gitkeep`.
3. Tombol **"Buat akun"** di kartu CTA memang `disabled` + badge "Segera".
   Jangan diaktifkan tanpa diminta.
4. `assets/js/supabase-config.js` masuk `.gitignore` — jangan di-commit.
   Jangan pernah menaruh `service_role` key atau DB password di frontend;
   anon key saja.
5. Tanpa JavaScript **tidak boleh ada isi tersembunyi**. Kelas `reveal-siap`
   hanya dipasang script kecil di `<head>`; tanpa JS halaman harus tetap utuh.
6. Gerak cuma pakai `transform` dan `opacity`, dan **mati total** saat
   `prefers-reduced-motion: reduce`. Tanpa library animasi.
7. Jangan refactor atau mengubah hal di luar yang diminta.

## Gaya & token

Gaya neo-brutalis: border tinta tebal, bayangan keras ber-offset (tanpa blur),
marker kuning. Selalu pakai token di `assets/css/style.css`, jangan angka/warna
mentah.

- Border: `--border-w` (3px), `--border-w-thin`; radius `--radius-sm/md/lg/pill`.
- Bayangan: `--shadow-hard-sm/--shadow-hard/--shadow-hard-hover/--shadow-hard-lg`.
- Spacing skala 4: `--space-1/2/3/4/6/8/12/16` (4..64px).
- Warna terang: `--color-ink` `#1a1b33`, `--color-primary` `#433fd4`,
  `--color-surface-raised` `#aab5f7`, `--color-secondary` `#b8befb`,
  `--color-surface-soft` `#d6d9fc`, `--color-marker-bg` `#ffe14d`.
- Warna gelap hidup di satu blok `:root[data-tema="gelap"]` — tidak ada salinan
  di media query.

Tema punya 3 keadaan; tombolnya di navbar. Kunci `localStorage` = `tema`,
nilai `sistem`/`terang`/`gelap`; **bawaan terang**. Atribut `data-tema` di
`<html>` diisi script `<head>` sebelum halaman digambar.

## Alur kerja (wajib)

1. **Tanya dulu: mau di-mock atau langsung diterapkan?** Setelah paham tugas,
   tanya singkat ke user. **Jangan otomatis mock, dan jangan mock terus-menerus
   tanpa diminta.** Tiap tugas boleh beda.
   - Pilih **mock**: tulis CSS/HTML percobaan di
     `C:\Users\Hype\AppData\Local\Temp\opencode`, suntik ke halaman asli (mis.
     lewat Chrome DevTools Protocol), lalu screenshot. Tunjukkan opsi + jalur
     screenshot, dan **tunggu persetujuan** sebelum mengedit berkas repo.
   - Pilih **langsung**: terapkan ke repo dulu, lalu verifikasi, lalu tunjukkan
     hasilnya ke user.
2. Setelah diterapkan (mock maupun langsung), verifikasi:
   - tinggi halaman + **nol overflow** di lebar 1440/1024/900/768/390/320;
   - tema **terang dan gelap**;
   - panel menu HP (dibuka) tetap benar;
   - CRLF utuh.
3. Commit kecil per perubahan, lalu `git push` **hanya kalau diminta**.
4. **Matikan semua proses uji begitu selesai** — server pratinjau, server mock,
   dan Chrome headless. Jangan biarkan menunggu putaran berikutnya; proses
   menganggur menguras baterai. Cek sebelum lanjut:
   `netstat -ano | grep -E ":8000|:8001|:9222" | grep LISTENING` harus kosong.
   **Jangan pernah `taskkill /IM chrome.exe` / `killall chrome`** — itu membunuh
   Chrome pribadi user juga. Matikan **hanya** proses uji: catat PID-nya saat
   diluncurkan (mis. `--user-data-dir` khusus temp + simpan PID), lalu
   `taskkill /PID <pid> /T /F`. Kalau PID tak terlacak, cari proses yang command
   line-nya memuat `--user-data-dir=<temp>` lalu bunuh itu saja. Server pratinjau
   juga: bunuh PID-nya, bukan semua `python.exe`.
5. **Bersihkan folder temp begitu tugas selesai.** Hapus semua berkas uji di
   `C:\Users\Hype\AppData\Local\Temp\opencode`: screenshot, skrip harness
   (`.mjs`), stub Supabase, salinan config, dan profil Chrome sementara.
   Jangan biarkan sisa uji menumpuk untuk putaran berikutnya. Setelah bersih,
   isi folder itu harus kosong kecuali user minta berkasnya disimpan. Cek:
   `ls -A "C:/Users/Hype/AppData/Local/Temp/opencode"` tidak mengeluarkan apa pun.

Pratinjau lokal: `python -m http.server 8000` lalu buka `http://localhost:8000`.

## Commit

Pesan konvensional + body berisi alasan dan perubahan. Contoh yang dipakai:

- `feat(beranda): ...`, `fix(navbar): ...`, `style(footer): ...`,
  `style(sidebar): ...`, `style(kartu): ...`.

## Bahasa

Balas singkat, Bahasa Indonesia. Pertahankan semua fakta teknis apa adanya:
path, perintah, nama API, angka, dan pesan error jangan diubah atau diringkas.
