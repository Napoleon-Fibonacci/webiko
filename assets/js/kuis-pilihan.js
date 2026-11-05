/* Kuis pilihan ganda di halaman materi.
   Tanpa JavaScript tidak ada yang disembunyikan: semua soal dan pilihan
   tetap terlihat, dan <noscript> menampilkan kunci jawaban.

   Untuk pengguna yang sudah masuk, skor disimpan ke tabel
   quiz_attempts sekali saja. Sesudah tersimpan, jawaban dikunci dan
   tombol "Ulangi" tidak muncul lagi — poin permanen. */
(function () {
  'use strict';

  var daftarKuis = document.querySelectorAll('[data-kuis]');
  if (!daftarKuis.length) return;

  function bacaIdBab() {
    var bagian = window.location.pathname.split('/').filter(Boolean);
    var posisi = bagian.indexOf('materi');
    if (posisi === -1 || bagian.length < posisi + 3) return '';
    var jalur = bagian[posisi + 1];
    var bab = bagian[posisi + 2].replace(/\.html$/, '');
    if (!jalur || !bab) return '';
    return jalur + '/' + bab;
  }

  var idBab = bacaIdBab();

  var sesiAktif = null;
  var janjiModul = null;

  /* supabase-config.js dimuat SETELAH file ini (lihat urutan script di
     halaman materi), jadi konfigurasi baru boleh dibaca saat modul
     benar-benar dibutuhkan — bukan saat file ini dievaluasi. */
  function modulSiap() {
    if (janjiModul) return janjiModul;

    var env = window.__ENV__ || {};
    var url = String(env.SUPABASE_URL || '');
    var kunciApi = String(env.SUPABASE_ANON_KEY || '');
    var adaConfig =
      url.indexOf('http') === 0 &&
      kunciApi.length > 20 &&
      kunciApi.indexOf('GANTI') === -1 &&
      url.indexOf('GANTI') === -1;

    janjiModul = adaConfig
      ? import('./supabase.js')
          .then(function (modul) {
            return modul.getSession().then(function (sesi) {
              if (!sesi) return null;
              sesiAktif = sesi;
              return modul;
            });
          })
          .catch(function () {
            return null;
          })
      : Promise.resolve(null);

    return janjiModul;
  }

  Array.prototype.forEach.call(daftarKuis, function (form) {
    var soal = form.querySelectorAll('[data-kuis-soal]');
    var skor = form.querySelector('[data-kuis-skor]');
    var tombolUlangi = form.querySelector('[data-kuis-ulangi]');
    var tombolPeriksa = form.querySelector('[data-kuis-periksa]');

    function catatan(teks) {
      var baris = form.querySelector('[data-kuis-catatan]');
      if (!teks) {
        if (baris) baris.remove();
        return;
      }
      if (!baris) {
        baris = document.createElement('p');
        baris.className = 'kuis__catatan';
        baris.setAttribute('data-kuis-catatan', '');
        skor.after(baris);
      }
      baris.textContent = teks;
    }

    function kunciJawaban(pesan) {
      Array.prototype.forEach.call(form.querySelectorAll('input'), function (input) {
        input.disabled = true;
      });
      tombolPeriksa.hidden = true;
      tombolUlangi.hidden = true;
      form.setAttribute('data-sudah', '1');
      if (pesan) catatan(pesan);
    }

    function bukaKunci() {
      Array.prototype.forEach.call(form.querySelectorAll('input'), function (input) {
        input.disabled = false;
      });
      tombolUlangi.hidden = false;
      catatan('');
    }

    function pakaiTersimpan(baris) {
      skor.textContent = 'Skor ' + baris.skor + ' dari ' + baris.total + '.';
      skor.classList.remove('kuis__skor--benar', 'kuis__skor--salah');
      skor.classList.add(
        Number(baris.skor) === Number(baris.total)
          ? 'kuis__skor--benar'
          : 'kuis__skor--salah'
      );
      kunciJawaban('Kuis hanya bisa dikerjakan sekali. Poin permanen.');
    }

    function bersihkan() {
      Array.prototype.forEach.call(soal, function (butir) {
        butir.classList.remove('kuis__soal--benar', 'kuis__soal--salah');
        var balikan = butir.querySelector('[data-kuis-balikan]');
        balikan.hidden = true;
        balikan.textContent = '';
        balikan.classList.remove('kuis__balikan--benar', 'kuis__balikan--salah');
      });
      skor.textContent = '';
      skor.classList.remove('kuis__skor--benar', 'kuis__skor--salah');
      tombolUlangi.hidden = true;
      catatan('');
      form.removeAttribute('data-sudah');
    }

    function simpanNilai(benar, total) {
      if (!idBab) {
        tombolUlangi.hidden = false;
        return;
      }

      kunciJawaban('Menyimpan skor…');

      modulSiap().then(function (modul) {
        if (!modul || !sesiAktif) {
          /* Tamu / backend belum siap: kuis tetap bisa diulang karena
             tidak ada poin yang benar-benar tersimpan. */
          bukaKunci();
          catatan('Masuk ke akun untuk menyimpan skor permanen.');
          return;
        }

        modul.supabase
          .from('quiz_attempts')
          .insert({
            user_id: sesiAktif.user.id,
            bab_id: idBab,
            skor: benar,
            total: total,
          })
          .then(function (hasil) {
            if (hasil.error && hasil.error.code === '23505') {
              /* Sudah pernah dikerjakan: tampilkan skor pertama. */
              return modul.supabase
                .from('quiz_attempts')
                .select('skor, total')
                .eq('bab_id', idBab)
                .maybeSingle()
                .then(function (lama) {
                  if (lama.data) pakaiTersimpan(lama.data);
                });
            }
            if (hasil.error) throw hasil.error;
            catatan('Kuis hanya bisa dikerjakan sekali. Poin permanen.');
          })
          .catch(function () {
            bukaKunci();
            catatan('Skor belum tersimpan. Periksa koneksi, lalu periksa lagi.');
          });
      });
    }

    function periksa() {
      var kosong = [];
      Array.prototype.forEach.call(soal, function (butir) {
        if (!butir.querySelector('input:checked')) kosong.push(butir);
      });

      if (kosong.length) {
        skor.textContent = 'Jawab semua soal dulu.';
        skor.classList.remove('kuis__skor--benar');
        skor.classList.add('kuis__skor--salah');
        var radio = kosong[0].querySelector('input');
        if (radio) radio.focus();
        return;
      }

      var benar = 0;
      Array.prototype.forEach.call(soal, function (butir) {
        var dipilih = butir.querySelector('input:checked');
        var kunci = butir.getAttribute('data-jawaban');
        var tepat = dipilih.value === kunci;
        var balikan = butir.querySelector('[data-kuis-balikan]');

        butir.classList.add(tepat ? 'kuis__soal--benar' : 'kuis__soal--salah');
        balikan.hidden = false;
        balikan.textContent = (tepat ? 'Benar. ' : 'Belum tepat. Jawaban benar: ' + kunci.toUpperCase() + '. ') +
          butir.getAttribute('data-penjelasan');
        balikan.classList.add(tepat ? 'kuis__balikan--benar' : 'kuis__balikan--salah');
        if (tepat) benar++;
      });

      skor.textContent = 'Skor ' + benar + ' dari ' + soal.length + '.';
      skor.classList.remove('kuis__skor--benar', 'kuis__skor--salah');
      skor.classList.add(benar === soal.length ? 'kuis__skor--benar' : 'kuis__skor--salah');
      tombolUlangi.hidden = false;
      form.setAttribute('data-sudah', '1');

      simpanNilai(benar, soal.length);
    }

    /* Tombol disembunyikan di HTML supaya tanpa JavaScript tidak ada
       tombol yang bisa diklik tetapi tidak bereaksi. */
    if (tombolPeriksa) {
      tombolPeriksa.hidden = false;
      tombolPeriksa.addEventListener('click', periksa);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      periksa();
    });

    /* Jawaban diubah setelah diperiksa: sembunyikan hasil lama supaya
       skor tidak menyesatkan. */
    form.addEventListener('change', function () {
      if (form.hasAttribute('data-sudah')) bersihkan();
    });

    tombolUlangi.addEventListener('click', function () {
      form.reset();
      bersihkan();
      var radio = soal[0].querySelector('input');
      if (radio) radio.focus();
    });

    /* Skor yang sudah tersimpan permanen dipasang saat halaman dibuka.
       Ditunda sampai DOM siap supaya supabase-config.js sudah termuat. */
    function muatTersimpan() {
      if (!idBab) return;
      modulSiap().then(function (modul) {
        if (!modul) return;
        modul.supabase
          .from('quiz_attempts')
          .select('skor, total')
          .eq('bab_id', idBab)
          .maybeSingle()
          .then(function (hasil) {
            if (hasil.data) pakaiTersimpan(hasil.data);
          })
          .catch(function () {});
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', muatTersimpan, { once: true });
    } else {
      muatTersimpan();
    }
  });
})();
