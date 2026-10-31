/* ============================================================
   Webiko — assets/js/latihan-html.js
   Editor HTML kecil untuk latihan langsung.
   Tanpa dependency. Hanya jalan kalau halaman punya [data-lab].

   Dua bantuan di atas textarea biasa:
   1. Sorot sintaks — lapisan <pre> berwarna di belakang textarea yang
      teksnya dibuat transparan. Keduanya memakai metrik font dan padding
      yang sama (lihat .lab__sorot di style.css).
   2. Tutup tag otomatis — mengetik ">" pada <h1> menghasilkan </h1>
      dengan caret di antaranya. Tag kosong (br, img, meta, ...) tidak
      ditutup.
   ============================================================ */
(function () {
  var lab = document.querySelector('[data-lab]');
  if (!lab) return;

  var editor = lab.querySelector('[data-lab-editor]');
  var pratinjau = lab.querySelector('[data-lab-pratinjau]');
  var tombolJalan = lab.querySelector('[data-lab-jalankan]');
  var tombolReset = lab.querySelector('[data-lab-reset]');
  var status = lab.querySelector('[data-lab-status]');
  if (!editor || !pratinjau || !tombolJalan || !tombolReset || !status) return;

  var kodeAwal = editor.value;

  /* ---------- Sorot sintaks ---------- */

  function esc(teks) {
    return teks
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function bungkus(kelas, teks) {
    return '<span class="' + kelas + '">' + esc(teks) + '</span>';
  }

  /* Posisi tepat setelah ">" penutup tag. Tanda kutip dihitung supaya
     ">" di dalam atribut tidak dianggap akhir tag. */
  function akhirTag(kode, mulai) {
    var kutip = '';
    for (var i = mulai + 1; i < kode.length; i += 1) {
      var huruf = kode.charAt(i);
      if (kutip) {
        if (huruf === kutip) kutip = '';
      } else if (huruf === '"' || huruf === "'") {
        kutip = huruf;
      } else if (huruf === '>') {
        return i + 1;
      }
    }
    return kode.length;
  }

  /* Satu tag: nama tag, atribut, nilai ber-kutip, dan tanda baca. */
  function warnaiTag(tag) {
    var keluar = '';
    var namaBelumAda = true;
    var pola = /("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)|([A-Za-z_][A-Za-z0-9_:.-]*)|(\s+)|([\s\S])/g;
    var cocok;
    while ((cocok = pola.exec(tag))) {
      if (cocok[1]) {
        keluar += bungkus('tok-string', cocok[1]);
      } else if (cocok[2]) {
        if (namaBelumAda) {
          keluar += bungkus('tok-tag', cocok[2]);
          namaBelumAda = false;
        } else {
          keluar += bungkus('tok-attr', cocok[2]);
        }
      } else if (cocok[3]) {
        keluar += esc(cocok[3]);
      } else {
        keluar += bungkus('tok-punct', cocok[4]);
      }
    }
    return keluar;
  }

  /* Ubah teks HTML jadi markup berwarna. Kelas .tok-* sudah ada di
     stylesheet; teks lain dibiarkan sebagai isi biasa. */
  function warnai(kode) {
    var keluar = '';
    var pos = 0;
    while (pos < kode.length) {
      var lt = kode.indexOf('<', pos);
      if (lt === -1) {
        keluar += esc(kode.slice(pos));
        break;
      }
      keluar += esc(kode.slice(pos, lt));

      if (kode.substr(lt, 4) === '<!--') {
        var tutupKomentar = kode.indexOf('-->', lt + 4);
        var batasKomentar = tutupKomentar === -1 ? kode.length : tutupKomentar + 3;
        keluar += bungkus('tok-komentar', kode.slice(lt, batasKomentar));
        pos = batasKomentar;
        continue;
      }

      if (kode.substr(lt, 2) === '<!') {
        var batasDeklarasi = akhirTag(kode, lt);
        keluar += bungkus('tok-punct', kode.slice(lt, batasDeklarasi));
        pos = batasDeklarasi;
        continue;
      }

      var kedua = kode.charAt(lt + 1);
      var hurufTag = kedua === '/' ? kode.charAt(lt + 2) : kedua;
      if (/[A-Za-z]/.test(hurufTag)) {
        var batasTag = akhirTag(kode, lt);
        keluar += warnaiTag(kode.slice(lt, batasTag));
        pos = batasTag;
        continue;
      }

      keluar += esc('<');
      pos = lt + 1;
    }
    return keluar;
  }

  /* Lapisan berwarna di belakang textarea. Dibuat lewat DOM supaya
     halaman tanpa JavaScript tetap menampilkan textarea biasa. */
  var lapisan = document.createElement('pre');
  lapisan.className = 'lab__sorot';
  lapisan.setAttribute('aria-hidden', 'true');
  var lapisanKode = document.createElement('code');
  lapisan.append(lapisanKode);

  /* Textarea dibungkus wadah sendiri supaya lapisan hanya menutup area
     teks, bukan bar kepala panel. */
  var wadah = document.createElement('div');
  wadah.className = 'lab__editor-wrap';
  editor.parentNode.insertBefore(wadah, editor);
  wadah.append(lapisan, editor);

  /* ---------- Tinggi & gulir ---------- */

  /* Tinggi editor mengikuti jumlah baris: memanjang saat Enter menambah
     baris, menyusut saat baris dihapus. Grip tarik dimatikan di CSS, jadi
     ukurannya hanya berubah karena isinya. */
  function aturTinggi() {
    editor.style.height = 'auto';
    editor.style.height = editor.scrollHeight + 'px';
  }

  /* Gulir mendatar textarea harus ikut pindah di lapisan sorot. */
  function samakanGulir() {
    lapisan.scrollTop = editor.scrollTop;
    lapisan.scrollLeft = editor.scrollLeft;
  }

  function perbarui() {
    lapisanKode.innerHTML = warnai(editor.value);
    samakanGulir();
    aturTinggi();
  }

  /* ---------- Tutup tag otomatis ---------- */

  var TAG_KOSONG = {
    area: true, base: true, br: true, col: true, embed: true, hr: true,
    img: true, input: true, link: true, meta: true, param: true,
    source: true, track: true, wbr: true,
  };

  var sedangMenutup = false;

  /* Setelah ">" diketik, lengkapi penutupnya kalau tag-nya berisi.
     Kembalikan true bila ada teks yang disisipkan. */
  function tutupTag(e) {
    if (e.inputType !== 'insertText' || e.data !== '>') return false;
    if (editor.selectionStart !== editor.selectionEnd) return false;

    var caret = editor.selectionStart;
    var sebelum = editor.value.slice(0, caret);
    var cocok = /<([A-Za-z][A-Za-z0-9:-]*)((?:[^<>"']|"[^"]*"|'[^']*')*)>$/.exec(sebelum);
    if (!cocok) return false;

    var nama = cocok[1];
    if (TAG_KOSONG[nama.toLowerCase()]) return false;
    if (new RegExp('^</' + nama + '>', 'i').test(editor.value.slice(caret))) return false;

    var tutup = '</' + nama + '>';
    var terpasang = false;
    try {
      /* execCommand menjaga riwayat undo tetap utuh di sebagian besar
         browser; kalau tidak tersedia, pakai setRangeText. */
      terpasang = document.execCommand('insertText', false, tutup);
    } catch (err) {
      terpasang = false;
    }
    if (!terpasang) {
      editor.setRangeText(tutup, caret, caret, 'end');
    }
    editor.selectionStart = editor.selectionEnd = caret;
    return true;
  }

  /* ---------- Tombol & status ---------- */

  function tampilkan() {
    pratinjau.srcdoc = editor.value;
  }

  function jalankan(pesan) {
    tampilkan();
    status.textContent = pesan;
  }

  /* Tombol baru berguna setelah script ini siap. Tanpa JavaScript,
     tombol tetap tersembunyi dan catatan <noscript> tampil. */
  tombolJalan.hidden = false;
  tombolReset.hidden = false;

  tombolJalan.addEventListener('click', function () {
    jalankan('Pratinjau diperbarui.');
  });

  tombolReset.addEventListener('click', function () {
    editor.value = kodeAwal;
    perbarui();
    jalankan('Kode dikembalikan ke contoh awal.');
    editor.focus();
  });

  editor.addEventListener('input', function (e) {
    if (sedangMenutup) return;
    sedangMenutup = true;
    tutupTag(e);
    sedangMenutup = false;
    perbarui();
  });

  editor.addEventListener('scroll', samakanGulir);

  editor.addEventListener('keydown', function (e) {
    /* Tab menyisipkan dua spasi, bukan memindahkan fokus. */
    if (e.key === 'Tab') {
      e.preventDefault();
      editor.setRangeText('  ', editor.selectionStart, editor.selectionEnd, 'end');
      perbarui();
      return;
    }

    /* Ctrl+Enter / Cmd+Enter = jalankan. */
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      jalankan('Pratinjau diperbarui.');
    }
  });

  /* Samakan pratinjau dan lapisan sorot dengan isi editor saat halaman
     dibuka. Teks baru dibuat transparan setelah lapisan siap. */
  tampilkan();
  perbarui();
  editor.classList.add('lab__editor--sorot');
})();
