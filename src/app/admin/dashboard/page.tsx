"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Film,
    Settings,
    LogOut,
    Database,
    Activity,
    TrendingUp
} from "lucide-react";

interface Stats {
    totalDramas: number;
    totalUsers: number;
    totalPlatforms: number;
    lastSync: string;
    apkUrl?: string; // Derived from config
}

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const isAdmin = sessionStorage.getItem("admin_authenticated");
        if (isAdmin !== "true") {
            router.replace("/admin");
            return;
        }

        // Fetch stats
        fetchStats();
    }, [router]);

    const fetchStats = async () => {
        try {
            const [statsRes, configRes] = await Promise.all([
                fetch("/api/admin/stats"),
                fetch("/api/admin/config")
            ]);

            if (statsRes.ok && configRes.ok) {
                const statsData = await statsRes.json();
                const configData = await configRes.json();
                setStats({ ...statsData, apkUrl: configData.apk_url });
            }
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("admin_authenticated");
        router.push("/admin");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-gray-800 border-r border-gray-700 p-4">
                <div className="mb-8">
                    <h1 className="text-xl font-bold text-white">🎬 Dracinku Admin</h1>
                </div>

                <nav className="space-y-2">
                    <a href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 text-white bg-primary/20 rounded-lg">
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                    </a>
                    <a href="/admin/users" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                        <Users className="w-5 h-5" />
                        <span>Pengguna</span>
                    </a>
                    <a href="/admin/content" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                        <Film className="w-5 h-5" />
                        <span>Konten</span>
                    </a>
                    <a href="/admin/settings" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                        <Settings className="w-5 h-5" />
                        <span>Pengaturan</span>
                    </a>
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Drama</p>
                                <p className="text-3xl font-bold text-white">{stats?.totalDramas ?? "-"}</p>
                            </div>
                            <Film className="w-10 h-10 text-primary opacity-50" />
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Pengguna</p>
                                <p className="text-3xl font-bold text-white">{stats?.totalUsers ?? "-"}</p>
                            </div>
                            <Users className="w-10 h-10 text-green-500 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Platform</p>
                                <p className="text-3xl font-bold text-white">{stats?.totalPlatforms ?? 6}</p>
                            </div>
                            <Database className="w-10 h-10 text-yellow-500 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Last Sync</p>
                                <p className="text-lg font-bold text-white">{stats?.lastSync ?? "Never"}</p>
                            </div>
                            <Activity className="w-10 h-10 text-blue-500 opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Settings Section */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mt-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Aplikasi Android
                    </h3>
                    <div className="max-w-xl">
                        <label className="block text-sm font-medium text-gray-400 mb-2">APK Download Link</label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={stats?.apkUrl || ''}
                                onChange={(e) => setStats(prev => prev ? { ...prev, apkUrl: e.target.value } : null)}
                                className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
                                placeholder="https://..."
                            />
                            <button
                                onClick={async () => {
                                    if (!stats?.apkUrl) return;
                                    try {
                                        const res = await fetch('/api/admin/config', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ apk_url: stats.apkUrl })
                                        });
                                        if (res.ok) alert('APK Link Updated!');
                                        else alert('Failed to update');
                                    } catch (e) {
                                        alert('Error updating link');
                                    }
                                }}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Link ini akan digunakan pada tombol "Get App" di website.</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => fetch("/api/cron").then(() => fetchStats())}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                        >
                            🔄 Trigger Sync
                        </button>
                        <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                            📊 Export Data
                        </button>
                        <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                            🧹 Clear Cache
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
