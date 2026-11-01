/* ============================================================
   Webiko — assets/js/latihan-dom.js
   Lab DOM: menjalankan kode di dalam iframe pratinjau.
   Tanpa dependency. Hanya jalan kalau halaman punya [data-lab-dom].

   Kode siswa berjalan di iframe ber-sandbox, jadi document yang
   disentuh adalah dokumen pratinjau, bukan halaman materi.

   Perulangan diberi penghitung supaya kode yang berputar tanpa
   henti berhenti sendiri. Iframe yang terkunci tidak bisa
   dipulihkan tanpa memuat ulang halaman, jadi pencegahannya
   dilakukan sebelum kode dijalankan.
   ============================================================ */
(function () {
  var lab = document.querySelector('[data-lab-dom]');
  if (!lab) return;

  var editor = lab.querySelector('[data-lab-editor]');
  var pratinjau = lab.querySelector('[data-lab-pratinjau]');
  var tombolJalan = lab.querySelector('[data-lab-jalankan]');
  var tombolReset = lab.querySelector('[data-lab-reset]');
  var status = lab.querySelector('[data-lab-status]');
  if (!editor || !pratinjau || !tombolJalan || !tombolReset || !status) return;

  var kodeAwal = editor.value;
  var awalSrcdoc = pratinjau.getAttribute('srcdoc');
  var timer = null;
  var adaGalat = false;
  var kunci = 'lab-dom-' + Math.random().toString(36).slice(2);
  var sudahSelesai = false;
  var simpanan = lab.hasAttribute('data-lab-simpanan');
  var KUNCI_SIMPANAN = 'webiko-lab-penyimpanan';

  /* ---------- Sorot sintaks ---------- */

  function esc(teks) {
    return teks
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function warnai(kode) {
    var pola = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:const|let|var|function|return|if|else|for|while|true|false|null|undefined|new|typeof|of|in|break|continue|switch|case|default|class|try|catch|throw|async|await)\b)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_$][\w$]*(?=\s*\())/g;
    var hasil = '';
    var pos = 0;
    var cocok;

    while ((cocok = pola.exec(kode))) {
      hasil += esc(kode.slice(pos, cocok.index));
      if (cocok[1]) {
        hasil += '<span class="tok-komentar">' + esc(cocok[1]) + '</span>';
      } else if (cocok[2]) {
        hasil += '<span class="tok-string">' + esc(cocok[2]) + '</span>';
      } else if (cocok[3]) {
        hasil += '<span class="tok-kunci">' + esc(cocok[3]) + '</span>';
      } else if (cocok[4]) {
        hasil += '<span class="tok-angka">' + esc(cocok[4]) + '</span>';
      } else {
        hasil += '<span class="tok-fungsi">' + esc(cocok[5]) + '</span>';
      }
      pos = pola.lastIndex;
    }

    hasil += esc(kode.slice(pos));
    return hasil;
  }

  var lapisan = document.createElement('pre');
  lapisan.className = 'lab__sorot';
  lapisan.setAttribute('aria-hidden', 'true');
  var isiLapisan = document.createElement('code');
  lapisan.append(isiLapisan);

  var wadah = document.createElement('div');
  wadah.className = 'lab__editor-wrap';
  editor.parentNode.insertBefore(wadah, editor);
  wadah.append(lapisan, editor);

  function aturTinggi() {
    editor.style.height = 'auto';
    editor.style.height = editor.scrollHeight + 'px';
  }

  function samakanGulir() {
    lapisan.scrollTop = editor.scrollTop;
    lapisan.scrollLeft = editor.scrollLeft;
  }

  function perbarui() {
    isiLapisan.innerHTML = warnai(editor.value);
    samakanGulir();
    aturTinggi();
  }

  /* ---------- Penjaga perulangan ---------- */

  function cocokParen(kode, buka) {
    var dalam = 0;
    var i = buka;
    while (i < kode.length) {
      var c = kode[i];
      if (c === '"' || c === "'" || c === '`') {
        var j = i + 1;
        while (j < kode.length) {
          if (kode[j] === '\\') {
            j += 2;
            continue;
          }
          if (kode[j] === c) break;
          j++;
        }
        i = j + 1;
        continue;
      }
      if (c === '(') dalam++;
      else if (c === ')') {
        dalam--;
        if (dalam === 0) return i;
      }
      i++;
    }
    return -1;
  }

  function bagiFor(isi) {
    var bagian = [];
    var mulai = 0;
    var dalam = 0;
    var i = 0;
    while (i < isi.length) {
      var c = isi[i];
      if (c === '"' || c === "'" || c === '`') {
        var j = i + 1;
        while (j < isi.length) {
          if (isi[j] === '\\') {
            j += 2;
            continue;
          }
          if (isi[j] === c) break;
          j++;
        }
        i = j + 1;
        continue;
      }
      if (c === '(') dalam++;
      else if (c === ')') dalam--;
      else if (c === ';' && dalam === 0) {
        bagian.push(isi.slice(mulai, i));
        mulai = i + 1;
      }
      i++;
    }
    if (bagian.length !== 2) return null;
    bagian.push(isi.slice(mulai));
    return bagian;
  }

  /* Selipkan __lanjut() ke syarat for/while tanpa mengubah arti kode. */
  function beriPenjaga(kode) {
    var hasil = '';
    var i = 0;
    while (i < kode.length) {
      var c = kode[i];

      if (c === '"' || c === "'" || c === '`') {
        var j = i + 1;
        while (j < kode.length) {
          if (kode[j] === '\\') {
            j += 2;
            continue;
          }
          if (kode[j] === c) {
            j++;
            break;
          }
          j++;
        }
        hasil += kode.slice(i, j);
        i = j;
        continue;
      }

      if (c === '/' && kode[i + 1] === '/') {
        var baris = kode.indexOf('\n', i);
        if (baris < 0) baris = kode.length;
        hasil += kode.slice(i, baris);
        i = baris;
        continue;
      }

      if (c === '/' && kode[i + 1] === '*') {
        var tutupKomentar = kode.indexOf('*/', i + 2);
        tutupKomentar = tutupKomentar < 0 ? kode.length : tutupKomentar + 2;
        hasil += kode.slice(i, tutupKomentar);
        i = tutupKomentar;
        continue;
      }

      if (/[A-Za-z_$]/.test(c)) {
        var akhir = i + 1;
        while (akhir < kode.length && /[\w$]/.test(kode[akhir])) akhir++;
        var kata = kode.slice(i, akhir);
        hasil += kata;
        i = akhir;

        if (kata === 'for' || kata === 'while') {
          var buka = i;
          while (buka < kode.length && /\s/.test(kode[buka])) buka++;
          if (kode[buka] === '(') {
            var tutup = cocokParen(kode, buka);
            if (tutup > -1) {
              var isi = kode.slice(buka + 1, tutup);
              var baru = null;

              if (kata === 'while') {
                baru = '(' + isi + ') && __lanjut()';
              } else {
                var bagian = bagiFor(isi);
                if (bagian) {
                  var syarat = bagian[1].trim() === '' ? '__lanjut()' : '(' + bagian[1] + ') && __lanjut()';
                  baru = bagian[0] + ';' + syarat + ';' + bagian[2];
                }
              }

              if (baru !== null) {
                hasil += kode.slice(i, buka) + '(' + baru + ')';
                i = tutup + 1;
              }
            }
          }
        }
        continue;
      }

      hasil += c;
      i++;
    }
    return hasil;
  }

  /* ---------- Pratinjau ---------- */

  function aturTinggiPratinjau(tinggi) {
    if (typeof tinggi === 'number' && tinggi > 0) {
      pratinjau.style.height = tinggi + 'px';
    }
  }

  function hentikan(pesan) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    status.classList.add('lab__status--galat');
    status.textContent = pesan;
  }

  function selesai() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (sudahSelesai) return;
    sudahSelesai = true;
    if (adaGalat) {
      status.classList.add('lab__status--galat');
      status.textContent = 'Ada error. Baca pesan di panel Keluaran.';
      return;
    }
    status.classList.remove('lab__status--galat');
    status.textContent = 'Pratinjau diperbarui.';
  }

  function bacaSimpanan() {
    if (!simpanan) return null;
    try {
      var teks = localStorage.getItem(KUNCI_SIMPANAN);
      var data = teks ? JSON.parse(teks) : {};
      return data && typeof data === 'object' ? data : {};
    } catch (e) {
      return {};
    }
  }

  function tulisSimpanan(aksi, k, v) {
    if (!simpanan) return;
    try {
      var data = bacaSimpanan() || {};
      if (aksi === 'set') data[k] = v;
      else if (aksi === 'hapus') delete data[k];
      else if (aksi === 'bersih') data = {};
      localStorage.setItem(KUNCI_SIMPANAN, JSON.stringify(data));
    } catch (e) {}
  }

  function buatDokumen(kode) {
    var kodeAman = JSON.stringify(beriPenjaga(kode)).replace(/<\/script/gi, '<\\/script');
    var skripSimpanan = simpanan ? [
      '  var dataSimpanan = ' + JSON.stringify(bacaSimpanan() || {}) + ';',
      '  var shimSimpanan = {',
      '    getItem: function (k) { return Object.prototype.hasOwnProperty.call(dataSimpanan, k) ? dataSimpanan[k] : null; },',
      '    setItem: function (k, v) { dataSimpanan[k] = String(v); kirim("simpanan", ["set", k, dataSimpanan[k]]); },',
      '    removeItem: function (k) { delete dataSimpanan[k]; kirim("simpanan", ["hapus", k]); },',
      '    clear: function () { dataSimpanan = {}; kirim("simpanan", ["bersih"]); },',
      '    key: function (i) { var k = Object.keys(dataSimpanan); return i >= 0 && i < k.length ? k[i] : null; }',
      '  };',
      '  Object.defineProperty(shimSimpanan, "length", { get: function () { return Object.keys(dataSimpanan).length; } });',
      '  Object.defineProperty(window, "localStorage", { value: shimSimpanan, configurable: true });'
    ] : [];

    var skrip = [
      '<script>',
      '(function () {',
      '  var kunci = ' + JSON.stringify(kunci) + ';',
      '  var kode = ' + kodeAman + ';',
      '  var hitung = 0;'
    ].concat(skripSimpanan, [
      '  window.__lanjut = function () {',
      '    hitung++;',
      '    if (hitung > 1000000) {',
      '      var galat = new Error("Kode dihentikan karena berputar tanpa henti.");',
      '      galat.macet = true;',
      '      throw galat;',
      '    }',
      '    return true;',
      '  };',
      '  function format(nilai) {',
      '    if (typeof nilai === "string") return nilai;',
      '    if (typeof nilai === "undefined") return "undefined";',
      '    if (nilai === null) return "null";',
      '    if (nilai instanceof Error) return nilai.name + ": " + nilai.message;',
      '    return String(nilai);',
      '  }',
      '  function kirim(tipe, args) {',
      '    try {',
      '      parent.postMessage({ kunci: kunci, tipe: tipe, args: Array.prototype.map.call(args, format) }, "*");',
      '    } catch (e) {}',
      '  }',
      '  window.onerror = function (pesan, sumber, baris, kolom, galat) {',
      '    kirim("galat", [galat && galat.name ? galat.name + ": " + galat.message : pesan]);',
      '    return true;',
      '  };',
      '  try {',
      '    (0, eval)(kode);',
      '    kirim("selesai", []);',
      '  } catch (galat) {',
      '    if (galat && galat.macet) kirim("macet", []);',
      '    else kirim("galat", [galat && galat.name ? galat.name + ": " + galat.message : String(galat)]);',
      '  }',
      '  function ukur() { kirim("tinggi", [document.documentElement.scrollHeight]); }',
      '  setTimeout(ukur, 0);',
      '  setTimeout(ukur, 100);',
      '})();',
      '<\/script>'
    ]).join('\n');

    return awalSrcdoc.replace(/<\/body>/i, skrip + '</body>');
  }

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.kunci !== kunci) return;

    if (d.tipe === 'tinggi') {
      aturTinggiPratinjau((d.args || [])[0]);
      return;
    }
    if (d.tipe === 'simpanan') {
      var aksi = d.args || [];
      tulisSimpanan(aksi[0], aksi[1], aksi[2]);
      return;
    }
    if (d.tipe === 'macet') {
      hentikan('Kode dihentikan karena berputar tanpa henti.');
      return;
    }
    if (d.tipe === 'galat') {
      adaGalat = true;
      hentikan('Ada error. ' + (d.args || []).join(' '));
      return;
    }
    if (d.tipe === 'selesai') selesai();
  });

  /* ---------- Tombol ---------- */

  function jalankan() {
    if (timer) clearTimeout(timer);
    sudahSelesai = false;
    adaGalat = false;
    kunci = 'lab-dom-' + Math.random().toString(36).slice(2);
    status.classList.remove('lab__status--galat');
    status.textContent = 'Menjalankan kode...';
    pratinjau.style.height = '';

    timer = setTimeout(function () {
      timer = null;
      hentikan('Kode dihentikan setelah 2 detik. Periksa perulangan.');
    }, 2000);

    pratinjau.srcdoc = buatDokumen(editor.value);
  }

  tombolJalan.hidden = false;
  tombolReset.hidden = false;
  status.textContent = 'Klik Jalankan untuk melihat hasil.';

  tombolJalan.addEventListener('click', jalankan);

  tombolReset.addEventListener('click', function () {
    if (timer) clearTimeout(timer);
    timer = null;
    sudahSelesai = false;
    adaGalat = false;
    kunci = 'lab-dom-' + Math.random().toString(36).slice(2);
    editor.value = kodeAwal;
    perbarui();
    pratinjau.style.height = '';
    pratinjau.srcdoc = awalSrcdoc;
    status.classList.remove('lab__status--galat');
    status.textContent = 'Kode dikembalikan ke contoh awal.';
    editor.focus();
  });

  editor.addEventListener('input', perbarui);
  editor.addEventListener('scroll', samakanGulir);

  editor.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      editor.setRangeText('  ', editor.selectionStart, editor.selectionEnd, 'end');
      perbarui();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      jalankan();
    }
  });

  window.addEventListener('resize', aturTinggi);
  window.addEventListener('load', aturTinggi);

  perbarui();
  editor.classList.add('lab__editor--sorot');
})();
