/* ============================================================
   Webiko — api/sesi.js
   GET -> status sesi admin yang sedang aktif.
   ============================================================ */
const { json, sesiDari } = require("./_lib");

module.exports = (req, res) => {
  const sesi = sesiDari(req);
  if (!sesi) return json(res, 200, { masuk: false });
  return json(res, 200, { masuk: true, nama: sesi.nama });
};
