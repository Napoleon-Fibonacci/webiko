/* ============================================================
   Webiko — assets/js/admin.js
   Dashboard admin. Semua data lewat /api (cookie HttpOnly).
   ============================================================ */
(function () {
  "use strict";

  var $ = function (sel, akar) {
    return (akar || document).querySelector(sel);
  };

  var login = $("#login");
  var dash = $("#dash");
  var form = $("#form-login");
  var error = $("#login-error");
  var tombolMasuk = $("#login-tombol");
  var namaAdmin = $("#admin-nama");
  var tombolKeluar = $("#admin-keluar");
  var semuaPengguna = [];

  function esc(nilai) {
    return String(nilai == null ? "" : nilai).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }

  function waktu(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function api(path, opsi) {
    var jawab = await fetch(path, opsi || {});
    var data = {};
    try {
      data = await jawab.json();
    } catch (e) {
      data = {};
    }
    if (!jawab.ok) {
      throw new Error(data.error || "Permintaan gagal.");
    }
    return data;
  }

  function tampilDash(nama) {
    login.hidden = true;
    dash.hidden = false;
    namaAdmin.textContent = nama;
    namaAdmin.hidden = false;
    tombolKeluar.hidden = false;
    muat();
  }

  function tampilLogin() {
    dash.hidden = true;
    login.hidden = false;
    namaAdmin.hidden = true;
    tombolKeluar.hidden = true;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    error.textContent = "";
    tombolMasuk.disabled = true;
    tombolMasuk.textContent = "Memeriksa…";
    try {
      var data = new FormData(form);
      var hasil = await api("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: String(data.get("nama") || "").trim(),
          sandi: String(data.get("sandi") || ""),
        }),
      });
      form.reset();
      tampilDash(hasil.nama);
    } catch (err) {
      error.textContent = err.message;
    } finally {
      tombolMasuk.disabled = false;
      tombolMasuk.textContent = "Masuk";
    }
  });

  tombolKeluar.addEventListener("click", async function () {
    try {
      await api("/api/logout", { method: "POST" });
    } catch (e) {
      /* tetap kembali ke form */
    }
    tampilLogin();
  });

  $("#muat-ulang").addEventListener("click", muat);

  $("#cari-pengguna").addEventListener("input", function () {
    renderPengguna(this.value);
  });

  dash.addEventListener("click", async function (e) {
    var tombol = e.target.closest("[data-aksi]");
    if (!tombol) return;

    var jenis = tombol.getAttribute("data-aksi");
    if (jenis === "pengguna-hapus") {
      var nama = tombol.getAttribute("data-nama") || "";
      var ketik = window.prompt(
        'Ketik username "' + nama + '" untuk menghapus akun ini secara permanen:'
      );
      if (ketik !== nama) {
        if (ketik !== null) {
          window.alert("Username tidak cocok. Penghapusan dibatalkan.");
        }
        return;
      }
    }

    tombol.disabled = true;
    try {
      await api("/api/aksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenis: jenis,
          id: tombol.getAttribute("data-id"),
          nilai: tombol.getAttribute("data-nilai") === "true",
        }),
      });
      await muat();
    } catch (err) {
      window.alert(err.message);
      tombol.disabled = false;
    }
  });

  function renderRingkasan(r, menunggu) {
    var kartu = [
      ["Anggota", r.anggota, "total terdaftar", false],
      ["Baru 7 hari", r.baru7, r.baru30 + " dalam 30 hari", false],
      ["Aktif 7 hari", r.aktif7, "belajar atau kuis", false],
      ["Bab selesai", r.babSelesai, "seluruh pengguna", false],
      ["Komentar", r.komentar, menunggu + " menunggu", false],
      ["Saran baru", r.saranBaru, "belum dibaca", true],
    ];
    $("#stat-grid").innerHTML = kartu
      .map(function (k) {
        return (
          '<article class="stat' + (k[3] ? " stat--sorot" : "") + '">' +
          '<p class="stat__label">' + esc(k[0]) + "</p>" +
          '<p class="stat__nilai">' + esc(k[1]) + "</p>" +
          '<p class="stat__ket">' + esc(k[2]) + "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function grafik(deret, kunci) {
    var maks = Math.max.apply(
      null,
      deret.map(function (d) {
        return d[kunci] || 0;
      }).concat([1])
    );
    return (
      '<div class="grafik" role="img" aria-label="Grafik 14 hari">' +
      deret
        .map(function (d, i) {
          var tinggi = Math.round(((d[kunci] || 0) / maks) * 100);
          return (
            '<div class="grafik__kolom" title="' +
            esc(d.tanggal) + ": " + esc(d[kunci] || 0) + '">' +
            '<div class="grafik__batang' + (i >= deret.length - 7 ? " grafik__batang--aktif" : "") +
            '" style="height:' + tinggi + '%"></div>' +
            '<span class="grafik__label">' + esc(d.tanggal.slice(8)) + "</span>" +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderTrafik(ga) {
    var kotak = $("#trafik");
    if (!ga || !ga.tersedia) {
      $("#trafik-ket").textContent = "Google Analytics belum aktif";
      kotak.innerHTML =
        '<p class="kosong">' +
        esc((ga && ga.alasan) || "Data GA tidak tersedia.") +
        "</p>";
      return;
    }

    var beda = ga.sebelumnya7
      ? Math.round(((ga.tujuhHari - ga.sebelumnya7) / ga.sebelumnya7) * 100)
      : null;
    $("#trafik-ket").textContent = "Google Analytics · 7 hari terakhir";

    kotak.innerHTML =
      '<div class="stat-grid">' +
      '<article class="stat"><p class="stat__label">Tampilan 7 hari</p>' +
      '<p class="stat__nilai">' + esc(ga.tujuhHari) + "</p>" +
      '<p class="stat__ket">' +
      (beda === null ? "belum ada pembanding" : (beda >= 0 ? "+" : "") + beda + "% dari 7 hari sebelumnya") +
      "</p></article>" +
      '<article class="stat"><p class="stat__label">Pengunjung 7 hari</p>' +
      '<p class="stat__nilai">' + esc(ga.pengunjung7) + "</p>" +
      '<p class="stat__ket">pengguna aktif</p></article>' +
      "</div>" +
      grafik(ga.seri, "tampilan") +
      '<p class="panel__ket" style="margin-top:var(--space-2)">Batang kuning = 7 hari terakhir.</p>' +
      (ga.halaman.length
        ? '<div class="tabel-bungkus" style="margin-top:var(--space-3)">' +
          '<table class="data"><thead><tr><th>Halaman</th><th class="angka">Tampilan</th></tr></thead><tbody>' +
          ga.halaman
            .map(function (h) {
              return (
                "<tr><td>" + esc(h.path) + "</td>" +
                '<td class="angka">' + esc(h.tampilan) + "</td></tr>"
              );
            })
            .join("") +
          "</tbody></table></div>"
        : "");
  }

  function renderPengguna(cari) {
    var kata = String(cari || "").toLowerCase();
    var baris = semuaPengguna.filter(function (u) {
      return !kata || u.username.toLowerCase().indexOf(kata) >= 0;
    });
    var isi = $("#tabel-pengguna");
    if (!baris.length) {
      isi.innerHTML =
        '<tr><td colspan="6"><p class="kosong">Tidak ada pengguna.</p></td></tr>';
      return;
    }
    isi.innerHTML = baris
      .map(function (u) {
        return (
          "<tr><td>" + esc(u.username) + "</td>" +
          '<td class="angka">' + esc(u.babSelesai) + "</td>" +
          '<td class="angka">' + (u.rataSkor == null ? "—" : esc(u.rataSkor)) + "</td>" +
          '<td class="angka">' + esc(u.jumlahKuis) + "</td>" +
          "<td>" + esc(waktu(u.terakhir)) + "</td>" +
          "<td>" +
          '<button class="btn btn--kecil btn--bahaya" type="button" ' +
          'data-aksi="pengguna-hapus" data-id="' + esc(u.id) + '" ' +
          'data-nama="' + esc(u.username) + '">Hapus</button>' +
          "</td></tr>"
        );
      })
      .join("");
  }

  function renderSaran(daftar) {
    var isi = $("#daftar-saran");
    $("#saran-ket").textContent = daftar.length + " kiriman";
    if (!daftar.length) {
      isi.innerHTML = '<p class="kosong">Belum ada saran.</p>';
      return;
    }
    isi.innerHTML = daftar
      .map(function (s) {
        return (
          '<div class="daftar-item">' +
          '<div class="daftar-item__atas">' +
          '<span class="daftar-item__nama">' + esc(s.nama) + "</span>" +
          '<span class="pil ' + (s.dibaca ? "pil--sembunyi" : "pil--tunggu") + '">' +
          (s.dibaca ? "Dibaca" : "Baru") + "</span>" +
          '<span class="daftar-item__waktu">' + esc(waktu(s.created_at)) + "</span>" +
          "</div>" +
          '<p class="daftar-item__isi">' + esc(s.isi) + "</p>" +
          '<div class="daftar-item__aksi">' +
          '<button class="btn btn--kecil" type="button" data-aksi="saran-dibaca" data-id="' +
          esc(s.id) + '" data-nilai="' + (s.dibaca ? "false" : "true") + '">' +
          (s.dibaca ? "Tandai belum dibaca" : "Tandai dibaca") +
          "</button></div></div>"
        );
      })
      .join("");
  }

  function statusKomentar(k) {
    if (k.hidden) return '<span class="pil pil--sembunyi">Disembunyikan</span>';
    if (!k.disetujui) return '<span class="pil pil--tunggu">Menunggu</span>';
    return '<span class="pil pil--tampil">Tampil</span>';
  }

  function renderKomentar(daftar) {
    var isi = $("#daftar-komentar");
    var menunggu = daftar.filter(function (k) {
      return !k.disetujui && !k.hidden;
    }).length;
    $("#komentar-ket").textContent =
      daftar.length + " kiriman · " + menunggu + " menunggu";

    if (!daftar.length) {
      isi.innerHTML = '<p class="kosong">Belum ada komentar.</p>';
      return;
    }

    var urut = daftar.slice().sort(function (a, b) {
      var nilai = function (k) {
        return k.hidden ? 2 : k.disetujui ? 1 : 0;
      };
      return nilai(a) - nilai(b);
    });

    isi.innerHTML = urut
      .map(function (k) {
        var aksi =
          '<button class="btn btn--kecil" type="button" data-aksi="komentar-setujui" data-id="' +
          esc(k.id) + '" data-nilai="' + (k.disetujui ? "false" : "true") + '">' +
          (k.disetujui ? "Batalkan setuju" : "Setujui") + "</button>" +
          '<button class="btn btn--kecil' + (k.hidden ? "" : " btn--bahaya") +
          '" type="button" data-aksi="komentar-sembunyi" data-id="' +
          esc(k.id) + '" data-nilai="' + (k.hidden ? "false" : "true") + '">' +
          (k.hidden ? "Tampilkan" : "Sembunyikan") + "</button>";

        return (
          '<div class="daftar-item">' +
          '<div class="daftar-item__atas">' +
          '<span class="daftar-item__nama">' + esc(k.nama) + "</span>" +
          statusKomentar(k) +
          '<span class="daftar-item__waktu">' + esc(k.bab_id) + " · " + esc(waktu(k.created_at)) + "</span>" +
          "</div>" +
          '<p class="daftar-item__isi">' + esc(k.isi) + "</p>" +
          '<div class="daftar-item__aksi">' + aksi + "</div></div>"
        );
      })
      .join("");
  }

  function renderLog(daftar) {
    var isi = $("#tabel-log");
    if (!daftar.length) {
      isi.innerHTML =
        '<tr><td colspan="5"><p class="kosong">Belum ada catatan.</p></td></tr>';
      return;
    }
    isi.innerHTML = daftar
      .map(function (l) {
        return (
          "<tr><td>" + esc(l.nama) + "</td>" +
          "<td>" + esc(l.aksi) + "</td>" +
          "<td>" + esc(l.ip) + "</td>" +
          "<td>" + esc(String(l.user_agent || "").slice(0, 40)) + "</td>" +
          "<td>" + esc(waktu(l.created_at)) + "</td></tr>"
        );
      })
      .join("");
  }

  async function muat() {
    $("#dash-sub").textContent = "Memuat data…";
    try {
      var hasil = await Promise.all([
        api("/api/data"),
        api("/api/analytics").catch(function (err) {
          return { tersedia: false, alasan: err.message };
        }),
      ]);
      var data = hasil[0];
      semuaPengguna = data.pengguna;
      renderRingkasan(data.ringkasan, data.ringkasan.komentarMenunggu);
      renderPengguna($("#cari-pengguna").value);
      renderSaran(data.saran);
      renderKomentar(data.komentar);
      renderLog(data.log);
      renderTrafik(hasil[1]);
      $("#dash-sub").textContent =
        "Diperbarui " + new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
    } catch (err) {
      $("#dash-sub").textContent = err.message;
      if (/Belum masuk|401/.test(err.message)) tampilLogin();
    }
  }

  api("/api/sesi")
    .then(function (s) {
      if (s.masuk) tampilDash(s.nama);
      else tampilLogin();
    })
    .catch(tampilLogin);
})();
