"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/app/admin/components/AdminLayout";
import { Settings, Save } from "lucide-react";

export default function AdminSettingsPage() {
    const [apkUrl, setApkUrl] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch("/api/admin/config");
            if (res.ok) {
                const data = await res.json();
                setApkUrl(data.apk_url || "");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apk_url: apkUrl })
            });
            if (res.ok) alert('Settings Saved!');
            else alert('Failed to save');
        } catch (e) {
            alert('Error saving settings');
        }
    };

    return (
        <AdminLayout title="Pengaturan">
            <div className="max-w-2xl bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Konfigurasi Aplikasi
                </h3>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Android APK Link</label>
                        <p className="text-xs text-gray-500 mb-3">
                            Link ini akan digunakan untuk tombol download di website. Pastikan link direct download (akhir .apk).
                        </p>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={apkUrl}
                                onChange={(e) => setApkUrl(e.target.value)}
                                className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary placeholder:text-gray-600"
                                placeholder="https://example.com/app.apk"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-700 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
                        >
                            <Save className="w-4 h-4" />
                            Simpan Perubahan
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
