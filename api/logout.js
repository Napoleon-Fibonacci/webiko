/* ============================================================
   Webiko — api/logout.js
   POST -> hapus cookie sesi dan catat keluar.
   ============================================================ */
const {
  json,
  sesiDari,
  hapusCookie,
  tulisLog,
  kirimBot,
  wajibPost,
} = require("./_lib");

module.exports = async (req, res) => {
  if (!wajibPost(req, res)) return;
  const sesi = sesiDari(req);
  hapusCookie(res);
  if (sesi) {
    await tulisLog({ nama: sesi.nama, aksi: "keluar", req });
    await kirimBot("Keluar dashboard Webiko\nNama: " + sesi.nama);
  }
  return json(res, 200, { ok: true });
};
