/* ============================================================
   Webiko — assets/js/progres.js
   Halaman progres pribadi (progres.html).

   Membaca sesi Supabase, lalu menampilkan:
     - ringkasan bab selesai + bar keseluruhan,
     - rata-rata skor, jumlah kuis, jalur yang sudah dimulai,
     - daftar bab per jalur. Bab yang belum selesai disembunyikan
       di balik tombol "Lihat N bab lainnya".

   Tidak ada API baru: RLS di tabel progress dan quiz_attempts
   sudah membatasi bacaan ke baris milik user yang sedang masuk.
   ============================================================ */

(function () {
  'use strict';

  var isi = document.querySelector('[data-progres-isi]');
  var muat = document.querySelector('[data-progres-muat]');
  var kotakPesan = document.querySelector('[data-progres-pesan]');
  var kotakConfig = document.querySelector('[data-progres-config]');
  if (!isi || !muat) return;

  /* KURIKULUM dideklarasikan dengan const di data/kurikulum.js, jadi
     tidak menempel di window; baca sebagai binding global. */
  var daftarKurikulum =
    typeof KURIKULUM !== 'undefined' && Array.isArray(KURIKULUM) ? KURIKULUM : [];

  var env = window.__ENV__ || {};
  var url = String(env.SUPABASE_URL || '');
  var kunci = String(env.SUPABASE_ANON_KEY || '');
  var adaConfig =
    url.indexOf('http') === 0 &&
    kunci.length > 20 &&
    kunci.indexOf('GANTI') === -1 &&
    url.indexOf('GANTI') === -1;

  /* ---------- Bantuan kecil ---------- */

  function el(tag, kelas, teks) {
    var node = document.createElement(tag);
    if (kelas) node.className = kelas;
    if (teks != null) node.textContent = teks;
    return node;
  }

  function tampilkanPesan(teks) {
    kotakPesan.textContent = teks;
    kotakPesan.hidden = false;
  }

  function babId(jalur, bab) {
    return jalur + '/' + bab;
  }

  function skorTerbaik(daftar) {
    var peta = new Map();
    daftar.forEach(function (baris) {
      var lama = peta.get(baris.bab_id);
      var skor = Number(baris.skor);
      if (!lama || skor > lama.skor) {
        peta.set(baris.bab_id, { skor: skor, total: Number(baris.total) });
      }
    });
    return peta;
  }

  /* ---------- Render ---------- */

  function gambar(nama, selesaiSet, skorPeta) {
    var fragmen = document.createDocumentFragment();

    var total = daftarKurikulum.reduce(function (jumlah, jalur) {
      return jumlah + jalur.bab.length;
    }, 0);

    var selesaiTotal = 0;
    var skorJumlah = 0;
    var kuisTotal = 0;
    var jalurMulai = 0;

    daftarKurikulum.forEach(function (jalur) {
      var adaYangSelesai = false;
      jalur.bab.forEach(function (bab) {
        if (selesaiSet.has(babId(jalur.slug, bab.slug))) {
          selesaiTotal++;
          adaYangSelesai = true;
        }
      });
      if (adaYangSelesai) jalurMulai++;
    });

    skorPeta.forEach(function (nilai) {
      skorJumlah += nilai.skor;
      kuisTotal++;
    });

    var persen = total ? Math.round((selesaiTotal / total) * 100) : 0;
    var rata = kuisTotal ? Math.round(skorJumlah / kuisTotal) : null;

    /* ---- Kepala ---- */
    var kepala = el('div', 'progres__kepala');

    var kiri = el('div');
    kiri.appendChild(el('p', 'card__label', 'Progres saya'));
    kiri.appendChild(el('h1', 'progres__judul', 'Halo, ' + nama));
    kiri.appendChild(
      el(
        'p',
        'text-muted progres__lead',
        'Semua bab yang kamu tandai selesai dan skor kuis tersimpan di akun ini. ' +
          'Pilih bab mana pun untuk lanjut belajar.'
      )
    );
    kepala.appendChild(kiri);

    var ringkas = el('div', 'progres__ringkas');
    var angka = el('p', 'progres__angka', String(selesaiTotal));
    var dariTotal = el('span', null, '/' + total);
    angka.appendChild(dariTotal);
    ringkas.appendChild(angka);
    ringkas.appendChild(el('p', 'progres__angka-label', 'bab selesai'));

    var bar = el('div', 'progres__bar');
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', 'Progres seluruh kurikulum');
    bar.setAttribute('aria-valuenow', String(persen));
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    var isiBar = el('span', 'progres__bar-isi' + (persen === 0 ? ' progres__bar-isi--nol' : ''));
    isiBar.style.width = persen + '%';
    bar.appendChild(isiBar);
    ringkas.appendChild(bar);
    ringkas.appendChild(el('p', 'progres__bar-ket', persen + '% dari seluruh kurikulum'));
    kepala.appendChild(ringkas);
    fragmen.appendChild(kepala);

    /* ---- Statistik ---- */
    var stat = el('ul', 'progres__stat');
    [
      ['Rata-rata skor', rata == null ? '\u2014' : rata + ' / 100'],
      ['Kuis dikerjakan', String(kuisTotal)],
      ['Jalur dimulai', jalurMulai + ' / ' + daftarKurikulum.length]
    ].forEach(function (baris) {
      var li = el('li');
      li.appendChild(el('span', 'progres__stat-label', baris[0]));
      li.appendChild(el('span', 'progres__stat-nilai', baris[1]));
      stat.appendChild(li);
    });
    fragmen.appendChild(stat);

    /* ---- Belum ada progres sama sekali ---- */
    if (selesaiTotal === 0 && kuisTotal === 0) {
      var kosong = el('div', 'progres__kosong');
      kosong.appendChild(el('div', 'progres__kosong-ikon', 'W'));
      kosong.appendChild(el('h2', null, 'Belum ada bab yang selesai'));
      kosong.appendChild(
        el(
          'p',
          'text-muted',
          'Buka bab pertama, baca sampai habis, lalu tekan \u201cTandai selesai\u201d. ' +
            'Skor kuis juga otomatis tercatat di sini.'
        )
      );

      var aksi = el('div', 'actions actions--spaced');
      aksi.style.justifyContent = 'center';
      var jalurPertama = daftarKurikulum[0];
      if (jalurPertama && jalurPertama.bab.length) {
        var babPertama = jalurPertama.bab[0];
        var mulai = el('a', 'btn btn--primary', 'Mulai dari ' + jalurPertama.judul.split(' ')[0]);
        mulai.href = 'materi/' + jalurPertama.slug + '/' + babPertama.slug + '.html';
        aksi.appendChild(mulai);
      }
      var kurikulum = el('a', 'btn btn--ghost', 'Lihat kurikulum');
      kurikulum.href = 'index.html#kurikulum';
      aksi.appendChild(kurikulum);
      kosong.appendChild(aksi);
      fragmen.appendChild(kosong);
      return fragmen;
    }

    /* ---- Per jalur ---- */
    daftarKurikulum.forEach(function (jalur, nomor) {
      var sudah = jalur.bab.filter(function (bab) {
        return selesaiSet.has(babId(jalur.slug, bab.slug));
      }).length;
      var persenJalur = jalur.bab.length
        ? Math.round((sudah / jalur.bab.length) * 100)
        : 0;

      var bagian = el('section', 'progres__jalur');
      bagian.style.setProperty('--jalur-warna', 'var(--color-jalur-' + jalur.slug + ')');
      bagian.style.setProperty('--jalur-teks', 'var(--color-jalur-' + jalur.slug + '-teks)');

      var kepalaJalur = el('div', 'progres__jalur-kepala');
      kepalaJalur.appendChild(
        el('span', 'progres__jalur-no', String(nomor + 1).padStart(2, '0'))
      );
      kepalaJalur.appendChild(el('h2', 'progres__jalur-judul', jalur.judul));
      kepalaJalur.appendChild(
        el('span', 'badge', sudah + '/' + jalur.bab.length + ' bab')
      );
      bagian.appendChild(kepalaJalur);

      var barJalur = el('div', 'progres__bar');
      barJalur.setAttribute('role', 'progressbar');
      barJalur.setAttribute('aria-label', 'Progres jalur ' + jalur.judul);
      barJalur.setAttribute('aria-valuenow', String(persenJalur));
      barJalur.setAttribute('aria-valuemin', '0');
      barJalur.setAttribute('aria-valuemax', '100');
      var isiJalur = el(
        'span',
        'progres__bar-isi' + (persenJalur === 0 ? ' progres__bar-isi--nol' : '')
      );
      isiJalur.style.width = persenJalur + '%';
      barJalur.appendChild(isiJalur);
      bagian.appendChild(barJalur);

      var idDaftar = 'bab-' + jalur.slug;
      var daftar = el('ol', 'progres__bab');
      daftar.id = idDaftar;

      var belum = 0;
      jalur.bab.forEach(function (bab, urutan) {
        var id = babId(jalur.slug, bab.slug);
        var selesai = selesaiSet.has(id);
        var nilai = skorPeta.get(id);
        if (!selesai) belum++;

        var li = el('li');
        if (!selesai) li.hidden = true;

        var tautan = el(
          'a',
          'progres__bab-item' + (selesai ? ' progres__bab-item--selesai' : '')
        );
        tautan.href = 'materi/' + jalur.slug + '/' + bab.slug + '.html';

        tautan.appendChild(
          el('span', 'progres__no', selesai ? '\u2713' : String(urutan + 1))
        );
        tautan.appendChild(el('span', 'progres__bab-judul', bab.judul));

        var meta = el('span', 'progres__bab-meta');
        if (selesai) {
          meta.appendChild(
            el(
              'span',
              'badge badge--accent',
              nilai ? String(nilai.skor) : 'Selesai'
            )
          );
        } else if (nilai) {
          meta.appendChild(el('span', 'badge badge--accent', String(nilai.skor)));
        } else {
          meta.appendChild(el('span', 'progres__belum', 'Belum'));
        }
        tautan.appendChild(meta);

        li.appendChild(tautan);
        daftar.appendChild(li);
      });

      bagian.appendChild(daftar);

      /* Bab yang belum selesai disembunyikan; tombol membuka semuanya. */
      if (belum > 0) {
        var tombol = el('button', 'btn btn--ghost progres__toggle', '');
        tombol.type = 'button';
        tombol.setAttribute('aria-expanded', 'false');
        tombol.setAttribute('aria-controls', idDaftar);

        var label = function (terbuka) {
          tombol.textContent = terbuka
            ? 'Sembunyikan ' + belum + ' bab lainnya'
            : 'Lihat ' + belum + ' bab lainnya';
        };
        label(false);

        tombol.addEventListener('click', function () {
          var terbuka = tombol.getAttribute('aria-expanded') !== 'true';
          tombol.setAttribute('aria-expanded', terbuka ? 'true' : 'false');
          Array.prototype.forEach.call(daftar.children, function (li) {
            if (li.querySelector('.progres__bab-item--selesai')) return;
            li.hidden = !terbuka;
          });
          label(terbuka);
        });

        bagian.appendChild(tombol);
      }

      fragmen.appendChild(bagian);
    });

    return fragmen;
  }

  /* ---------- Muat data ---------- */

  function jalan() {
    if (!adaConfig) {
      kotakConfig.hidden = false;
      muat.hidden = true;
      return;
    }

    import('./supabase.js')
      .then(function (modul) {
        return modul.getSession().then(function (sesi) {
          if (!sesi) {
            window.location.replace('akun.html?lanjut=%2Fprogres.html&tab=masuk');
            return null;
          }

          var meta = sesi.user.user_metadata || {};
          var nama =
            (meta.username && String(meta.username)) ||
            String(sesi.user.email || '').split('@')[0] ||
            'pelajar';

          return Promise.all([
            modul.supabase.from('progress').select('bab_id').eq('selesai', true),
            modul.supabase
              .from('quiz_attempts')
              .select('bab_id, skor, total')
              .order('created_at', { ascending: true })
          ]).then(function (hasil) {
            var progres = hasil[0];
            var kuis = hasil[1];
            if (progres.error) throw progres.error;
            if (kuis.error) throw kuis.error;

            var selesaiSet = new Set(
              (progres.data || []).map(function (baris) {
                return baris.bab_id;
              })
            );

            isi.replaceChildren(gambar(nama, selesaiSet, skorTerbaik(kuis.data || [])));
            muat.hidden = true;
            isi.hidden = false;
          });
        });
      })
      .catch(function (err) {
        muat.hidden = true;
        tampilkanPesan('Gagal memuat progres. ' + ((err && err.message) || 'Coba lagi.'));
      });
  }

  jalan();
})();
