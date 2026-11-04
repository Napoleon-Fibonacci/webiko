/* ============================================================
   Webiko — api/aksi.js
   POST { jenis, id, nilai } -> moderasi dari dashboard admin.
   jenis: "saran-dibaca" | "komentar-sembunyi"
   ============================================================ */
const { json, sbFetch, wajibPost, wajibSesi } = require("./_lib");

module.exports = async (req, res) => {
  if (!wajibPost(req, res)) return;
  if (!wajibSesi(req, res)) return;

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

    return json(res, 400, { error: "jenis tidak dikenal." });
  } catch (err) {
    console.error("[aksi]", err.message);
    return json(res, 500, { error: "Gagal menyimpan." });
  }
};
