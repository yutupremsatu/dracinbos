# DracinBox Backup & Rollback Guide

## 📌 Stable Versions

### v1.1-stable (TERBARU)
- **Date:** 2026-02-03
- **Commit:** `5be62ae`
- **Git Tag:** `v1.1-stable`
- **Features:**
  - ✅ Rebranding ke **Dracinku** dengan logo baru
  - ✅ Neon Cyberpunk style (glow effects)
  - ✅ Admin Users API sudah berfungsi
  - ✅ Semua video bisa diputar tanpa login
  - ✅ Google OAuth berfungsi (opsional)
  - ✅ Cron job update database harian aktif

### v1.0-stable-no-login (BACKUP LAMA)
- **Date:** 2026-02-03
- **Commit:** `d0ed6b3`
- **Git Tag:** `v1.0-stable-no-login`
- **Features:**
  - ✅ Nama masih DracinBox
  - ✅ Semua video bisa diputar tanpa login
  - ✅ Google OAuth sudah berfungsi (opsional)

---

## 🔄 How to Rollback

### Rollback ke v1.1 (Dracinku)
```bash
git checkout v1.1-stable
npx vercel --prod --yes
```

### Rollback ke v1.0 (DracinBox lama)
```bash
git checkout v1.0-stable-no-login
npx vercel --prod --yes
```

### Emergency Rollback (Via Vercel Dashboard)
1. Buka https://vercel.com/dashboard
2. Pilih project dracinbos
3. Klik "Deployments"
4. Cari deployment yang diinginkan
5. Klik "..." → "Promote to Production"

---

## 📝 Version History

| Version | Tag | Tanggal | Fitur Utama |
|---------|-----|---------|-------------|
| v1.1 | v1.1-stable | 2026-02-03 | Dracinku rebranding, neon style, admin users API |
| v1.0 | v1.0-stable-no-login | 2026-02-03 | DracinBox, semua fitur dasar |

---

## ⚠️ Notes

- Selalu buat tag baru sebelum fitur besar
- Format tag: `v{major}.{minor}-stable`
- Contoh: `v1.2-stable`, `v2.0-stable`
