/* ============================================================
   Webiko — assets/js/latihan-js.js
   Editor JavaScript kecil untuk latihan langsung.
   Tanpa dependency. Hanya jalan kalau halaman punya [data-lab-js].

   Kode siswa dijalankan di Web Worker, bukan di halaman utama:
   - tidak bisa menyentuh DOM atau localStorage halaman;
   - bisa dihentikan kalau berputar tanpa henti;
   - console.log dan error dikirim ke panel Keluaran.
   ============================================================ */
(function () {
  var lab = document.querySelector('[data-lab-js]');
  if (!lab) return;

  var editor = lab.querySelector('[data-lab-editor]');
  var keluaran = lab.querySelector('[data-lab-keluaran]');
  var tombolJalan = lab.querySelector('[data-lab-jalankan]');
  var tombolReset = lab.querySelector('[data-lab-reset]');
  var status = lab.querySelector('[data-lab-status]');
  if (!editor || !keluaran || !tombolJalan || !tombolReset || !status) return;

  var kodeAwal = editor.value;
  var worker = null;
  var timer = null;
  var jumlahBaris = 0;
  var adaGalat = false;

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

  /* Lapisan berwarna di belakang textarea, sama seperti lab HTML/CSS.
     Dibuat lewat DOM supaya halaman tanpa JavaScript tetap menampilkan
     textarea biasa. */
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

  /* ---------- Panel keluaran ---------- */

  function bersihkan(pesan) {
    keluaran.textContent = '';
    jumlahBaris = 0;
    adaGalat = false;
    if (pesan) {
      var kosong = document.createElement('span');
      kosong.className = 'lab__keluaran-baris lab__keluaran-kosong';
      kosong.textContent = pesan;
      keluaran.append(kosong);
    }
  }

  function tambahBaris(teks, jenis) {
    var baris = document.createElement('span');
    baris.className = 'lab__keluaran-baris';
    if (jenis) baris.className += ' lab__keluaran-baris--' + jenis;
    baris.textContent = teks;
    keluaran.append(baris);
    jumlahBaris += 1;
  }

  function selesai(pesan) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (worker) {
      worker.terminate();
      worker = null;
    }
    if (!jumlahBaris) {
      tambahBaris('Program selesai tanpa keluaran. Tambahkan console.log(...).', 'kosong');
    }
    status.classList.remove('lab__status--galat');
    if (adaGalat) {
      status.classList.add('lab__status--galat');
      status.textContent = 'Ada error. Baca pesan di panel keluaran.';
    } else {
      status.textContent = 'Selesai. ' + jumlahBaris + ' baris keluaran.';
    }
    if (pesan) status.textContent = pesan;
  }

  /* ---------- Worker ---------- */

  var sumberWorker = [
    'function format(nilai) {',
    '  if (typeof nilai === "string") return nilai;',
    '  if (typeof nilai === "undefined") return "undefined";',
    '  if (nilai === null) return "null";',
    '  if (nilai instanceof Error) return nilai.name + ": " + nilai.message;',
    '  if (typeof nilai === "object") {',
    '    try { return JSON.stringify(nilai); } catch (err) { return String(nilai); }',
    '  }',
    '  return String(nilai);',
    '}',
    'function kirim(tipe, args) {',
    '  postMessage({ tipe: tipe, args: Array.prototype.map.call(args, format) });',
    '}',
    'console.log = function () { kirim("log", arguments); };',
    'console.info = console.log;',
    'console.warn = function () { kirim("peringatan", arguments); };',
    'console.error = function () { kirim("galat", arguments); };',
    'self.onmessage = function (e) {',
    '  try {',
    '    (0, eval)(e.data);',
    '    postMessage({ tipe: "selesai" });',
    '  } catch (err) {',
    '    postMessage({ tipe: "galat", akhir: true, args: [err && err.name ? err.name + ": " + err.message : String(err)] });',
    '  }',
    '};'
  ].join('\n');
  var urlWorker = URL.createObjectURL(new Blob([sumberWorker], { type: 'text/javascript' }));

  function jalankan() {
    if (worker) worker.terminate();
    if (timer) clearTimeout(timer);
    bersihkan('');
    status.classList.remove('lab__status--galat');
    status.textContent = 'Menjalankan kode...';

    try {
      worker = new Worker(urlWorker);
    } catch (err) {
      tambahBaris('Browser tidak bisa menjalankan lab: ' + err.message, 'galat');
      adaGalat = true;
      selesai();
      return;
    }

    worker.onmessage = function (e) {
      var d = e.data || {};
      if (d.tipe === 'selesai') {
        selesai();
        return;
      }
      if (d.tipe === 'galat') {
        adaGalat = true;
        tambahBaris((d.args || []).join(' '), 'galat');
        if (d.akhir) selesai();
        return;
      }
      var jenis = d.tipe === 'peringatan' ? 'peringatan' : '';
      tambahBaris((d.args || []).join(' '), jenis);
    };

    worker.onerror = function (e) {
      adaGalat = true;
      tambahBaris(e.message || 'Error di worker.', 'galat');
      selesai();
    };

    timer = setTimeout(function () {
      if (worker) {
        worker.terminate();
        worker = null;
      }
      tambahBaris('Kode dihentikan setelah 2 detik. Periksa perulangan.', 'galat');
      adaGalat = true;
      selesai();
    }, 2000);

    worker.postMessage(editor.value);
  }

  /* ---------- Tombol & papan ketik ---------- */

  tombolJalan.hidden = false;
  tombolReset.hidden = false;
  bersihkan('Klik Jalankan untuk melihat hasil.');

  tombolJalan.addEventListener('click', jalankan);

  tombolReset.addEventListener('click', function () {
    if (worker) worker.terminate();
    if (timer) clearTimeout(timer);
    worker = null;
    timer = null;
    editor.value = kodeAwal;
    perbarui();
    bersihkan('Klik Jalankan untuk melihat hasil.');
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
  /* Font bisa selesai dimuat setelah script jalan; ukur ulang tinggi. */
  window.addEventListener('load', aturTinggi);

  perbarui();
  editor.classList.add('lab__editor--sorot');
})();
