/* ============================================================
   Webiko — api/hapus-akun.js
   POST -> hapus akun milik sesi Supabase yang sedang aktif.
   Token pengguna diverifikasi ke Supabase Auth, lalu user dihapus
   dengan service_role. Semua tabel ikut terhapus lewat cascade.

   Hanya menerima header Authorization: Bearer <access_token>.
   Tidak menerima id dari body, supaya pengguna tidak bisa
   menghapus akun orang lain.
   ============================================================ */
const { authFetch, json, wajibPost } = require("./_lib");

function tokenDari(req) {
  const header = req.headers.authorization || "";
  const cocok = /^Bearer\s+(.+)$/i.exec(header);
  return cocok ? cocok[1].trim() : "";
}

module.exports = async (req, res) => {
  if (!wajibPost(req, res)) return;

  const token = tokenDari(req);
  if (!token) {
    return json(res, 401, { error: "Sesi tidak ditemukan. Masuk ulang." });
  }

  try {
    const user = await authFetch("user", { token });
    if (!user || !user.id) {
      return json(res, 401, { error: "Sesi tidak valid. Masuk ulang." });
    }

    await authFetch("admin/users/" + encodeURIComponent(user.id), {
      method: "DELETE",
    });

    return json(res, 200, { ok: true });
  } catch (err) {
    console.error("[hapus-akun]", err.message);
    if (err.status === 401 || err.status === 403) {
      return json(res, 401, { error: "Sesi tidak valid. Masuk ulang." });
    }
    return json(res, 500, { error: "Gagal menghapus akun. Coba lagi." });
  }
};
