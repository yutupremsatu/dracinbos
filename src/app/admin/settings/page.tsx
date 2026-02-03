"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { Settings, Save, Users } from "lucide-react";

export default function AdminSettingsPage() {
    const [config, setConfig] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch("/api/admin/config");
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (updates: any) => {
        try {
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-secret': 'G@cor123' },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                alert('Settings Saved!');
                fetchConfig();
            }
            else alert('Failed to save');
        } catch (e) {
            alert('Error saving settings');
        }
    };

    return (
        <AdminLayout title="Pengaturan">
            <div className="max-w-2xl space-y-6">
                {/* APK Config */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary" />
                        Aplikasi Android
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Android APK Link</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={config.apk_url || ""}
                                    onChange={(e) => setConfig({ ...config, apk_url: e.target.value })}
                                    className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary placeholder:text-gray-600"
                                    placeholder="https://example.com/app.apk"
                                />
                                <button
                                    onClick={() => handleSave({ apk_url: config.apk_url })}
                                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
                                >
                                    <Save className="w-4 h-4" />
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Access Config */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-500" />
                        Akses & Membership
                    </h3>

                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                        <div>
                            <p className="font-medium text-white">Premium Mode</p>
                            <p className="text-sm text-gray-400">Jika ON, hanya Whitelisted/Premium yang bisa menonton.</p>
                        </div>
                        <button
                            onClick={() => handleSave({ premium_mode: config.premium_mode === 'on' ? 'off' : 'on' })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${config.premium_mode === 'on' ? 'bg-primary' : 'bg-gray-600'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.premium_mode === 'on' ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
