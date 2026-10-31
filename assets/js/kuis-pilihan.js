/* Kuis pilihan ganda di halaman materi.
   Tanpa JavaScript tidak ada yang disembunyikan: semua soal dan pilihan
   tetap terlihat, dan <noscript> menampilkan kunci jawaban. */
(function () {
  'use strict';

  var daftarKuis = document.querySelectorAll('[data-kuis]');
  if (!daftarKuis.length) return;

  Array.prototype.forEach.call(daftarKuis, function (form) {
    var soal = form.querySelectorAll('[data-kuis-soal]');
    var skor = form.querySelector('[data-kuis-skor]');
    var tombolUlangi = form.querySelector('[data-kuis-ulangi]');
    var tombolPeriksa = form.querySelector('[data-kuis-periksa]');

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
      form.removeAttribute('data-sudah');
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
  });
})();
