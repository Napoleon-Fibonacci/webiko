/* ============================================================
   Webiko — api/_lib.js
   Helper serverless: sesi admin, Supabase service_role, audit.
   Hanya berjalan di server. Tidak pernah dikirim ke browser.
   ============================================================ */
const crypto = require("node:crypto");

const NAMA_COOKIE = "wg_admin";
const UMUR_COOKIE = 60 * 60 * 8; // 8 jam
const BATAS_COBA = 8;
const JENDELA_COBA = 10 * 60 * 1000; // 10 menit

const percobaan = (globalThis.__wgPercobaan =
  globalThis.__wgPercobaan || new Map());

function konfig() {
  return {
    url: process.env.SUPABASE_URL || "",
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    password: process.env.ADMIN_PASSWORD || "",
    secret: process.env.ADMIN_SESSION_SECRET || "",
  };
}

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

function tandaTangan(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function buatToken(nama, secret) {
  const payload = b64url(
    JSON.stringify({ nama, exp: Date.now() + UMUR_COOKIE * 1000 })
  );
  return payload + "." + tandaTangan(payload, secret);
}

function bacaToken(token, secret) {
  if (!token || !secret) return null;
  const bagian = token.split(".");
  if (bagian.length !== 2) return null;
  const harap = tandaTangan(bagian[0], secret);
  const a = Buffer.from(harap);
  const b = Buffer.from(bagian[1]);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const isi = JSON.parse(Buffer.from(bagian[0], "base64url").toString("utf8"));
    if (!isi || typeof isi.nama !== "string") return null;
    if (typeof isi.exp !== "number" || isi.exp < Date.now()) return null;
    return isi;
  } catch {
    return null;
  }
}

function ambilCookie(req, nama) {
  const mentah = req.headers.cookie || "";
  for (const bagian of mentah.split(";")) {
    const pos = bagian.indexOf("=");
    if (pos < 0) continue;
    if (bagian.slice(0, pos).trim() === nama) {
      return decodeURIComponent(bagian.slice(pos + 1).trim());
    }
  }
  return "";
}

function setCookie(res, nilai, umur) {
  const bagian = [
    `${NAMA_COOKIE}=${encodeURIComponent(nilai)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    `Max-Age=${umur}`,
  ];
  res.setHeader("Set-Cookie", bagian.join("; "));
}

function hapusCookie(res) {
  setCookie(res, "", 0);
}

function sesiDari(req) {
  const { secret } = konfig();
  return bacaToken(ambilCookie(req, NAMA_COOKIE), secret);
}

function passwordCocok(masuk, target) {
  if (typeof masuk !== "string" || typeof target !== "string") return false;
  const a = Buffer.from(masuk);
  const b = Buffer.from(target);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function ipDari(req) {
  const maju = req.headers["x-forwarded-for"];
  if (typeof maju === "string" && maju) return maju.split(",")[0].trim();
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : "";
}

function bolehCoba(req) {
  const ip = ipDari(req) || "?";
  const sekarang = Date.now();
  const daftar = (percobaan.get(ip) || []).filter(
    (t) => sekarang - t < JENDELA_COBA
  );
  if (daftar.length >= BATAS_COBA) {
    percobaan.set(ip, daftar);
    return false;
  }
  daftar.push(sekarang);
  percobaan.set(ip, daftar);
  if (percobaan.size > 2000) percobaan.clear();
  return true;
}

async function sbFetch(path, opsi = {}) {
  const { url, service } = konfig();
  if (!url || !service) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi");
  }
  const {
    method = "GET",
    body,
    prefer = "return=representation",
    headers = {},
  } = opsi;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      "Content-Type": "application/json",
      Prefer: prefer,
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const teks = await res.text();
  let data = null;
  try {
    data = teks ? JSON.parse(teks) : null;
  } catch {
    data = teks;
  }
  if (!res.ok) {
    throw new Error(
      "Supabase " + res.status + ": " +
        (typeof data === "string" ? data : JSON.stringify(data))
    );
  }
  return data;
}

/* Panggilan ke Supabase Auth. Tanpa `token`, memakai service_role
   (mis. hapus user dari dashboard admin). Dengan `token`, memakai
   JWT pengguna (mis. memastikan pemilik sesi saat hapus akun sendiri). */
async function authFetch(path, opsi = {}) {
  const { url, service } = konfig();
  if (!url || !service) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi");
  }
  const { method = "GET", body, token = "", headers = {} } = opsi;
  const res = await fetch(`${url}/auth/v1/${path}`, {
    method,
    headers: {
      apikey: service,
      Authorization: `Bearer ${token || service}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const teks = await res.text();
  let data = null;
  try {
    data = teks ? JSON.parse(teks) : null;
  } catch {
    data = teks;
  }
  if (!res.ok) {
    const galat = new Error(
      "Supabase Auth " + res.status + ": " +
        (typeof data === "string" ? data : JSON.stringify(data))
    );
    galat.status = res.status;
    throw galat;
  }
  return data;
}

async function tulisLog({ nama, aksi, req }) {
  try {
    await sbFetch("admin_log", {
      method: "POST",
      body: {
        nama: String(nama || "").slice(0, 40),
        aksi: String(aksi || "masuk").slice(0, 20),
        ip: ipDari(req).slice(0, 80),
        user_agent: String(req.headers["user-agent"] || "").slice(0, 300),
      },
      prefer: "return=minimal",
    });
  } catch (err) {
    console.error("[admin_log]", err.message);
  }
}

async function kirimBot(teks) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: teks }),
    });
  } catch (err) {
    console.error("[telegram]", err.message);
  }
}

function wajibPost(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { error: "Metode tidak didukung." });
    return false;
  }
  return true;
}

function wajibSesi(req, res) {
  const sesi = sesiDari(req);
  if (!sesi) {
    json(res, 401, { error: "Belum masuk." });
    return null;
  }
  return sesi;
}

module.exports = {
  konfig,
  json,
  buatToken,
  bacaToken,
  setCookie,
  hapusCookie,
  sesiDari,
  passwordCocok,
  ipDari,
  bolehCoba,
  sbFetch,
  authFetch,
  tulisLog,
  kirimBot,
  wajibPost,
  wajibSesi,
  UMUR_COOKIE,
};
