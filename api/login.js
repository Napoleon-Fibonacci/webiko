/* ============================================================
   Webiko — api/login.js
   POST { nama, sandi } -> cookie sesi admin.
   Password hanya dibandingkan di server (env ADMIN_PASSWORD).
   ============================================================ */
const {
  konfig,
  json,
  buatToken,
  setCookie,
  passwordCocok,
  ipDari,
  bolehCoba,
  sbFetch,
  tulisLog,
  kirimBot,
  wajibPost,
  UMUR_COOKIE,
} = require("./_lib");

async function terlaluBanyakGagal(ip) {
  const batas = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const baris = await sbFetch(
    "admin_log?select=id&aksi=eq.gagal&limit=8" +
      "&ip=eq." + encodeURIComponent(ip) +
      "&created_at=gte." + encodeURIComponent(batas)
  );
  return Array.isArray(baris) && baris.length >= 8;
}

module.exports = async (req, res) => {
  if (!wajibPost(req, res)) return;

  const { password, secret } = konfig();
  if (!password || !secret) {
    return json(res, 500, {
      error: "Server belum dikonfigurasi (ADMIN_PASSWORD / ADMIN_SESSION_SECRET).",
    });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const nama = String(body.nama || "").trim().slice(0, 40);
    const sandi = String(body.sandi || "");

    if (nama.length < 1) {
      return json(res, 400, { error: "Nama wajib diisi." });
    }
    if (!bolehCoba(req) || (await terlaluBanyakGagal(ipDari(req)))) {
      return json(res, 429, {
        error: "Terlalu banyak percobaan. Coba lagi 10 menit.",
      });
    }
    if (!passwordCocok(sandi, password)) {
      await tulisLog({ nama, aksi: "gagal", req });
      return json(res, 401, { error: "Password salah." });
    }

    setCookie(res, buatToken(nama, secret), UMUR_COOKIE);
    await tulisLog({ nama, aksi: "masuk", req });
    await kirimBot(
      "Masuk dashboard Webiko\nNama: " + nama +
        "\nIP: " + (ipDari(req) || "?")
    );
    return json(res, 200, { ok: true, nama });
  } catch (err) {
    console.error("[login]", err.message);
    return json(res, 500, { error: "Gagal masuk." });
  }
};
