## Ringkasan Perubahan

Jelaskan secara ringkas perubahan yang dilakukan dan tujuan dari PR ini.

## Tipe Perubahan

- [ ] Perbaikan Bug (`fix`)
- [ ] Fitur Baru (`feat`)
- [ ] Perbaikan Dokumentasi (`docs`)
- [ ] Peningkatan Kinerja / Refactoring (`refactor`)
- [ ] Penambahan / Perbaikan Pengujian (`test`)

## Checklist Kualitas (Sesuai AGENTS.md)

- [ ] Semua teks antarmuka menggunakan bahasa Indonesia di `id.json` (bukan hardcoded).
- [ ] Format mata uang menggunakan helper integer Rupiah `formatRupiah()`.
- [ ] Target sentuh (tap target) semua kontrol interaktif minimal 48 x 48 px.
- [ ] Lulus pengujian unit & integrasi (`pnpm -r test`).
- [ ] Lulus linting & typechecking (`pnpm -r lint && pnpm -r typecheck`).
- [ ] Aplikasi tetap berfungsi 100% offline tanpa jaringan internet.
- [ ] Tidak ada dependensi eksternal berbayar atau telemetry baru yang ditambahkan tanpa persetujuan.
