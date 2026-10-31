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

  /* ---------- Warna hex di teks kode ---------- */

  /* Hanya lab yang punya alat warna (data-lab-warna) yang mewarnai
     nilai hex. Lab HTML lain tetap memakai sorotan lama. */
  var warnaiHex = lab.hasAttribute('data-lab-warna');

  /* Warna teks hex harus tetap terbaca di atas latar editor yang
     gelap. Warna yang terlalu gelap dicerahkan secukupnya; kotak
     warna di sebelahnya tetap memakai warna asli. */
  var LATAR_KODE = [26, 27, 51];

  function uraiHex(hex) {
    var isi = hex.slice(1);
    if (isi.length === 3) {
      isi = isi[0] + isi[0] + isi[1] + isi[1] + isi[2] + isi[2];
    }
    return [
      parseInt(isi.slice(0, 2), 16),
      parseInt(isi.slice(2, 4), 16),
      parseInt(isi.slice(4, 6), 16)
    ];
  }

  function kanalLinier(nilai) {
    nilai /= 255;
    return nilai <= 0.03928
      ? nilai / 12.92
      : Math.pow((nilai + 0.055) / 1.055, 2.4);
  }

  function luminans(rgb) {
    return (
      0.2126 * kanalLinier(rgb[0]) +
      0.7152 * kanalLinier(rgb[1]) +
      0.0722 * kanalLinier(rgb[2])
    );
  }

  var LUMINANS_LATAR = luminans(LATAR_KODE);

  function rasioKontras(a, b) {
    var terang = Math.max(a, b);
    var gelap = Math.min(a, b);
    return (terang + 0.05) / (gelap + 0.05);
  }

  function duaDigit(n) {
    return ('0' + n.toString(16)).slice(-2);
  }

  function warnaTerbaca(hex) {
    var rgb = uraiHex(hex);
    if (rasioKontras(luminans(rgb), LUMINANS_LATAR) >= 4.5) return hex;

    for (var t = 0.05; t <= 1; t += 0.05) {
      var terang = [
        Math.round(rgb[0] + (255 - rgb[0]) * t),
        Math.round(rgb[1] + (255 - rgb[1]) * t),
        Math.round(rgb[2] + (255 - rgb[2]) * t)
      ];
      if (rasioKontras(luminans(terang), LUMINANS_LATAR) >= 4.5) {
        return '#' + duaDigit(terang[0]) + duaDigit(terang[1]) + duaDigit(terang[2]);
      }
    }

    return '#ffffff';
  }

  function warnaiTeks(teks) {
    if (!warnaiHex) return esc(teks);

    var hasil = '';
    var pos = 0;
    var pola = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
    var cocok;
    while ((cocok = pola.exec(teks))) {
      hasil += esc(teks.slice(pos, cocok.index));
      hasil +=
        '<span class="tok-warna" style="color:' +
        warnaTerbaca(cocok[0]) +
        '">' +
        esc(cocok[0]) +
        '</span>';
      pos = pola.lastIndex;
    }
    hasil += esc(teks.slice(pos));
    return hasil;
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
        keluar += warnaiTeks(kode.slice(pos));
        break;
      }
      keluar += warnaiTeks(kode.slice(pos, lt));

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

  /* ---------- Pemeriksaan struktur ---------- */

  var TAG_KOSONG = {
    area: true, base: true, br: true, col: true, embed: true, hr: true,
    img: true, input: true, link: true, meta: true, param: true,
    source: true, track: true, wbr: true,
  };

  /* Pecah kode jadi tag, komentar, deklarasi, dan teks biasa. Posisi
     ">" di dalam tanda kutip tidak dianggap akhir tag. */
  function tokenHtml(kode) {
    var daftar = [];
    var pos = 0;

    function tambahTeks(teks, mulai) {
      if (teks) daftar.push({ jenis: 'teks', teks: teks, mulai: mulai });
    }

    while (pos < kode.length) {
      var lt = kode.indexOf('<', pos);
      if (lt === -1) {
        tambahTeks(kode.slice(pos), pos);
        break;
      }
      if (lt > pos) tambahTeks(kode.slice(pos, lt), pos);

      if (kode.substr(lt, 4) === '<!--') {
        var akhirKomentar = kode.indexOf('-->', lt + 4);
        var batasKomentar = akhirKomentar === -1 ? kode.length : akhirKomentar + 3;
        daftar.push({ jenis: 'komentar', teks: kode.slice(lt, batasKomentar), mulai: lt });
        pos = batasKomentar;
        continue;
      }

      if (kode.substr(lt, 2) === '<!') {
        var batasDeklarasi = akhirTag(kode, lt);
        daftar.push({ jenis: 'deklarasi', teks: kode.slice(lt, batasDeklarasi), mulai: lt });
        pos = batasDeklarasi;
        continue;
      }

      var batasTag = akhirTag(kode, lt);
      var potong = kode.slice(lt, batasTag);
      var cocok = /^<\s*(\/?)\s*([A-Za-z][A-Za-z0-9:-]*)/.exec(potong);
      if (!cocok) {
        tambahTeks('<', lt);
        pos = lt + 1;
        continue;
      }

      daftar.push({
        jenis: cocok[1] ? 'tutup' : 'buka',
        nama: cocok[2].toLowerCase(),
        teks: potong,
        mulai: lt,
      });
      pos = batasTag;
    }
    return daftar;
  }

  function nomorBaris(kode, posisi) {
    return kode.slice(0, posisi).split('\n').length;
  }

  function ringkasTeks(teks) {
    var rapi = teks.replace(/\s+/g, ' ').trim();
    return rapi.length > 32 ? rapi.slice(0, 32) + '...' : rapi;
  }

  function sebutToken(t) {
    if (t.jenis === 'teks') return 'Teks "' + ringkasTeks(t.teks) + '"';
    return '<' + t.nama + '>';
  }

  /* Token pertama yang bukan spasi/komentar di antara dua penanda. */
  function isiAntara(daftar, awal, akhir) {
    var dari = daftar.indexOf(awal);
    var sampai = daftar.indexOf(akhir);
    if (dari === -1 || sampai === -1 || dari >= sampai) return null;
    for (var i = dari + 1; i < sampai; i += 1) {
      var t = daftar[i];
      if (t.jenis === 'komentar') continue;
      if (t.jenis === 'teks' && !/\S/.test(t.teks)) continue;
      return t;
    }
    return null;
  }

  /* Kembalikan { pesan } bila kode belum layak dijalankan, atau null. */
  function periksaStruktur(kode) {
    var daftar = tokenHtml(kode);
    var tumpukan = [];
    var htmlBuka = null;
    var htmlTutup = null;
    var headBuka = null;
    var headTutup = null;
    var bodyBuka = null;
    var bodyTutup = null;
    var adaDoctype = false;
    var i;
    var t;

    for (i = 0; i < daftar.length; i += 1) {
      t = daftar[i];
      if (t.jenis === 'deklarasi' && /^<!doctype\s+html/i.test(t.teks)) {
        adaDoctype = true;
      }

      if (t.jenis === 'buka') {
        if (t.nama === 'html' && !htmlBuka) htmlBuka = t;
        if (t.nama === 'head' && !headBuka) headBuka = t;
        if (t.nama === 'body' && !bodyBuka) bodyBuka = t;
        if (TAG_KOSONG[t.nama] || /\/\s*>$/.test(t.teks)) continue;
        tumpukan.push(t);
      } else if (t.jenis === 'tutup') {
        if (t.nama === 'html' && !htmlTutup) htmlTutup = t;
        if (t.nama === 'head' && !headTutup) headTutup = t;
        if (t.nama === 'body' && !bodyTutup) bodyTutup = t;

        if (TAG_KOSONG[t.nama]) {
          return { pesan: 'Baris ' + nomorBaris(kode, t.mulai) + ': <' + t.nama + '> adalah tag kosong, jadi tidak perlu ditutup dengan </' + t.nama + '>.' };
        }

        var cocok = -1;
        for (var j = tumpukan.length - 1; j >= 0; j -= 1) {
          if (tumpukan[j].nama === t.nama) {
            cocok = j;
            break;
          }
        }

        if (cocok === -1) {
          return { pesan: 'Baris ' + nomorBaris(kode, t.mulai) + ': ada </' + t.nama + '> tanpa <' + t.nama + '> pembuka. Hapus tag penutup itu atau tambahkan pembukanya.' };
        }

        if (cocok < tumpukan.length - 1) {
          var belum = tumpukan[cocok + 1];
          return { pesan: 'Baris ' + nomorBaris(kode, t.mulai) + ': </' + t.nama + '> muncul sebelum <' + belum.nama + '> ditutup. Tambahkan </' + belum.nama + '> lebih dulu.' };
        }

        tumpukan.pop();
      }
    }

    if (tumpukan.length) {
      var terbuka = tumpukan[tumpukan.length - 1];
      return { pesan: 'Baris ' + nomorBaris(kode, terbuka.mulai) + ': <' + terbuka.nama + '> belum ditutup. Tambahkan </' + terbuka.nama + '> sebelum tag penutup berikutnya.' };
    }

    if (!adaDoctype) {
      return { pesan: 'Tambahkan <!DOCTYPE html> di baris paling atas supaya browser membuka halaman dalam mode standar.' };
    }

    if (!htmlBuka) {
      return { pesan: 'Halaman belum punya <html>. Bungkus seluruh kode dengan <html> ... </html>.' };
    }

    if (!headBuka) {
      return { pesan: 'Halaman belum punya <head>. Tambahkan <head> ... </head> di dalam <html>, sebelum <body>.' };
    }

    if (!bodyBuka) {
      return { pesan: 'Halaman belum punya <body>. Tambahkan <body> sesudah </head>, lalu taruh isi halaman di dalamnya.' };
    }

    var sebelumHead = isiAntara(daftar, htmlBuka, headBuka);
    if (sebelumHead) {
      return { pesan: 'Baris ' + nomorBaris(kode, sebelumHead.mulai) + ': ' + sebutToken(sebelumHead) + ' berada sebelum <head>. Urutannya: <html>, lalu <head>, lalu <body>.' };
    }

    var antaraHeadBody = isiAntara(daftar, headTutup, bodyBuka);
    if (antaraHeadBody) {
      return { pesan: 'Baris ' + nomorBaris(kode, antaraHeadBody.mulai) + ': ' + sebutToken(antaraHeadBody) + ' berada di antara </head> dan <body>, jadi belum masuk ke halaman. Pindahkan isinya ke dalam <body>, sesudah <body> dan sebelum </body>.' };
    }

    var sesudahBody = isiAntara(daftar, bodyTutup, htmlTutup);
    if (sesudahBody) {
      return { pesan: 'Baris ' + nomorBaris(kode, sesudahBody.mulai) + ': ' + sebutToken(sesudahBody) + ' berada setelah </body>. Pindahkan isinya ke dalam <body>, sebelum </body>.' };
    }

    if (htmlTutup) {
      var sesudahHtml = null;
      for (i = daftar.indexOf(htmlTutup) + 1; i < daftar.length; i += 1) {
        t = daftar[i];
        if (t.jenis === 'komentar') continue;
        if (t.jenis === 'teks' && !/\S/.test(t.teks)) continue;
        sesudahHtml = t;
        break;
      }
      if (sesudahHtml) {
        return { pesan: 'Baris ' + nomorBaris(kode, sesudahHtml.mulai) + ': ' + sebutToken(sesudahHtml) + ' berada setelah </html>. Pindahkan isinya ke dalam <body>.' };
      }
    }

    return null;
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

  /* ---------- Inden otomatis ---------- */

  var INDEN = '  ';

  /* Daftar tag yang masih terbuka tepat sebelum posisi tertentu. Tag
     penutup yang tidak berpasangan diabaikan supaya inden tidak
     melompat jauh saat kode belum lengkap. */
  function tumpukanTerbuka(kode) {
    var daftar = tokenHtml(kode);
    var tumpukan = [];

    for (var i = 0; i < daftar.length; i += 1) {
      var t = daftar[i];
      if (t.jenis === 'buka') {
        if (!TAG_KOSONG[t.nama] && !/\/\s*>$/.test(t.teks)) tumpukan.push(t);
      } else if (t.jenis === 'tutup') {
        for (var j = tumpukan.length - 1; j >= 0; j -= 1) {
          if (tumpukan[j].nama === t.nama) {
            tumpukan.length = j;
            break;
          }
        }
      }
    }

    return tumpukan;
  }

  /* Isi <html> dan <head>/<body> ditulis rata kiri pada contoh materi,
     jadi <html> tidak dihitung sebagai satu tingkat inden. */
  function kedalamanInden(kode) {
    var tumpukan = tumpukanTerbuka(kode);
    var jumlah = 0;
    for (var i = 0; i < tumpukan.length; i += 1) {
      if (tumpukan[i].nama !== 'html') jumlah += 1;
    }
    return jumlah;
  }

  /* Enter menambah baris dengan inden sesuai sarang tag. Kalau caret
     tepat sebelum tag penutup, tag itu didorong ke baris sendiri dan
     diletakkan satu tingkat lebih luar. */
  function sisipkanInden() {
    var caret = editor.selectionStart;
    if (caret !== editor.selectionEnd) return false;

    var kode = editor.value;
    var sebelum = kode.slice(0, caret);
    var lt = sebelum.lastIndexOf('<');
    var gt = sebelum.lastIndexOf('>');

    /* Jangan ganggu Enter yang ditekan di tengah tag. */
    if (lt > gt) return false;

    var sesudah = kode.slice(caret);
    var barisSesudah = sesudah.split('\n')[0];
    var barisSebelum = sebelum.slice(sebelum.lastIndexOf('\n') + 1);
    var diAkhirBaris = !/\S/.test(barisSesudah);
    var sebelumPenutup = /^\s*<\//.test(barisSesudah);
    var indentBaris = /^\s*/.exec(barisSebelum)[0];

    var indent;
    var tambahan;
    var posisiKursor = caret + 1;

    var diAwalBaris = caret === sebelum.lastIndexOf('\n') + 1;

    if (diAwalBaris && /^<\//.test(sesudah)) {
      /* Caret sudah di awal baris yang hanya berisi tag penutup:
         baris baru cukup disisipkan sebelum tag itu. */
      indent = INDEN.repeat(kedalamanInden(sebelum));
      tambahan = indent + '\n';
      posisiKursor = caret + indent.length;
    } else if (/^<\//.test(sesudah) && /\S/.test(barisSebelum)) {
      /* Tag penutup menempel tepat setelah isi baris (hasil tutup tag
         otomatis): isi masuk satu tingkat, penutup kembali sejajar
         dengan baris pembukanya. */
      indent = indentBaris + INDEN;
      tambahan = '\n' + indent + '\n' + indentBaris;
      posisiKursor = caret + 1 + indent.length;
    } else {
      if (!diAkhirBaris && !sebelumPenutup) {
        /* Memecah teks di tengah baris: pertahankan inden baris itu. */
        indent = indentBaris;
      } else {
        indent = INDEN.repeat(kedalamanInden(sebelum));
      }
      tambahan = '\n' + indent;
      posisiKursor = caret + 1 + indent.length;
    }

    var terpasang = false;
    try {
      terpasang = document.execCommand('insertText', false, tambahan);
    } catch (err) {
      terpasang = false;
    }
    if (!terpasang) {
      editor.setRangeText(tambahan, caret, caret, 'end');
    }

    editor.selectionStart = editor.selectionEnd = posisiKursor;
    perbarui();
    return true;
  }

  /* ---------- Tombol & status ---------- */

  /* Pratinjau memakai font sans dari token halaman, bukan serif bawaan
     browser. Gaya disisipkan ke dalam srcdoc karena iframe tidak
     mewarisi stylesheet induknya. */
  var fontPratinjau = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-sans')
    .trim();
  var warnaKartu = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-lab-card')
    .trim() || '#ffffff';
  var pakaiKartu = lab.hasAttribute('data-lab-kartu');

  function tampilkan() {
    var aturan = 'body{font-family:' + fontPratinjau + ';}';

    /* Lab HTML memakai body sebagai kartu demo. Tidak ada elemen
       pembungkus tambahan, jadi struktur HTML yang ditulis siswa tetap
       utuh. Warna dan jarak sama dengan kartu lab CSS. */
    if (pakaiKartu) {
      aturan +=
        'html{background-color:#ffffff;}' +
        'body{margin:0;padding:1rem;' +
        'background-color:' + warnaKartu + ';color:#1a1b33;}' +
        'h1{margin-top:0;}';
    }

    var gaya = '<style>' + aturan + '</style>';
    var kode = editor.value;

    if (/<head(\s[^>]*)?>/i.test(kode)) {
      kode = kode.replace(/<head(\s[^>]*)?>/i, function (cocok) {
        return cocok + gaya;
      });
    } else if (/<body(\s[^>]*)?>/i.test(kode)) {
      kode = kode.replace(/<body(\s[^>]*)?>/i, function (cocok) {
        return cocok + gaya;
      });
    } else {
      kode = gaya + kode;
    }

    pratinjau.srcdoc = kode;
  }

  /* Pratinjau memanjang mengikuti isinya, bukan bergulir di dalam kotak
     tetap. Tinggi hanya bisa dibaca karena iframe mengizinkan
     same-origin; script di dalam pratinjau tetap dilarang sandbox. */
  function aturTinggiPratinjau() {
    var isi;
    try {
      isi = pratinjau.contentDocument;
    } catch (err) {
      return;
    }
    if (!isi || !isi.documentElement) return;

    /* Kecilkan dulu supaya scrollHeight mengikuti isi, bukan tinggi
       iframe sebelumnya. min-height 240px tetap menjadi batas bawah. */
    pratinjau.style.height = '0px';
    var tinggi = isi.documentElement.scrollHeight;
    if (tinggi > 0) pratinjau.style.height = tinggi + 'px';
  }

  pratinjau.addEventListener('load', aturTinggiPratinjau);
  window.addEventListener('resize', aturTinggiPratinjau);

  var kotakPeringatan = null;
  var teksPeringatan = null;

  function siapkanPeringatan() {
    if (kotakPeringatan) return;

    kotakPeringatan = document.createElement('div');
    kotakPeringatan.className = 'alert alert--warning lab__peringatan';
    kotakPeringatan.setAttribute('role', 'alert');
    kotakPeringatan.hidden = true;

    var isi = document.createElement('div');
    var judul = document.createElement('span');
    judul.className = 'alert__title';
    judul.textContent = 'Kode belum bisa dijalankan';
    teksPeringatan = document.createElement('p');
    teksPeringatan.className = 'alert__text';

    isi.append(judul, teksPeringatan);
    kotakPeringatan.append(isi);

    var meja = lab.querySelector('.lab__meja');
    meja.parentNode.insertBefore(kotakPeringatan, meja.nextSibling);
  }

  function tampilkanPeringatan(pesan) {
    siapkanPeringatan();
    if (teksPeringatan.textContent !== pesan) teksPeringatan.textContent = pesan;
    kotakPeringatan.hidden = false;
    tombolJalan.disabled = true;
    status.textContent = 'Perbaiki kode dulu, lalu klik Jalankan.';
    status.classList.add('lab__status--galat');
  }

  function sembunyikanPeringatan() {
    if (kotakPeringatan) kotakPeringatan.hidden = true;
    tombolJalan.disabled = false;
    status.classList.remove('lab__status--galat');
  }

  function jalankan(pesan) {
    var galat = periksaStruktur(editor.value);
    if (galat) {
      tampilkanPeringatan(galat.pesan);
      return;
    }
    sembunyikanPeringatan();
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

    /* Kalau peringatan sedang tampil, periksa ulang supaya hilang
       sendiri begitu kodenya diperbaiki. */
    if (kotakPeringatan && !kotakPeringatan.hidden) {
      var galat = periksaStruktur(editor.value);
      if (galat) {
        tampilkanPeringatan(galat.pesan);
      } else {
        sembunyikanPeringatan();
        status.textContent = 'Kode sudah benar. Klik Jalankan untuk melihat hasilnya.';
      }
    }
  });

  editor.addEventListener('scroll', samakanGulir);

  /* Font bisa selesai dimuat setelah halaman digambar; ukur ulang
     supaya tinggi editor tidak tertinggal dari isinya. */
  window.addEventListener('load', aturTinggi);

  editor.addEventListener('keydown', function (e) {
    /* Tab menyisipkan dua spasi, bukan memindahkan fokus. */
    if (e.key === 'Tab') {
      e.preventDefault();
      editor.setRangeText('  ', editor.selectionStart, editor.selectionEnd, 'end');
      perbarui();
      return;
    }

    /* Enter biasa menambah baris dengan inden otomatis. Shift+Enter
       dibiarkan apa adanya. */
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (sisipkanInden()) e.preventDefault();
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
  aturTinggi();
  editor.classList.add('lab__editor--sorot');
})();
