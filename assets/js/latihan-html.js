/* ============================================================
   Webiko — assets/js/latihan-html.js
   Editor HTML kecil untuk latihan langsung.
   Tanpa dependency. Hanya jalan kalau halaman punya [data-lab].
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
    jalankan('Kode dikembalikan ke contoh awal.');
    editor.focus();
  });

  editor.addEventListener('keydown', function (e) {
    /* Tab menyisipkan dua spasi, bukan memindahkan fokus. */
    if (e.key === 'Tab') {
      e.preventDefault();
      editor.setRangeText('  ', editor.selectionStart, editor.selectionEnd, 'end');
      return;
    }

    /* Ctrl+Enter / Cmd+Enter = jalankan. */
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      jalankan('Pratinjau diperbarui.');
    }
  });

  /* Samakan pratinjau dengan isi editor saat halaman dibuka. */
  tampilkan();
})();
