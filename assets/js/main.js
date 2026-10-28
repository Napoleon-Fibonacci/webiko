/* ============================================================
   Web Guide — assets/js/main.js
   Script utama. Vanilla JavaScript, tanpa build step.
   ============================================================ */

/* Toggle menu navbar di layar kecil (< 768px). */
document.querySelectorAll('.navbar').forEach(function (navbar) {
  var toggle = navbar.querySelector('.navbar__toggle');
  if (!toggle) return;

  toggle.addEventListener('click', function () {
    var open = navbar.hasAttribute('data-open');
    if (open) {
      navbar.removeAttribute('data-open');
    } else {
      navbar.setAttribute('data-open', '');
    }
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Buka menu' : 'Tutup menu');
  });

  // Tutup menu setelah salah satu tautan dipilih.
  navbar.querySelectorAll('.navbar__link').forEach(function (link) {
    link.addEventListener('click', function () {
      navbar.removeAttribute('data-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Buka menu');
    });
  });
});
