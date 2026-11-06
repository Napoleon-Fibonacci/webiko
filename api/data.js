/* ============================================================
   Webiko — api/data.js
   GET -> ringkasan, daftar user, saran, komentar, log admin.
   Hanya untuk sesi admin. Membaca dengan service_role (server).
   ============================================================ */
const { json, sbFetch, wajibSesi } = require("./_lib");

const HARI = 24 * 60 * 60 * 1000;

function tanggal(iso) {
  return String(iso || "").slice(0, 10);
}

function hariTerakhir(jumlah) {
  const hasil = [];
  const sekarang = new Date();
  for (let i = jumlah - 1; i >= 0; i--) {
    const d = new Date(sekarang.getTime() - i * HARI);
    hasil.push(d.toISOString().slice(0, 10));
  }
  return hasil;
}

module.exports = async (req, res) => {
  if (!wajibSesi(req, res)) return;

  try {
    const [profiles, progress, kuis, komentar, saran, log] = await Promise.all([
      sbFetch("profiles?select=id,username,created_at&limit=1000"),
      sbFetch(
        "progress?select=user_id,bab_id,selesai,updated_at&limit=5000"
      ),
      sbFetch(
        "quiz_attempts?select=user_id,bab_id,skor,total,created_at&limit=5000"
      ),
      sbFetch(
        "comments?select=id,bab_id,nama,isi,disetujui,created_at,hidden" +
          "&order=created_at.desc&limit=200"
      ),
      sbFetch(
        "suggestions?select=id,nama,isi,created_at,dibaca" +
          "&order=created_at.desc&limit=100"
      ),
      sbFetch(
        "admin_log?select=nama,aksi,ip,user_agent,created_at" +
          "&order=created_at.desc&limit=50"
      ),
    ]);

    const sekarang = Date.now();
    const batas7 = new Date(sekarang - 7 * HARI).toISOString();
    const batas30 = new Date(sekarang - 30 * HARI).toISOString();

    const peta = new Map();
    for (const p of profiles) {
      peta.set(p.id, {
        id: p.id,
        username: p.username,
        dibuat: p.created_at,
        babSelesai: 0,
        skorTotal: 0,
        jumlahKuis: 0,
        terakhir: null,
      });
    }

    for (const g of progress) {
      const u = peta.get(g.user_id);
      if (!u) continue;
      if (g.selesai) u.babSelesai += 1;
      if (!u.terakhir || g.updated_at > u.terakhir) u.terakhir = g.updated_at;
    }
    for (const q of kuis) {
      const u = peta.get(q.user_id);
      if (!u) continue;
      u.skorTotal += Number(q.skor) || 0;
      u.jumlahKuis += 1;
      if (!u.terakhir || q.created_at > u.terakhir) u.terakhir = q.created_at;
    }

    const pengguna = Array.from(peta.values())
      .map((u) => ({
        id: u.id,
        username: u.username,
        babSelesai: u.babSelesai,
        rataSkor: u.jumlahKuis
          ? Math.round((u.skorTotal / u.jumlahKuis) * 10) / 10
          : null,
        jumlahKuis: u.jumlahKuis,
        terakhir: u.terakhir,
      }))
      .sort(
        (a, b) =>
          b.babSelesai - a.babSelesai ||
          String(b.terakhir || "").localeCompare(String(a.terakhir || "")) ||
          a.username.localeCompare(b.username)
      );

    const aktif7 = pengguna.filter((u) => u.terakhir && u.terakhir >= batas7)
      .length;

    const hari = hariTerakhir(14);
    const daftarHarian = hari.map((t) => ({
      tanggal: t,
      jumlah: profiles.filter((p) => tanggal(p.created_at) === t).length,
    }));
    const aktifHarian = hari.map((t) => {
      const orang = new Set();
      for (const g of progress) {
        if (tanggal(g.updated_at) === t) orang.add(g.user_id);
      }
      for (const q of kuis) {
        if (tanggal(q.created_at) === t) orang.add(q.user_id);
      }
      return { tanggal: t, jumlah: orang.size };
    });

    return json(res, 200, {
      ringkasan: {
        anggota: profiles.length,
        baru7: profiles.filter((p) => p.created_at >= batas7).length,
        baru30: profiles.filter((p) => p.created_at >= batas30).length,
        aktif7,
        babSelesai: progress.filter((g) => g.selesai).length,
        komentar: komentar.length,
        komentarMenunggu: komentar.filter((k) => !k.disetujui && !k.hidden).length,
        saranBaru: saran.filter((s) => !s.dibaca).length,
      },
      grafik: { daftar: daftarHarian, aktif: aktifHarian },
      pengguna: pengguna.slice(0, 300),
      saran,
      komentar,
      log,
    });
  } catch (err) {
    console.error("[data]", err.message);
    return json(res, 500, { error: "Gagal memuat data." });
  }
};
