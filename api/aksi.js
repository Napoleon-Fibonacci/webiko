/* ============================================================
   Webiko — api/aksi.js
   POST { jenis, id, nilai } -> moderasi dari dashboard admin.
   jenis: "saran-dibaca" | "komentar-sembunyi"
        | "komentar-setujui" | "pengguna-hapus"
   ============================================================ */
const {
  authFetch,
  json,
  sbFetch,
  tulisLog,
  wajibPost,
  wajibSesi,
} = require("./_lib");

const POLA_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

module.exports = async (req, res) => {
  if (!wajibPost(req, res)) return;
  const sesi = wajibSesi(req, res);
  if (!sesi) return;

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const id = String(body.id || "");
    const nilai = Boolean(body.nilai);

    if (!id) return json(res, 400, { error: "id wajib." });

    if (body.jenis === "saran-dibaca") {
      await sbFetch("suggestions?id=eq." + encodeURIComponent(id), {
        method: "PATCH",
        body: { dibaca: nilai },
        prefer: "return=minimal",
      });
      return json(res, 200, { ok: true });
    }

    if (body.jenis === "komentar-sembunyi") {
      await sbFetch("comments?id=eq." + encodeURIComponent(id), {
        method: "PATCH",
        body: { hidden: nilai },
        prefer: "return=minimal",
      });
      return json(res, 200, { ok: true });
    }

    if (body.jenis === "komentar-setujui") {
      await sbFetch("comments?id=eq." + encodeURIComponent(id), {
        method: "PATCH",
        body: { disetujui: nilai },
        prefer: "return=minimal",
      });
      return json(res, 200, { ok: true });
    }

    if (body.jenis === "pengguna-hapus") {
      if (!POLA_UUID.test(id)) {
        return json(res, 400, { error: "id pengguna tidak valid." });
      }

      await authFetch("admin/users/" + encodeURIComponent(id), {
        method: "DELETE",
      });
      await tulisLog({ nama: sesi.nama, aksi: "hapus-akun", req });
      return json(res, 200, { ok: true });
    }

    return json(res, 400, { error: "jenis tidak dikenal." });
  } catch (err) {
    console.error("[aksi]", err.message);
    return json(res, 500, { error: "Gagal menyimpan." });
  }
};
