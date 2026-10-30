/* ============================================================
   Webiko — assets/js/supabase.js
   Klien Supabase (ESM, tanpa build step).

   Kredensial TIDAK disimpan di sini. Buat file
   assets/js/supabase-config.js (di-.gitignore) yang mengisi
   window.__ENV__ (atau window.SUPABASE_URL / window.SUPABASE_ANON_KEY)
   sebelum modul ini dimuat. Di Vercel situs ini statis tanpa build
   step, jadi file itu di-commit ke deployment dengan nilai production
   (bukan ke repo). Lihat supabase-config.example.js.

   Pemakaian:
     <script src="assets/js/supabase-config.js"></script>
     <script type="module" src="assets/js/main.js"></script>

     // di dalam modul:
     import { supabase, getSession, signUp } from "./supabase.js";
   ============================================================ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Domain email sintetis. Supabase Auth memakai email, sedangkan
 * user kami mendaftar dengan username saja, jadi username dipetakan
 * ke `<username>@webiko.local`.
 */
export const SYNTHETIC_EMAIL_DOMAIN = "webiko.local";

// window.__ENV__ = mekanisme utama (lihat supabase-config.example.js).
// window.SUPABASE_URL / window.SUPABASE_ANON_KEY = alias lama.
const ENV = window.__ENV__ ?? {};

const SUPABASE_URL = ENV.SUPABASE_URL || window.SUPABASE_URL;
const SUPABASE_ANON_KEY = ENV.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Dibiarkan kosong membuat error ini tidak merusak modul lain saat
  // ada build/CI; config lokal (supabase-config.js) wajib diisi.
  console.error(
    "[supabase] window.__ENV__.SUPABASE_URL / window.__ENV__.SUPABASE_ANON_KEY belum diisi. " +
      "Salin assets/js/supabase-config.example.js menjadi " +
      "assets/js/supabase-config.js dan isi nilainya."
  );
}

/** @type {import("https://esm.sh/@supabase/supabase-js@2")} */
export const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_ANON_KEY ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Username -> email sintetis. Lowercase supaya konsisten. */
export function usernameToEmail(username) {
  return `${String(username).trim().toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

function assertValidUsername(username) {
  if (!USERNAME_PATTERN.test(String(username ?? "").trim())) {
    throw new Error(
      "Username harus 3-20 karakter dan hanya boleh huruf, angka, atau underscore."
    );
  }
}

/** Ambil session aktif, atau null bila belum login. */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Login dengan username + password.
 * @returns {Promise<import("https://esm.sh/@supabase/supabase-js@2").Session>}
 */
export async function signIn(username, password) {
  assertValidUsername(username);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
  if (error) throw error;
  return data.session;
}

/**
 * Registrasi dengan username + password saja.
 * Memeriksa username belum dipakai (case-insensitive) sebelum
 * memanggil signUp, karena email sintetisnya bisa bertabrakan.
 */
export async function signUp(username, password) {
  const name = String(username ?? "").trim();
  assertValidUsername(name);

  const { data: taken, error: takenError } = await supabase.rpc("username_taken", {
    p_username: name,
  });
  if (takenError) throw takenError;
  if (taken) throw new Error("Username sudah dipakai, coba yang lain.");

  const { data, error } = await supabase.auth.signUp({
    email: usernameToEmail(name),
    password,
    options: { data: { username: name } },
  });
  if (error) throw error;
  return data;
}

/** Logout dan hapus session lokal. */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
