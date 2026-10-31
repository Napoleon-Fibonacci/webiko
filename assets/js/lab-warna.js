/* Alat warna editor latihan CSS.
   Kotak kecil di padding kiri editor, satu per baris yang punya nilai
   hex. Klik kotak membuka pemilih warna bawaan browser; nilai hex di
   kode langsung diganti. Hanya aktif di lab bertanda data-lab-warna. */
(function () {
  var lab = document.querySelector('[data-lab][data-lab-warna]');
  if (!lab) return;

  var editor = lab.querySelector('[data-lab-editor]');
  var lapisan = lab.querySelector('.lab__sorot');
  var wadah = lab.querySelector('.lab__editor-wrap');
  var reset = lab.querySelector('[data-lab-reset]');
  var status = lab.querySelector('[data-lab-status]');
  if (!editor || !lapisan || !wadah) return;

  /* Penanda untuk CSS. Tanpa JavaScript atribut ini tidak pernah
     dipasang, jadi padding editor tidak melebar sia-sia. */
  lab.classList.add('lab--warna');

  var POLA = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;

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
    return hex;
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

  function gambar() {
    layer.textContent = '';

    /* Saat kode digeser mendatar, teks masuk ke area padding kiri.
       Sembunyikan kotak supaya tidak menimpa kode. */
    if (editor.scrollLeft > 0) return;

    var kode = editor.value;
    var wrapRect = wadah.getBoundingClientRect();
    var baris = {};
    var cocok;
    POLA.lastIndex = 0;
    while ((cocok = POLA.exec(kode))) {
      var mulai = cocok.index;
      var akhir = mulai + cocok[0].length;
      var nomorBaris = kode.slice(0, mulai).split('\n').length;
      if (baris[nomorBaris]) continue;
      baris[nomorBaris] = true;
      var r = rentangTeks(lapisan, mulai, akhir);
      if (!r) continue;
      var rect = r.getBoundingClientRect();
      if (!rect.height) continue;
      var atas = rect.top - wrapRect.top + (rect.height - 16) / 2;
      if (atas < -16 || atas > wrapRect.height) continue;
      var tombol = document.createElement('button');
      tombol.type = 'button';
      tombol.className = 'lab__warna';
      tombol.style.top = atas + 'px';
      tombol.style.backgroundColor = cocok[0];
      tombol.dataset.mulai = mulai;
      tombol.dataset.akhir = akhir;
      tombol.dataset.warna = cocok[0];
      tombol.setAttribute(
        'aria-label',
        'Ubah warna ' + cocok[0] + ' pada baris ' + nomorBaris
      );
      tombol.title = 'Klik untuk mengganti ' + cocok[0];
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

  editor.addEventListener('input', jadwalkan);
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
