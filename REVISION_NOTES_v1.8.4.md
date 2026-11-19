# CAZGO ChargeTrack Maintenance v1.8.4 — Master Technician Assignment

## Perubahan
- Kolom Teknisi pada form Work Order / Corrective Maintenance, Preventive Maintenance, dan Inspection & Checklist menggunakan dropdown dari koleksi Master Technician di Firestore.
- Hanya teknisi aktif dan tidak diarsipkan yang tersedia untuk penugasan.
- Tidak ada lagi pengisian otomatis nama teknisi berdasarkan akun pengguna yang sedang login.
- Form baru menampilkan placeholder `Pilih Teknisi`; penugasan tetap opsional.
- Penyimpanan transaksi mempertahankan nama teknisi dan menyimpan ID Master Technician serta email (jika tersedia) sebagai referensi.
- Form edit Work Order juga menggunakan daftar Master Technician. Nama teknisi historis yang tidak lagi aktif tetap dipertahankan sebagai data lama sampai pengguna memilih teknisi aktif lain.
- Tombol `Buat PM` dari jadwal membawa penugasan teknisi yang sudah ada ke form Work Order.

## Data & kompatibilitas
- Tidak membuat koleksi baru dan tidak mengubah nama koleksi Firebase.
- Data Master Technician tetap menggunakan koleksi yang sudah ada (`MAINTENANCE_COLLECTIONS.technicians`).
- Field nama lama (`technicianName` / `assignedTechnician`) tetap dipertahankan untuk kompatibilitas tabel, laporan, dan histori.
- Field referensi tambahan: `technicianId`, `technicianEmail`, `assignedTechnicianId`, dan `assignedTechnicianEmail`.
- Data transaksi lama tidak dimigrasikan atau ditulis ulang.

## Pengujian
- Periksa lint dan build pada Windows setelah menyalin source.
- Uji dropdown pada ketiga form, nonaktifkan satu teknisi dan pastikan tidak muncul pada pilihan form baru.
- Pastikan penugasan yang disimpan muncul pada register, histori, dan laporan.
