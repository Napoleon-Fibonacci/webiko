/* ============================================================
   Webiko — assets/js/supabase-config.example.js

   CONTOH saja. Salin file ini menjadi:
     assets/js/supabase-config.js
   lalu isi dengan nilai dari Supabase Dashboard →
   Project Settings → API. File hasil salinan sudah di-.gitignore,
   jadi kredensialnya tidak akan ikut ter-commit.

   SUPABASE_URL  : Project URL, contoh https://xxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY : "anon public" key. Key ini memang aman dipakai
                       di browser — keamanan data dijaga oleh RLS
                       (lihat supabase/policies.sql). JANGAN pernah
                       memakai "service_role" key di frontend.

   File ini menghasilkan window.__ENV__ (dibaca supabase.js) dan juga
   mengisi window.SUPABASE_URL / window.SUPABASE_ANON_KEY sebagai
   alias agar kode lama tetap jalan. Tanpa build step: nilainya
   ditulis langsung di file, jadi file yang di-deploy adalah file
   berisi nilai production.
   ============================================================ */

window.__ENV__ = {
  SUPABASE_URL: "https://GANTI-PROJECT-REF.supabase.co",
  SUPABASE_ANON_KEY: "GANTI-DENGAN-ANON-KEY",
};

// Alias lama, tetap didukung.
window.SUPABASE_URL = window.__ENV__.SUPABASE_URL;
window.SUPABASE_ANON_KEY = window.__ENV__.SUPABASE_ANON_KEY;
