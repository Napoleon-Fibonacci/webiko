/* ============================================================
   Webiko — api/analytics.js
   GET -> ringkasan GA4 untuk dashboard admin.
   Kredensial service account hanya di env server.
   ============================================================ */
const crypto = require("node:crypto");
const { json, wajibSesi } = require("./_lib");

let simpanToken = { nilai: "", kedaluwarsa: 0 };

function ambilEnv() {
  return {
    properti: process.env.GA_PROPERTY_ID || "",
    email: process.env.GA_CLIENT_EMAIL || "",
    kunci: (process.env.GA_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  };
}

function b64(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

async function tokenAkses(email, kunci) {
  if (simpanToken.nilai && simpanToken.kedaluwarsa > Date.now() + 60000) {
    return simpanToken.nilai;
  }
  const sekarang = Math.floor(Date.now() / 1000);
  const isi =
    b64({ alg: "RS256", typ: "JWT" }) +
    "." +
    b64({
      iss: email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: sekarang,
      exp: sekarang + 3600,
    });
  const tanda = crypto.createSign("RSA-SHA256").update(isi).sign(kunci, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: isi + "." + tanda,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "Gagal token GA");
  simpanToken = {
    nilai: data.access_token,
    kedaluwarsa: Date.now() + (Number(data.expires_in) || 3600) * 1000,
  };
  return simpanToken.nilai;
}

async function laporan(properti, token, body) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${properti}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Gagal ambil GA");
  return data;
}

module.exports = async (req, res) => {
  if (!wajibSesi(req, res)) return;

  const { properti, email, kunci } = ambilEnv();
  if (!properti || !email || !kunci) {
    return json(res, 200, {
      tersedia: false,
      alasan: "GA_PROPERTY_ID / GA_CLIENT_EMAIL / GA_PRIVATE_KEY belum diisi.",
    });
  }

  try {
    const token = await tokenAkses(email, kunci);
    const dasar = { dateRanges: [{ startDate: "13daysAgo", endDate: "today" }] };

    const [seri, halaman] = await Promise.all([
      laporan(properti, token, {
        ...dasar,
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "screenPageViews" },
          { name: "sessions" },
        ],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      laporan(properti, token, {
        ...dasar,
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 8,
      }),
    ]);

    const ubahTanggal = (t) => t.slice(0, 4) + "-" + t.slice(4, 6) + "-" + t.slice(6, 8);
    const deret = (seri.rows || []).map((r) => ({
      tanggal: ubahTanggal(r.dimensionValues[0].value),
      pengunjung: Number(r.metricValues[0].value) || 0,
      tampilan: Number(r.metricValues[1].value) || 0,
      sesi: Number(r.metricValues[2].value) || 0,
    }));

    const jumlah = (daftar, kunci) =>
      daftar.reduce((n, x) => n + (Number(x[kunci]) || 0), 0);

    return json(res, 200, {
      tersedia: true,
      seri: deret,
      halaman: (halaman.rows || []).map((r) => ({
        path: r.dimensionValues[0].value,
        tampilan: Number(r.metricValues[0].value) || 0,
      })),
      total14: jumlah(deret, "tampilan"),
      tujuhHari: jumlah(deret.slice(-7), "tampilan"),
      sebelumnya7: jumlah(deret.slice(0, 7), "tampilan"),
      pengunjung7: jumlah(deret.slice(-7), "pengunjung"),
    });
  } catch (err) {
    console.error("[analytics]", err.message);
    return json(res, 502, { error: "Gagal mengambil data GA." });
  }
};
