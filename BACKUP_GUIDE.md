# DracinBox Backup & Rollback Guide

## 📌 Stable Versions

### v1.0-stable-no-login (Recommended Backup)
- **Date:** 2026-02-03
- **Commit:** `d0ed6b3`
- **Git Tag:** `v1.0-stable-no-login`
- **Features:**
  - ✅ Semua video bisa diputar tanpa login
  - ✅ Google OAuth sudah berfungsi (opsional)
  - ✅ Auth callback sudah diperbaiki
  - ✅ Suspense boundary untuk watch pages
  - ✅ Semua sumber video berfungsi (ReelShort, NetShort, DramaBox, FreeReels, Melolo, FlickReels)
  - ✅ Admin panel berfungsi
  - ✅ Performa cepat

---

## 🔄 How to Rollback

### Quick Rollback (Deploy versi lama)
```bash
# Di folder dracinbos
git checkout v1.0-stable-no-login
npx vercel --prod --yes
```

### Safe Rollback (Buat branch baru)
```bash
# Buat branch dari stable version
git checkout -b rollback-stable v1.0-stable-no-login

# Deploy
npx vercel --prod --yes
```

### Emergency Rollback (Via Vercel Dashboard)
1. Buka https://vercel.com/dashboard
2. Pilih project dracinbos
3. Klik "Deployments"
4. Cari deployment dengan commit `d0ed6b3`
5. Klik "..." → "Promote to Production"

---

## 📝 Version History

| Version | Commit | Tanggal | Fitur Utama |
|---------|--------|---------|-------------|
| v1.0-stable-no-login | d0ed6b3 | 2026-02-03 | Semua fitur tanpa mandatory login |
| current | ed0bae1 | 2026-02-03 | + Mandatory login untuk watch |

---

## ⚠️ Notes

- Selalu buat tag baru sebelum fitur besar
- Format tag: `v{major}.{minor}-{deskripsi}`
- Contoh: `v1.1-with-premium`, `v1.2-ads-integrated`
