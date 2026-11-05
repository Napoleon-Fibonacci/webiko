/* ============================================================
   Webiko — assets/js/main.js
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

    /* Jalur yang sudah punya bab memakai <a> supaya seluruh kartu bisa
       diklik. Jalur "segera" tetap <article>, bukan tautan palsu. */
    var kartu;
    if (jalur.tautan) {
      kartu = document.createElement('a');
      kartu.className = 'card card--lesson card--tautan';
      kartu.href = jalur.tautan;
    } else {
      kartu = document.createElement('article');
      kartu.className = 'card card--lesson';
    }
    /* Warna kartu per jalur diatur lewat atribut ini, bukan urutan. */
    kartu.setAttribute('data-jalur', jalur.slug);
    kartu.append(nomor, judul, ringkas, meta);

    var item = document.createElement('li');
    item.setAttribute('data-reveal', '');
    item.append(kartu);
    host.append(item);
  });
});

/* Tema: terang, gelap, atau ikut setelan sistem.
   Atribut data-tema di <html> sudah dipasang script di <head> sebelum
   halaman digambar; di sini hanya tombolnya. Pilihan disimpan di
   localStorage "tema". Tanpa simpanan, bawaannya terang; "sistem"
   cuma berlaku kalau pengguna memilihnya sendiri. */
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
      if (nilai === 'terang' || nilai === 'gelap' || nilai === 'sistem') return nilai;
    } catch (e) {
      /* localStorage bisa dimatikan; pakai bawaan terang. */
    }
    return 'terang';
  }

  function terapkan(pilihanBaru) {
    pilihan = pilihanBaru;

    var gelap = pilihan === 'gelap' || (pilihan === 'sistem' && sistem.matches);
    document.documentElement.setAttribute('data-tema', gelap ? 'gelap' : 'terang');

    try {
      /* "sistem" ikut disimpan, bukan dihapus, supaya beda dari
         pengguna baru yang belum memilih apa pun (bawaannya terang). */
      localStorage.setItem(KUNCI, pilihan);
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

/* Gerak masuk layar untuk elemen bertanda [data-reveal].
   Kelas .reveal-siap dipasang script di <head> sebelum halaman digambar,
   jadi tanpa JavaScript atau tanpa IntersectionObserver tidak ada isi
   yang disembunyikan. Tiap elemen dianimasikan sekali saja; setelah
   tampil, pengamatnya dilepas supaya tidak ada kerja sia-sia.

   Jeda antar elemen dihitung dari giliran masuknya (kelipatan --stagger
   di stylesheet), jadi satu kelompok yang muncul bersamaan tampil
   bertahap walau tata letaknya beda-beda. */
(function () {
  /* Tanda bahwa pengatur gerak sudah jalan, dibaca script <head> supaya
     isi halaman tidak dilepas paksa kalau script ini gagal dimuat. */
  window.__wgReveal = true;

  var sasaran = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (!sasaran.length) return;

  function tampilkan(el, urutan) {
    el.style.setProperty('--reveal-step', Math.min(urutan, 5));
    el.classList.add('is-in');
  }

  /* Gerakan minim atau observer tidak ada: tampilkan semuanya sekaligus. */
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    sasaran.forEach(function (el) { tampilkan(el, 0); });
    return;
  }

  var pengamat = new IntersectionObserver(function (entries) {
    var urutan = 0;
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      tampilkan(entry.target, urutan);
      pengamat.unobserve(entry.target);
      urutan += 1;
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });

  sasaran.forEach(function (el) { pengamat.observe(el); });
})();

/* Gerbang materi: tamu tidak melihat isi sama sekali, hanya layar
   penuh berisi ajakan daftar/masuk. Isi HTML tetap ada supaya halaman
   masih bisa dirayapi mesin pencari; yang ditutup hanya tampilannya.
   JS mati = tidak ada yang disembunyikan (sesuai aturan situs). */
(function () {
  if (window.location.pathname.indexOf('/materi/') === -1) return;
  if (!document.querySelector('article.materi')) return;

  function alamatKembali() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  function tautanAkun(tab) {
    return (
      '/akun.html?lanjut=' +
      encodeURIComponent(alamatKembali()) +
      '&tab=' +
      tab
    );
  }

  function buatLayar() {
    var layar = document.createElement('div');
    layar.className = 'gerbang-layar';
    layar.setAttribute('role', 'dialog');
    layar.setAttribute('aria-modal', 'true');
    layar.setAttribute('aria-labelledby', 'gerbang-judul');
    layar.setAttribute('tabindex', '-1');
    layar.innerHTML = [
      '<svg class="kar kar--1" viewBox="0 0 120 120" aria-hidden="true" focusable="false">',
      '<rect class="kar__bayang" x="18" y="28" width="92" height="74" rx="12"></rect>',
      '<rect class="kar__putih" x="10" y="20" width="92" height="74" rx="12"></rect>',
      '<path class="kar__garis" d="M10 46h92"></path>',
      '<circle class="kar__titik" cx="26" cy="33" r="4"></circle>',
      '<circle class="kar__titik" cx="40" cy="33" r="4"></circle>',
      '<circle class="kar__titik" cx="54" cy="33" r="4"></circle>',
      '<circle class="kar__pipi" cx="35" cy="78" r="6"></circle>',
      '<circle class="kar__pipi" cx="77" cy="78" r="6"></circle>',
      '<circle class="kar__mata" cx="46" cy="67" r="8"></circle>',
      '<circle class="kar__mata" cx="66" cy="67" r="8"></circle>',
      '<circle class="kar__kilau" cx="49" cy="64" r="2.5"></circle>',
      '<circle class="kar__kilau" cx="69" cy="64" r="2.5"></circle>',
      '<path class="kar__mulut" d="M50 82q6 6 12 0"></path>',
      '</svg>',

      '<svg class="kar kar--2" viewBox="0 0 120 120" aria-hidden="true" focusable="false">',
      '<path class="kar__bayang" transform="translate(7 7)" d="M58 12 L72.6 39.6 L103 44 L80.5 66 L85.4 96.2 L58 82.8 L30.6 96.2 L35.5 66 L13 44 L43.4 39.6 Z"></path>',
      '<path class="kar__kuning" d="M58 12 L72.6 39.6 L103 44 L80.5 66 L85.4 96.2 L58 82.8 L30.6 96.2 L35.5 66 L13 44 L43.4 39.6 Z"></path>',
      '<circle class="kar__mata" cx="48" cy="52" r="5"></circle>',
      '<circle class="kar__mata" cx="68" cy="52" r="5"></circle>',
      '<path class="kar__mulut" d="M50 64q8 6 16 0"></path>',
      '<path class="kar__ungu" d="M104 18l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"></path>',
      '<path class="kar__ungu" d="M14 84l1.5 4.5L20 90l-4.5 1.5L14 96l-1.5-4.5L8 90l4.5-1.5z"></path>',
      '</svg>',

      '<svg class="kar kar--3" viewBox="0 0 120 120" aria-hidden="true" focusable="false">',
      '<g transform="rotate(10 60 60)">',
      '<path class="kar__bayang" transform="translate(6 6)" d="M49 12H69A8 8 0 0 1 77 20V84L59 108L41 84V20A8 8 0 0 1 49 12Z"></path>',
      '<path class="kar__kuning" d="M49 12H69A8 8 0 0 1 77 20V84L59 108L41 84V20A8 8 0 0 1 49 12Z"></path>',
      '<path class="kar__pink" d="M41 27V20A8 8 0 0 1 49 12H69A8 8 0 0 1 77 20V27Z"></path>',
      '<path class="kar__putih" d="M41 84L59 108L77 84Z"></path>',
      '<path class="kar__ujung" d="M54 96L59 108L64 96Z"></path>',
      '<circle class="kar__mata" cx="52" cy="48" r="4"></circle>',
      '<circle class="kar__mata" cx="66" cy="48" r="4"></circle>',
      '<path class="kar__mulut" d="M53 58q7 5 14 0"></path>',
      '</g>',
      '</svg>',

      '<svg class="kar kar--4" viewBox="0 0 120 120" aria-hidden="true" focusable="false">',
      '<g class="kar__roket">',
      '<path class="kar__bayang" transform="translate(5 5)" d="M60 12c16 0 28 18 28 42v26H32V54c0-24 12-42 28-42z"></path>',
      '<path class="kar__api" d="M46 78C46 90 52 98 60 106C68 98 74 90 74 78Z"></path>',
      '<path class="kar__pink" d="M32 58L16 80H32Z"></path>',
      '<path class="kar__pink" d="M88 58L104 80H88Z"></path>',
      '<path class="kar__putih" d="M60 12c16 0 28 18 28 42v26H32V54c0-24 12-42 28-42z"></path>',
      '<circle class="kar__ungu" cx="60" cy="44" r="11"></circle>',
      '<circle class="kar__kilau" cx="56" cy="40" r="3"></circle>',
      '<circle class="kar__mata" cx="54" cy="64" r="4"></circle>',
      '<circle class="kar__mata" cx="66" cy="64" r="4"></circle>',
      '<path class="kar__mulut" d="M56 72q4 4 8 0"></path>',
      '</g>',
      '</svg>',

      '<div class="gerbang-layar__kartu">',
      '<svg class="gerbang-layar__ikon" viewBox="0 0 92 104" aria-hidden="true" focusable="false">',
      '<rect class="gerbang-layar__badan" x="8" y="46" width="76" height="52" rx="10"></rect>',
      '<path class="gerbang-layar__gagang" d="M26 46V34a20 20 0 0 1 40 0v12"></path>',
      '<circle class="gerbang-layar__lubang" cx="46" cy="68" r="7"></circle>',
      '<path class="gerbang-layar__kunci" d="M46 72v12"></path>',
      '</svg>',
      '<p class="gerbang-layar__label">Materi khusus anggota</p>',
      '<h2 class="gerbang-layar__judul" id="gerbang-judul">Daftar dulu untuk membuka materi</h2>',
      '<p class="gerbang-layar__teks">Materi ini hanya bisa dibuka setelah kamu punya akun. Gratis, cukup username dan password. Setelah masuk, kamu langsung kembali ke halaman ini.</p>',
      '<div class="gerbang-layar__aksi">',
      '<a class="btn btn--primary" data-gerbang-daftar href="#">Daftar gratis</a>',
      '<a class="btn btn--ghost" data-gerbang-masuk href="#">Sudah punya akun</a>',
      '</div>',
      '<p class="gerbang-layar__kecil"><a class="btn btn--ghost gerbang-layar__kembali" href="/">Kembali ke beranda</a></p>',
      '</div>',
    ].join('');

    layar.querySelector('[data-gerbang-daftar]').href = tautanAkun('daftar');
    layar.querySelector('[data-gerbang-masuk]').href = tautanAkun('masuk');
    return layar;
  }

  function kunci() {
    if (document.querySelector('.gerbang-layar')) return;

    var layar = buatLayar();
    document.body.appendChild(layar);
    document.documentElement.classList.add('gerbang-aktif');

    /* Cegah fokus keyboard masuk ke halaman di belakang layar. */
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el !== layar) el.setAttribute('inert', '');
    });

    layar.focus();
  }

  function adaSesiLokal() {
    try {
      for (var i = 0; i < window.localStorage.length; i++) {
        var nama = window.localStorage.key(i) || '';
        if (nama.indexOf('sb-') !== 0) continue;
        if (nama.slice(-11) !== '-auth-token') continue;
        var isi = JSON.parse(window.localStorage.getItem(nama) || 'null');
        if (isi && isi.access_token) return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }

  if (!adaSesiLokal()) {
    kunci();
    return;
  }

  import('./supabase.js')
    .then(function (modul) {
      return modul.getSession();
    })
    .then(function (sesi) {
      if (!sesi) kunci();
    })
    .catch(function () {
      kunci();
    });
})();

/* ============================================================
   Progres pribadi di halaman materi:
   - tautan "Progres saya" di sidebar,
   - blok "Tandai selesai" sebelum kaki artikel (hanya untuk
     pengguna yang sudah masuk).
   bab_id diturunkan dari path (/materi/<jalur>/<bab>.html) supaya
   37 halaman materi tidak perlu diubah satu per satu.
   ============================================================ */
(function () {
  'use strict';

  var artikel = document.querySelector('article.materi');
  if (!artikel) return;

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
  if (!idBab) return;

  /* Tautan ke halaman progres, sekali saja. */
  var sidebar = document.querySelector('.sidebar');
  if (sidebar && !sidebar.querySelector('.sidebar__progres')) {
    var tautanProgres = document.createElement('a');
    tautanProgres.className = 'sidebar__link sidebar__progres';
    tautanProgres.href = '../../progres.html';
    tautanProgres.textContent = 'Progres saya';
    sidebar.appendChild(tautanProgres);
  }

  /* Blok tandai selesai. Tidak ada di HTML, jadi tanpa JavaScript
     tidak ada tombol yang bisa diklik tetapi tidak bereaksi. */
  var kotak = document.createElement('section');
  kotak.className = 'tandai';
  kotak.hidden = true;

  var kiri = document.createElement('div');
  var label = document.createElement('p');
  label.className = 'tandai__label';
  label.textContent = 'Progres bab';
  var judul = document.createElement('h2');
  judul.className = 'tandai__judul';
  var keterangan = document.createElement('p');
  keterangan.className = 'tandai__teks';
  kiri.appendChild(label);
  kiri.appendChild(judul);
  kiri.appendChild(keterangan);
  kotak.appendChild(kiri);

  var aksi = document.createElement('div');
  aksi.className = 'tandai__aksi';
  kotak.appendChild(aksi);

  var tombol = document.createElement('button');
  tombol.type = 'button';
  tombol.className = 'btn btn--primary';
  tombol.textContent = 'Tandai selesai';

  var kaki = artikel.querySelector('.materi__kaki');
  if (kaki) kaki.before(kotak);
  else artikel.appendChild(kotak);

  function tampilkanBelum() {
    kotak.hidden = false;
    kotak.removeAttribute('data-selesai');
    judul.textContent = 'Sudah selesai membaca?';
    keterangan.textContent = 'Tandai bab ini selesai supaya tercatat di Progres saya.';
    tombol.disabled = false;
    tombol.textContent = 'Tandai selesai';
    aksi.replaceChildren(tombol);
  }

  function tampilkanSelesai() {
    kotak.hidden = false;
    kotak.setAttribute('data-selesai', '');
    judul.textContent = 'Bab ini sudah selesai';
    keterangan.textContent = 'Progresnya tersimpan di akunmu.';

    var status = document.createElement('span');
    status.className = 'tandai__status';
    status.textContent = '\u2713 Selesai';

    var lihat = document.createElement('a');
    lihat.className = 'btn btn--ghost';
    lihat.href = '../../progres.html';
    lihat.textContent = 'Lihat progres';

    aksi.replaceChildren(status, lihat);
  }

  var sesiAktif = null;
  var modulSiap = import('./supabase.js')
    .then(function (modul) {
      return modul.getSession().then(function (sesi) {
        if (!sesi) return null;
        sesiAktif = sesi;
        return modul;
      });
    })
    .catch(function () {
      return null;
    });

  modulSiap.then(function (modul) {
    if (!modul) return;
    tampilkanBelum();

    modul.supabase
      .from('progress')
      .select('selesai')
      .eq('bab_id', idBab)
      .maybeSingle()
      .then(function (hasil) {
        if (hasil.data && hasil.data.selesai) tampilkanSelesai();
      })
      .catch(function () {});

    tombol.addEventListener('click', function () {
      if (!sesiAktif) return;
      tombol.disabled = true;
      tombol.textContent = 'Menyimpan\u2026';

      modul.supabase
        .from('progress')
        .upsert(
          {
            user_id: sesiAktif.user.id,
            bab_id: idBab,
            selesai: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,bab_id' }
        )
        .then(function (hasil) {
          if (hasil.error) throw hasil.error;
          tampilkanSelesai();
        })
        .catch(function () {
          keterangan.textContent =
            'Gagal menyimpan progres. Periksa koneksi, lalu coba lagi.';
          tombol.disabled = false;
          tombol.textContent = 'Tandai selesai';
        });
    });
  });
})();

/* ============================================================
   Google Analytics 4 (gtag.js).
   Dimuat dari satu file ini supaya 39 halaman ikut tanpa mengubah
   tiap HTML. Tidak jalan di localhost, file lokal, dan /admin,
   supaya data produksi bersih. Tanpa cookie iklan, IP dianonimkan.
   ============================================================ */
(function () {
  'use strict';

  var ID = 'G-VBPXBRC5MX';
  var hos = window.location.hostname;
  if (!hos || hos === 'localhost' || hos === '127.0.0.1') return;
  if (window.location.protocol === 'file:') return;
  if (window.location.pathname.indexOf('/admin') === 0) return;
  if (navigator.doNotTrack === '1') return;
  if (window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };

  var skrip = document.createElement('script');
  skrip.async = true;
  skrip.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(skrip);

  window.gtag('js', new Date());
  window.gtag('config', ID, { anonymize_ip: true });
})();


