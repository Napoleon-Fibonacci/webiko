/* Halaman akun: masuk dan daftar dengan username + password.
   Tanpa JavaScript, kedua formulir tetap tampil dan <noscript>
   menjelaskan bahwa pengiriman butuh JavaScript. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.setAttribute('data-akun-siap', '');

  var tamu = document.querySelector('[data-akun-tamu]');
  var sudahMasuk = document.querySelector('[data-akun-masuk]');
  var namaPengguna = document.querySelector('[data-akun-nama]');
  var kotakPesan = document.querySelector('[data-akun-pesan]');
  var kotakConfig = document.querySelector('[data-akun-config]');
  var tombolKeluar = document.querySelector('[data-akun-keluar]');
  var tombolHapus = document.querySelector('[data-akun-hapus]');

  var tab = Array.prototype.slice.call(
    document.querySelectorAll('[data-akun-tab]')
  );
  var panel = Array.prototype.slice.call(
    document.querySelectorAll('[data-akun-panel]')
  );

  var formMasuk = document.querySelector('[data-form="masuk"]');
  var formDaftar = document.querySelector('[data-form="daftar"]');

  var POLA_USERNAME = /^[A-Za-z0-9_]{3,20}$/;
  var modul = null;
  var parameter = new URLSearchParams(window.location.search);
  var tujuan = tujuanAman(parameter.get('lanjut'));
  var tabAwal = parameter.get('tab') === 'daftar' ? 'daftar' : 'masuk';

  /* Hanya izinkan kembali ke halaman materi atau progres di origin
     yang sama. Mencegah open redirect lewat ?lanjut=//situs-lain. */
  function tujuanAman(nilai) {
    if (!nilai) return '';
    try {
      var alamat = new URL(nilai, window.location.origin);
      if (alamat.origin !== window.location.origin) return '';
      var bahan = alamat.pathname.indexOf('/materi/') === 0;
      var progres =
        alamat.pathname === '/progres' || alamat.pathname === '/progres.html';
      if (!bahan && !progres) return '';
      return alamat.pathname + alamat.search + alamat.hash;
    } catch (e) {
      return '';
    }
  }

  /* ---------- Pesan ---------- */

  function tampilkanPesan(teks, jenis) {
    var judul = document.createElement('span');
    judul.className = 'alert__title';
    judul.textContent =
      jenis === 'success' ? 'Berhasil' : jenis === 'warning' ? 'Perhatian' : 'Gagal';

    var isi = document.createElement('p');
    isi.className = 'alert__text';
    isi.textContent = teks;

    kotakPesan.className = 'alert alert--' + jenis;
    kotakPesan.replaceChildren(judul, isi);
    kotakPesan.hidden = false;
  }

  function bersihkanPesan() {
    kotakPesan.hidden = true;
    kotakPesan.textContent = '';
    kotakPesan.className = 'alert';
  }

  function tandaiSalah(input, teks) {
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    tampilkanPesan(teks, 'error');
  }

  /* ---------- Tab masuk / daftar ---------- */

  function pilihTab(nama, fokus) {
    tab.forEach(function (tombol) {
      var aktif = tombol.getAttribute('data-akun-tab') === nama;
      tombol.setAttribute('aria-selected', aktif ? 'true' : 'false');
      tombol.tabIndex = aktif ? 0 : -1;
      if (aktif && fokus) tombol.focus();
    });

    panel.forEach(function (bagian) {
      bagian.hidden = bagian.getAttribute('data-akun-panel') !== nama;
    });
  }

  tab.forEach(function (tombol) {
    tombol.addEventListener('click', function () {
      bersihkanPesan();
      pilihTab(tombol.getAttribute('data-akun-tab'), false);
    });

    tombol.addEventListener('keydown', function (e) {
      var posisi = tab.indexOf(tombol);
      var tujuan = null;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        tujuan = tab[(posisi + 1) % tab.length];
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        tujuan = tab[(posisi - 1 + tab.length) % tab.length];
      } else if (e.key === 'Home') {
        tujuan = tab[0];
      } else if (e.key === 'End') {
        tujuan = tab[tab.length - 1];
      }

      if (!tujuan) return;
      e.preventDefault();
      bersihkanPesan();
      pilihTab(tujuan.getAttribute('data-akun-tab'), true);
    });
  });

  /* ---------- Keadaan sesi ---------- */

  /* Tanpa sesi, tab Masuk yang aktif; panel Daftar disembunyikan.
     Tanpa JavaScript, pemanggilan ini tidak ada sehingga kedua
     formulir tetap tampil. */
  pilihTab(tabAwal, false);

  function tampilkanSudahMasuk(session) {
    var user = session && session.user;
    if (!user) return;

    if (tujuan) {
      window.location.replace(tujuan);
      return;
    }

    var meta = user.user_metadata || {};
    var nama =
      (meta.username && String(meta.username)) ||
      String(user.email || '').split('@')[0] ||
      'pelajar';

    namaPengguna.textContent = nama;
    sudahMasuk.hidden = false;
    tamu.hidden = true;
    bersihkanPesan();
    formMasuk.reset();
    formDaftar.reset();
  }

  function tampilkanTamu() {
    sudahMasuk.hidden = true;
    tamu.hidden = false;
    pilihTab('masuk', false);
    bersihkanPesan();
  }

  /* ---------- Konfigurasi & modul ---------- */

  var env = window.__ENV__ || {};
  var url = String(env.SUPABASE_URL || '');
  var kunci = String(env.SUPABASE_ANON_KEY || '');
  var adaConfig =
    url.indexOf('http') === 0 &&
    kunci.length > 20 &&
    kunci.indexOf('GANTI') === -1 &&
    url.indexOf('GANTI') === -1;

  function kunciTombol(nonaktif) {
    [formMasuk, formDaftar].forEach(function (form) {
      var tombol = form.querySelector('button[type="submit"]');
      if (tombol) tombol.disabled = nonaktif;
    });
  }

  if (!adaConfig) {
    kotakConfig.hidden = false;
    kunciTombol(true);
  }

  function pesanError(err) {
    var teks = String((err && err.message) || '').toLowerCase();

    if (teks.indexOf('invalid login credentials') !== -1) {
      return 'Username atau password salah.';
    }
    if (teks.indexOf('user already registered') !== -1) {
      return 'Username sudah dipakai, coba yang lain.';
    }
    if (teks.indexOf('password should be at least') !== -1) {
      return 'Password minimal 6 karakter.';
    }
    if (teks.indexOf('email not confirmed') !== -1) {
      return 'Konfirmasi email masih aktif di Supabase. Matikan di Authentication → Sign In / Providers → Email.';
    }
    if (
      teks.indexOf('rate limit') !== -1 ||
      teks.indexOf('only request this after') !== -1
    ) {
      return 'Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.';
    }
    if (teks.indexOf('failed to fetch') !== -1) {
      return 'Tidak bisa menghubungi server. Periksa koneksi internet.';
    }

    return (err && err.message) || 'Terjadi kesalahan. Coba lagi.';
  }

  if (adaConfig) {
    import('./supabase.js')
      .then(function (m) {
        modul = m;
        kunciTombol(false);
        return m.getSession();
      })
      .then(function (session) {
        if (session) {
          tampilkanSudahMasuk(session);
        } else if (tujuan) {
          tampilkanPesan(
            'Masuk atau daftar dulu untuk membuka materi.',
            'warning'
          );
        }
      })
      .catch(function (err) {
        kunciTombol(true);
        tampilkanPesan(
          'Gagal memuat layanan akun. ' + pesanError(err),
          'error'
        );
      });
  }

  /* ---------- Kirim formulir ---------- */

  function setSibuk(form, aktif) {
    var tombol = form.querySelector('button[type="submit"]');
    if (!tombol) return;

    if (aktif) {
      tombol.dataset.label = tombol.textContent;
      tombol.textContent = 'Memproses…';
      tombol.disabled = true;
      tombol.setAttribute('aria-busy', 'true');
    } else {
      tombol.textContent = tombol.dataset.label || tombol.textContent;
      tombol.removeAttribute('aria-busy');
      tombol.disabled = !modul;
    }
  }

  function baca(form) {
    var data = new FormData(form);
    return {
      username: String(data.get('username') || '').trim(),
      password: String(data.get('password') || ''),
      ulangi: String(data.get('password2') || ''),
    };
  }

  formMasuk.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!modul) return;

    bersihkanPesan();
    var isi = baca(formMasuk);
    var username = formMasuk.querySelector('[name="username"]');
    var password = formMasuk.querySelector('[name="password"]');

    if (!POLA_USERNAME.test(isi.username)) {
      return tandaiSalah(
        username,
        'Username harus 3-20 karakter dan hanya boleh huruf, angka, atau garis bawah.'
      );
    }
    if (isi.password.length < 6) {
      return tandaiSalah(password, 'Password minimal 6 karakter.');
    }

    setSibuk(formMasuk, true);

    modul
      .signIn(isi.username, isi.password)
      .then(function (session) {
        tampilkanSudahMasuk(session);
      })
      .catch(function (err) {
        tandaiSalah(password, pesanError(err));
      })
      .finally(function () {
        setSibuk(formMasuk, false);
      });
  });

  formDaftar.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!modul) return;

    bersihkanPesan();
    var isi = baca(formDaftar);
    var username = formDaftar.querySelector('[name="username"]');
    var password = formDaftar.querySelector('[name="password"]');
    var ulangi = formDaftar.querySelector('[name="password2"]');

    if (!POLA_USERNAME.test(isi.username)) {
      return tandaiSalah(
        username,
        'Username harus 3-20 karakter dan hanya boleh huruf, angka, atau garis bawah.'
      );
    }
    if (isi.password.length < 6) {
      return tandaiSalah(password, 'Password minimal 6 karakter.');
    }
    if (isi.password !== isi.ulangi) {
      return tandaiSalah(ulangi, 'Ulangi password belum sama.');
    }

    setSibuk(formDaftar, true);

    modul
      .signUp(isi.username, isi.password)
      .then(function (hasil) {
        if (hasil && hasil.session) {
          tampilkanSudahMasuk(hasil.session);
          return;
        }

        formDaftar.reset();
        pilihTab('masuk', false);
        tampilkanPesan(
          'Akun dibuat. Masuk dengan username dan password yang tadi.',
          'success'
        );
        formMasuk.querySelector('[name="username"]').focus();
      })
      .catch(function (err) {
        tandaiSalah(username, pesanError(err));
      })
      .finally(function () {
        setSibuk(formDaftar, false);
      });
  });

  /* ---------- Keluar ---------- */

  tombolKeluar.addEventListener('click', function () {
    if (!modul) return;

    tombolKeluar.disabled = true;
    tombolKeluar.textContent = 'Keluar…';

    modul
      .signOut()
      .then(function () {
        tampilkanTamu();
      })
      .catch(function (err) {
        tampilkanPesan(pesanError(err), 'error');
      })
      .finally(function () {
        tombolKeluar.disabled = false;
        tombolKeluar.textContent = 'Keluar';
      });
  });

  /* ---------- Hapus akun ---------- */

  tombolHapus.addEventListener('click', function () {
    if (!modul) return;

    var nama = namaPengguna.textContent.trim();
    var ketik = window.prompt(
      'Ketik username "' + nama + '" untuk menghapus akun secara permanen:'
    );
    if (ketik !== nama) {
      if (ketik !== null) {
        tampilkanPesan('Username tidak cocok. Penghapusan dibatalkan.', 'warning');
      }
      return;
    }

    tombolHapus.disabled = true;
    tombolHapus.textContent = 'Menghapus…';

    modul
      .getSession()
      .then(function (session) {
        if (!session) throw new Error('Sesi tidak ditemukan. Masuk ulang.');
        return fetch('/api/hapus-akun', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + session.access_token },
        });
      })
      .then(function (jawab) {
        return jawab
          .json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            if (!jawab.ok) {
              throw new Error(data.error || 'Gagal menghapus akun.');
            }
          });
      })
      .then(function () {
        return modul.signOut().catch(function () {
          /* sesi lokal tetap dibersihkan di bawah */
        });
      })
      .then(function () {
        tampilkanTamu();
        tampilkanPesan('Akun dan seluruh datanya sudah dihapus.', 'success');
      })
      .catch(function (err) {
        tampilkanPesan(pesanError(err), 'error');
      })
      .finally(function () {
        tombolHapus.disabled = false;
        tombolHapus.textContent = 'Hapus akun';
      });
  });

  /* Hapus tanda salah begitu pengguna mengetik lagi. */
  Array.prototype.forEach.call(
    document.querySelectorAll('.akun__form .input'),
    function (input) {
      input.addEventListener('input', function () {
        input.removeAttribute('aria-invalid');
      });
    }
  );
})();
