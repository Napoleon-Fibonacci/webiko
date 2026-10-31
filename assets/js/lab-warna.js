/* Alat warna editor latihan CSS.
   Kotak kecil tepat sebelum nilai hex, di tengah spasi setelah titik
   dua. Klik kotak membuka pemilih warna bawaan browser; nilai hex di
   kode langsung diganti. Kalau nilainya belum lengkap (mis. #ab),
   kotak berubah jadi tombol bergaris bertanda + sebagai alat bantu.
   Hanya aktif di lab bertanda data-lab-warna. */
(function () {
  var lab = document.querySelector('[data-lab][data-lab-warna]');
  if (!lab) return;

  var editor = lab.querySelector('[data-lab-editor]');
  var lapisan = lab.querySelector('.lab__sorot');
  var wadah = lab.querySelector('.lab__editor-wrap');
  var reset = lab.querySelector('[data-lab-reset]');
  var status = lab.querySelector('[data-lab-status]');
  if (!editor || !lapisan || !wadah) return;

  /* Ukuran kotak mengikuti --space-3 di CSS. */
  var KOTAK = 12;
  /* Jumlah spasi sebelum hex supaya ada celah di kiri dan kanan. */
  var SPASI_WARNA = 3;

  var POLA = /#[0-9a-fA-F]*/g;

  var layer = document.createElement('div');
  layer.className = 'lab__warna-layer';
  wadah.append(layer);

  var input = document.createElement('input');
  input.type = 'color';
  input.className = 'lab__warna-input';
  input.tabIndex = -1;
  input.setAttribute('aria-hidden', 'true');
  wadah.append(input);

  var sasaran = null;

  function hexPenuh(hex) {
    if (hex.length === 4) {
      return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    if (hex.length > 7) return hex.slice(0, 7);
    return (hex + '000000').slice(0, 7);
  }

  function rentangTeks(akar, mulai, akhir) {
    var walker = document.createTreeWalker(akar, NodeFilter.SHOW_TEXT);
    var pos = 0;
    var nodeAwal = null;
    var offsetAwal = 0;
    var nodeAkhir = null;
    var offsetAkhir = 0;
    while (walker.nextNode()) {
      var node = walker.currentNode;
      var panjang = node.nodeValue.length;
      if (!nodeAwal && mulai <= pos + panjang) {
        nodeAwal = node;
        offsetAwal = mulai - pos;
      }
      if (!nodeAkhir && akhir <= pos + panjang) {
        nodeAkhir = node;
        offsetAkhir = akhir - pos;
        break;
      }
      pos += panjang;
    }
    if (!nodeAwal || !nodeAkhir) return null;
    var r = document.createRange();
    r.setStart(nodeAwal, offsetAwal);
    r.setEnd(nodeAkhir, offsetAkhir);
    return r;
  }

  /* Anggap # sebagai awal warna kalau posisinya di dalam nilai
     deklarasi: ada titik dua setelah { atau ; terakhir di baris itu.
     Ini menangkap color: #abc dan border: 1px solid #abc, tetapi tidak
     #id di selector. */
  function dalamDeklarasi(kode, posisi) {
    var awalBaris = kode.lastIndexOf('\n', posisi - 1) + 1;
    var sebelum = kode.slice(awalBaris, posisi);
    var titikDua = sebelum.lastIndexOf(':');
    if (titikDua === -1) return false;
    return (
      titikDua > sebelum.lastIndexOf('{') &&
      titikDua > sebelum.lastIndexOf(';')
    );
  }

  /* Lebar spasi diukur dari ujung glyph sebelumnya sampai #, bukan
     dari Range spasi: Range memangkas spasi di ujung baris. */
  function posisiKotak(kode, mulai, rect) {
    var i = mulai;
    var jumlahSpasi = 0;
    while (i > 0) {
      var c = kode.charAt(i - 1);
      if (c !== ' ' && c !== '\t') break;
      i -= 1;
      jumlahSpasi += 1;
    }
    if (jumlahSpasi < 2 || i === 0) return null;

    var sebelum = rentangTeks(lapisan, i - 1, i);
    if (!sebelum) return null;
    var sebelumRect = sebelum.getBoundingClientRect();
    var lebar = rect.left - sebelumRect.right;
    if (!sebelumRect.height || lebar <= 0) return null;
    return sebelumRect.right + (lebar - KOTAK) / 2;
  }

  function gambar() {
    layer.textContent = '';

    var kode = editor.value;
    var wrapRect = wadah.getBoundingClientRect();
    var baris = {};
    var barisBantu = {};
    var cocok;
    POLA.lastIndex = 0;
    while ((cocok = POLA.exec(kode))) {
      var hex = cocok[0];
      var jumlah = hex.length - 1;
      var penuh = jumlah === 3 || jumlah === 6;
      if (!penuh && (jumlah > 5 || !dalamDeklarasi(kode, cocok.index))) {
        continue;
      }

      var mulai = cocok.index;
      var akhir = mulai + hex.length;
      var nomorBaris = kode.slice(0, mulai).split('\n').length;

      /* Satu kotak warna per baris; alat bantu punya kotaknya sendiri
         selama baris itu belum punya alat bantu. */
      if (penuh) {
        if (baris[nomorBaris]) continue;
        baris[nomorBaris] = true;
      } else {
        if (barisBantu[nomorBaris]) continue;
        barisBantu[nomorBaris] = true;
      }

      var r = rentangTeks(lapisan, mulai, akhir);
      if (!r) continue;
      var rect = r.getBoundingClientRect();
      if (!rect.height) continue;

      var kiri = posisiKotak(kode, mulai, rect);
      if (kiri === null) {
        /* Tidak cukup ruang: teks hex tetap diwarnai, kotak tidak
           dipaksa menimpa kode di sebelahnya. */
        continue;
      }
      kiri -= wrapRect.left;
      var atas = rect.top - wrapRect.top + (rect.height - KOTAK) / 2;
      if (kiri + KOTAK < 0 || kiri > wrapRect.width) continue;
      if (atas < -KOTAK || atas > wrapRect.height) continue;

      var tombol = document.createElement('button');
      tombol.type = 'button';
      tombol.className = 'lab__warna' + (penuh ? '' : ' lab__warna--bantu');
      tombol.style.left = kiri + 'px';
      tombol.style.top = atas + 'px';
      if (penuh) tombol.style.backgroundColor = hex;
      tombol.dataset.mulai = mulai;
      tombol.dataset.akhir = akhir;
      tombol.dataset.warna = hex;
      tombol.setAttribute(
        'aria-label',
        penuh
          ? 'Ubah warna ' + hex + ' pada baris ' + nomorBaris
          : 'Pilih warna pada baris ' + nomorBaris
      );
      tombol.title = penuh
        ? 'Klik untuk mengganti ' + hex
        : 'Klik untuk memilih warna';
      tombol.addEventListener('click', function () {
        sasaran = {
          mulai: Number(this.dataset.mulai),
          akhir: Number(this.dataset.akhir),
          teks: this.dataset.warna
        };
        input.value = hexPenuh(this.dataset.warna);

        /* Pemilih warna muncul dekat kotak yang diklik, bukan di
           sudut panel. */
        input.style.top = this.offsetTop + 'px';
        input.style.left = this.offsetLeft + 'px';

        if (input.showPicker) {
          try {
            input.showPicker();
            return;
          } catch (e) {
            /* Jatuh ke klik biasa. */
          }
        }
        input.click();
      });
      layer.append(tombol);
    }
  }

  var menunggu = false;
  function jadwalkan() {
    if (menunggu) return;
    menunggu = true;
    requestAnimationFrame(function () {
      menunggu = false;
      gambar();
    });
  }

  /* Saat siswa mengetik # setelah titik dua, rapikan menjadi tiga
     spasi supaya kotak warna punya ruang di kedua sisi. */
  function rapikanRuang() {
    var a = editor.selectionStart;
    if (a !== editor.selectionEnd) return;
    if (a === 0 || editor.value.charAt(a - 1) !== '#') return;
    var i = a - 1;
    var jumlah = 0;
    while (i > 0) {
      var c = editor.value.charAt(i - 1);
      if (c !== ' ' && c !== '\t') break;
      i -= 1;
      jumlah += 1;
    }
    if (jumlah >= SPASI_WARNA) return;
    if (!dalamDeklarasi(editor.value, i)) return;
    editor.setRangeText('   ', i, i + jumlah, 'preserve');
    var pos = a - jumlah + SPASI_WARNA;
    editor.setSelectionRange(pos, pos);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }

  input.addEventListener('input', function () {
    if (!sasaran) return;
    var teks = editor.value;
    if (teks.slice(sasaran.mulai, sasaran.akhir) !== sasaran.teks) {
      sasaran = null;
      jadwalkan();
      return;
    }
    editor.setRangeText(input.value, sasaran.mulai, sasaran.akhir, 'end');
    sasaran = {
      mulai: sasaran.mulai,
      akhir: sasaran.mulai + input.value.length,
      teks: input.value
    };
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    if (status && !status.classList.contains('lab__status--galat')) {
      status.textContent = 'Warna diganti. Klik Jalankan untuk melihat hasilnya.';
    }
    jadwalkan();
  });

  editor.addEventListener('input', function () {
    rapikanRuang();
    jadwalkan();
  });
  editor.addEventListener('scroll', jadwalkan);
  window.addEventListener('resize', jadwalkan);
  if (reset) {
    reset.addEventListener('click', function () {
      setTimeout(jadwalkan, 0);
    });
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(jadwalkan);
  }

  jadwalkan();
})();
