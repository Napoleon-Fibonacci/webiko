/* ============================================================
   Web Guide — assets/js/main.js
   Script utama. Vanilla JavaScript, tanpa build step.
   ============================================================ */
/* Toggle menu navbar di layar kecil (< 768px). */
document.querySelectorAll('.navbar').forEach(function (navbar) {
  var toggle = navbar.querySelector('.navbar__toggle');
  if (!toggle) return;

  function close() {
    navbar.removeAttribute('data-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Buka menu');
  }

  toggle.addEventListener('click', function () {
    if (navbar.hasAttribute('data-open')) {
      close();
    } else {
      navbar.setAttribute('data-open', '');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Tutup menu');
    }
  });

  // Tutup menu setelah salah satu tautan dipilih.
  navbar.querySelectorAll('.navbar__link').forEach(function (link) {
    link.addEventListener('click', close);
  });

  // Di desktop menu selalu tampil, jadi state mobile tidak boleh tertinggal.
  // Nilai 768px harus sama dengan breakpoint "Tablet" di assets/css/style.css.
  var desktop = window.matchMedia('(min-width: 768px)');
  var onBreakpoint = function (e) {
    if (e.matches) close();
  };
  if (desktop.addEventListener) {
    desktop.addEventListener('change', onBreakpoint);
  } else {
    desktop.addListener(onBreakpoint);
  }
  if (desktop.matches) close();
});

/* Daftar kurikulum di beranda (datanya di data/kurikulum.js).
   Elemennya dibangun lewat DOM API, bukan innerHTML, supaya isi
   data tidak pernah diperlakukan sebagai markup. */
document.querySelectorAll('[data-kurikulum]').forEach(function (host) {
  if (typeof KURIKULUM === 'undefined') return;

  KURIKULUM.forEach(function (jalur, urutan) {
    var nomor = document.createElement('span');
    nomor.className = 'card__index';
    nomor.setAttribute('aria-hidden', 'true');
    nomor.textContent = String(urutan + 1);

    var judul = document.createElement('h3');
    judul.className = 'card__title';
    judul.textContent = jalur.judul;

    var ringkas = document.createElement('p');
    ringkas.className = 'card__text';
    ringkas.textContent = jalur.ringkas;

    var meta = document.createElement('div');
    meta.className = 'card__meta';

    var tingkat = document.createElement('span');
    tingkat.className = 'badge badge--outline';
    tingkat.textContent = jalur.tingkat;

    var jumlahBab = document.createElement('span');
    jumlahBab.textContent = jalur.bab.length + ' bab';

    meta.append(tingkat, jumlahBab);

    if (jalur.status === 'segera') {
      var status = document.createElement('span');
      status.className = 'badge badge--pink';
      status.textContent = 'Segera';
      meta.append(status);
    }

    var kartu = document.createElement('article');
    kartu.className = 'card card--lesson';
    kartu.append(nomor, judul, ringkas, meta);

    var item = document.createElement('li');
    item.append(kartu);
    host.append(item);
  });
});

/* Tema: terang, gelap, atau ikut setelan sistem.
   Atribut data-tema di <html> sudah dipasang script di <head> sebelum
   halaman digambar; di sini hanya tombolnya. Pilihan disimpan di
   localStorage "tema"; tidak ada simpanan berarti "ikut sistem". */
(function () {
  var KUNCI = 'tema';
  var LABEL = { sistem: 'Sistem', terang: 'Terang', gelap: 'Gelap' };
  var KETERANGAN = {
    sistem: 'ikut setelan sistem',
    terang: 'selalu terang',
    gelap: 'selalu gelap',
  };
  var URUTAN = { sistem: 'terang', terang: 'gelap', gelap: 'sistem' };

  var pilihan = bacaPilihan();
  var sistem = window.matchMedia('(prefers-color-scheme: dark)');

  function bacaPilihan() {
    try {
      var nilai = localStorage.getItem(KUNCI);
      if (nilai === 'terang' || nilai === 'gelap') return nilai;
    } catch (e) {
      /* localStorage bisa dimatikan; anggap saja ikut sistem. */
    }
    return 'sistem';
  }

  function terapkan(pilihanBaru) {
    pilihan = pilihanBaru;

    var gelap = pilihan === 'gelap' || (pilihan === 'sistem' && sistem.matches);
    document.documentElement.setAttribute('data-tema', gelap ? 'gelap' : 'terang');

    try {
      if (pilihan === 'sistem') {
        localStorage.removeItem(KUNCI);
      } else {
        localStorage.setItem(KUNCI, pilihan);
      }
    } catch (e) {
      /* Pilihan tetap berlaku untuk sesi ini walau tidak bisa disimpan. */
    }

    document.querySelectorAll('[data-tema-toggle]').forEach(function (tombol) {
      tombol.setAttribute('data-pilihan', pilihan);
      tombol.setAttribute(
        'aria-label',
        'Tema: ' + KETERANGAN[pilihan] + '. Ubah ke ' + LABEL[URUTAN[pilihan]] + '.'
      );

      var label = tombol.querySelector('.theme-toggle__label');
      if (label) label.textContent = LABEL[pilihan];
    });
  }

  document.querySelectorAll('[data-tema-toggle]').forEach(function (tombol) {
    tombol.addEventListener('click', function () {
      terapkan(URUTAN[pilihan]);
    });
  });

  /* Selama pilihan "sistem", tema ikut berubah saat setelan OS berubah. */
  var onSistem = function () {
    if (pilihan === 'sistem') terapkan('sistem');
  };
  if (sistem.addEventListener) {
    sistem.addEventListener('change', onSistem);
  } else {
    sistem.addListener(onSistem);
  }

  terapkan(pilihan);
})();


