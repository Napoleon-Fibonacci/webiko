/* ============================================================
   Webiko — scripts/tulis-config.mjs

   Dijalankan Vercel saat build untuk membuat
   assets/js/supabase-config.js dari Environment Variables.
   File hasilnya tetap di-.gitignore dan tidak pernah masuk repo.

   Variabel yang wajib diisi di Vercel (Production dan Preview):
     SUPABASE_URL       https://<ref>.supabase.co
     SUPABASE_ANON_KEY  anon / public key

   Jangan pernah memakai service_role key. Skrip ini menolaknya.

   Lokal tidak perlu menjalankan ini: cukup salin
   assets/js/supabase-config.example.js sesuai panduan.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";

const AKAR = process.cwd();
const TUJUAN = path.join(AKAR, "assets/js/supabase-config.js");

const url = (process.env.SUPABASE_URL || "").trim();
const kunci = (process.env.SUPABASE_ANON_KEY || "").trim();

function berhenti(pesan) {
  console.error("[tulis-config] " + pesan);
  process.exit(1);
}

if (!url || !kunci) {
  berhenti(
    "SUPABASE_URL dan SUPABASE_ANON_KEY wajib diisi di Vercel → " +
      "Settings → Environment Variables (Production dan Preview)."
  );
}

if (!/^https:\/\/[^\s/]+/.test(url)) {
  berhenti("SUPABASE_URL harus diawali https:// dan tanpa spasi.");
}

// Tolak service_role: payload JWT memuat "role":"service_role".
function peranJwt(nilai) {
  const bagian = nilai.split(".");
  if (bagian.length !== 3) return null;
  try {
    const isi = Buffer.from(
      bagian[1].replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
    return JSON.parse(isi).role || null;
  } catch {
    return null;
  }
}

if (peranJwt(kunci) === "service_role") {
  berhenti(
    "SUPABASE_ANON_KEY berisi service_role. Ganti dengan anon/public key; " +
      "service_role tidak boleh ada di frontend."
  );
}

const isi = [
  "/* Dibuat otomatis oleh scripts/tulis-config.mjs saat build Vercel.",
  "   Jangan diedit di mesin build dan jangan di-commit. */",
  "",
  "window.__ENV__ = {",
  "  SUPABASE_URL: " + JSON.stringify(url) + ",",
  "  SUPABASE_ANON_KEY: " + JSON.stringify(kunci) + ",",
  "};",
  "",
  "window.SUPABASE_URL = window.__ENV__.SUPABASE_URL;",
  "window.SUPABASE_ANON_KEY = window.__ENV__.SUPABASE_ANON_KEY;",
  "",
].join("\r\n");

fs.mkdirSync(path.dirname(TUJUAN), { recursive: true });
fs.writeFileSync(TUJUAN, isi, "utf8");

console.log("[tulis-config] assets/js/supabase-config.js dibuat.");
