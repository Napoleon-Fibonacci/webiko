/* ============================================================
   Web Guide — assets/js/main.js
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
